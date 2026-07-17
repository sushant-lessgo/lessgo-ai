// Unified AI client with structured outputs and fallback logic
// Supports both OpenAI and Anthropic with schema-guaranteed responses

import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { openai } from './openaiClient';
import { anthropic } from './anthropicClient';
import { getModelConfig, getProvider, Endpoint } from './modelConfig';

type Message = { role: 'system' | 'user'; content: string };

/**
 * Transform zod-to-json-schema output for Anthropic structured outputs
 * - Removes $schema metadata
 * - Extracts actual schema from definitions wrapper
 * - Adds additionalProperties: false to objects
 */
function transformSchemaForAnthropic(
  rawSchema: Record<string, unknown>
): Record<string, unknown> {
  // Remove $schema metadata
  const { $schema, ...rest } = rawSchema;

  // zod-to-json-schema wraps in definitions when given a name
  // Extract the actual schema from $ref
  if (rest.$ref && rest.definitions) {
    const refName = (rest.$ref as string).replace('#/definitions/', '');
    const actualSchema = (rest.definitions as Record<string, unknown>)[refName];
    if (actualSchema && typeof actualSchema === 'object') {
      return sanitizeSchemaForAnthropic(
        actualSchema as Record<string, unknown>
      );
    }
  }

  // If no wrapper, use the schema directly
  const { definitions, $ref, ...cleanSchema } = rest;
  return sanitizeSchemaForAnthropic(cleanSchema);
}

/**
 * Sanitize schema for Anthropic structured outputs
 * - Adds additionalProperties: false to objects
 * - Removes unsupported constraints (minLength, maxLength, minimum, maximum)
 * - Downgrades minItems > 1 to 1 (only 0 or 1 supported)
 */
function sanitizeSchemaForAnthropic(
  schema: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...schema };

  // Remove unsupported string constraints
  delete result.minLength;
  delete result.maxLength;

  // Remove unsupported number constraints
  delete result.minimum;
  delete result.maximum;
  delete result.multipleOf;

  // Remove propertyNames (from z.record with enum keys)
  delete result.propertyNames;

  // Downgrade minItems > 1 to 1 (Anthropic only supports 0 or 1)
  if (typeof result.minItems === 'number' && result.minItems > 1) {
    result.minItems = 1;
  }

  // Add additionalProperties: false for objects
  if (result.type === 'object' && result.properties) {
    result.additionalProperties = false;
    const props = result.properties as Record<string, Record<string, unknown>>;
    result.properties = Object.fromEntries(
      Object.entries(props).map(([key, value]) => [
        key,
        sanitizeSchemaForAnthropic(value),
      ])
    );
  }

  // Recurse into array items
  if (result.type === 'array' && result.items) {
    result.items = sanitizeSchemaForAnthropic(
      result.items as Record<string, unknown>
    );
  }

  // Handle anyOf/allOf/oneOf
  for (const key of ['anyOf', 'allOf', 'oneOf']) {
    if (Array.isArray(result[key])) {
      result[key] = (result[key] as Record<string, unknown>[]).map((s) =>
        sanitizeSchemaForAnthropic(s)
      );
    }
  }

  return result;
}

/**
 * Call a model with structured output
 */
async function callModel<T extends z.ZodType>(
  model: string,
  messages: Message[],
  schema: T,
  schemaName: string
): Promise<z.infer<T>> {
  const provider = getProvider(model);

  if (provider === 'openai') {
    // OpenAI v5: parse is on chat.completions directly
    const response = await openai.chat.completions.parse({
      model,
      messages,
      response_format: zodResponseFormat(schema, schemaName),
    });

    const parsed = response.choices[0].message.parsed;
    if (!parsed) {
      throw new Error('OpenAI returned null parsed response');
    }
    return parsed;
  } else {
    // Anthropic with structured outputs (beta) - requires beta endpoint
    const rawSchema = zodToJsonSchema(schema, schemaName);
    const jsonSchema = transformSchemaForAnthropic(
      rawSchema as Record<string, unknown>
    );

    const systemMessage =
      messages.find((m) => m.role === 'system')?.content || '';
    const userMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: 'user' as const,
        content: m.content,
      }));

    const response = await anthropic.beta.messages.create({
      model,
      max_tokens: 8192,
      system: systemMessage,
      messages: userMessages,
      betas: ['structured-outputs-2025-11-13'],
      output_format: {
        type: 'json_schema',
        schema: jsonSchema,
      },
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';
    if (!text) {
      throw new Error('Empty response from Claude');
    }

    return schema.parse(JSON.parse(text));
  }
}

/**
 * Tagged parse failure from the raw-JSON path.
 *
 * - `no_json`   — nothing JSON-shaped found. Message is EXACTLY
 *                 'No JSON found in response' — `src/utils/trackTelemetry.ts:45`
 *                 string-matches it; do NOT rename.
 * - `bad_json`  — a balanced JSON candidate was found but `JSON.parse` rejected it.
 *                 Message keeps the "JSON" marker (telemetry PARSE_SIGNATURE).
 * - `schema`    — reserved: zod validation failures currently surface as the raw
 *                 `ZodError` (callers may inspect `.issues`), so nothing throws
 *                 this kind today.
 *
 * All kinds are CONTENT errors: `isInfrastructureError` returns false for them,
 * so they never buy a paid backup call.
 */
export type AiParseErrorKind = 'no_json' | 'bad_json' | 'schema';

export class AiParseError extends Error {
  readonly kind: AiParseErrorKind;
  constructor(kind: AiParseErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = 'AiParseError';
    this.kind = kind;
    // `cause` via assignment (ES2022 Error.cause not in this lib target)
    (this as Error & { cause?: unknown }).cause = cause;
  }
}

/**
 * Truncation signal from the raw path: the provider stopped because it hit
 * max_tokens AND the output failed to parse. Infrastructure-class (a backup
 * retry can plausibly fix it), unlike AiParseError.
 */
export class AiTruncationError extends Error {
  constructor(model: string, cause?: unknown) {
    super(`Model ${model} response truncated (max_tokens) and did not parse`);
    this.name = 'AiTruncationError';
    (this as Error & { cause?: unknown }).cause = cause;
  }
}

function isZodError(error: unknown): boolean {
  return (
    error instanceof z.ZodError ||
    (error instanceof Error && error.name === 'ZodError')
  );
}

/**
 * Check if error is infrastructure-related (should trigger a paid backup call).
 *
 * Ordering matters: content errors fast-exit false FIRST. Previously the
 * substring matches on '500' and 'length' made this return true for token
 * counts, ids, `maxLength: 500` and EVERY zod too_long/min/maxLength message —
 * buying a second paid call that could never help. Both are removed; the string
 * matcher is a narrowed last resort behind the structured signals.
 *
 * KNOWN ASYMMETRY (accepted, plan phase 1 step 2): the stop/finish-reason seam
 * lives in `callModelRaw` only. The `callModel` / `generateWithSchema` path
 * loses the old 'length'/'max_tokens' string match with no replacement, so
 * truncation there is now non-recoverable. Net effect is still strictly fewer
 * backup calls; wiring the seam into `callModel` is deferred (no regen caller
 * uses that path).
 */
function isInfrastructureError(error: unknown): boolean {
  // 1. Content errors — NEVER infrastructure. Fast-exit before anything else.
  if (
    isZodError(error) ||
    error instanceof AiParseError ||
    error instanceof SyntaxError
  ) {
    return false;
  }

  // 2. Explicit truncation signal (read off the provider response object).
  if (error instanceof AiTruncationError) return true;

  if (typeof error !== 'object' || error === null) return false;

  const err = error as { status?: unknown; code?: unknown; message?: unknown };

  // 3. Structured signals: HTTP status from SDK errors.
  if (typeof err.status === 'number') {
    return [429, 500, 502, 503, 504].includes(err.status);
  }

  // 4. Node/SDK error codes.
  if (typeof err.code === 'string') {
    const code = err.code.toUpperCase();
    if (
      code === 'ECONNREFUSED' ||
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'ENOTFOUND' ||
      code === 'EAI_AGAIN'
    ) {
      return true;
    }
  }

  // 5. Narrowed string matcher — last resort only. '500' and 'length' are
  //    deliberately absent (they matched content errors; see doc comment).
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('rate limit') ||
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('network') ||
      msg.includes('econnrefused') ||
      msg.includes('etimedout') ||
      msg.includes('unavailable') ||
      msg.includes('service unavailable')
    );
  }

  return false;
}

type RawModelResult = {
  text: string;
  /** Provider stopped at the token cap (anthropic stop_reason / openai finish_reason). */
  truncated: boolean;
};

/**
 * Call model without structured outputs - for schemas with z.record() that
 * Anthropic doesn't support (additionalProperties: object)
 *
 * Returns the stop/finish reason alongside the text (seam added for M14: the
 * response object used to be discarded, so truncation was only detectable via
 * fragile message substrings).
 */
async function callModelRaw(
  model: string,
  prompt: string,
  maxTokens = 8192
): Promise<RawModelResult> {
  const provider = getProvider(model);

  if (provider === 'openai') {
    const response = await openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const choice = response.choices[0];
    return {
      text: choice?.message?.content || '',
      truncated: choice?.finish_reason === 'length',
    };
  } else {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = response.content[0];
    return {
      text: content && content.type === 'text' ? content.text : '',
      truncated: response.stop_reason === 'max_tokens',
    };
  }
}

/**
 * Scan `source` for the FIRST complete, brace/bracket-balanced JSON value
 * (object OR top-level array — the array case fixes the known
 * `src/modules/email/sequenceEngine.ts:188` gap). String literals and escapes
 * are respected so braces inside strings don't skew the depth count.
 *
 * Replaces the greedy /(\{[\s\S]*\})/ which spanned from the first `{` to the
 * LAST `}` — mangling any multi-object / prose-trailing response.
 */
function scanBalancedJson(source: string): string | null {
  for (let start = 0; start < source.length; start++) {
    const open = source[start];
    if (open !== '{' && open !== '[') continue;
    const close = open === '{' ? '}' : ']';

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < source.length; i++) {
      const ch = source[i];

      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }

      if (ch === '"') inString = true;
      else if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) return source.slice(start, i + 1);
      }
    }
    // Unbalanced from this opener — try the next one.
  }
  return null;
}

/**
 * Extract a JSON string from raw model text: prefer fenced content, fall back
 * to scanning the whole response. Throws AiParseError('no_json') with the
 * telemetry-matched literal message when nothing is found.
 */
function extractJsonString(text: string): string {
  const fenced =
    text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);

  const candidates = fenced ? [fenced[1], text] : [text];
  for (const candidate of candidates) {
    const found = scanBalancedJson(candidate);
    if (found) return found;
  }

  // A fence may hold a bare JSON scalar/edge shape with no braces at all.
  if (fenced && fenced[1].trim()) return fenced[1].trim();

  throw new AiParseError('no_json', 'No JSON found in response');
}

/**
 * Generate raw JSON without structured outputs
 * Use for schemas with z.record() that Anthropic doesn't support
 * Parses JSON from response text and validates with zod
 */
export async function generateRawJson<T extends z.ZodType>(
  endpoint: Endpoint,
  prompt: string,
  schema: T,
  opts?: { maxTokens?: number }
): Promise<z.infer<T>> {
  const { primary, backup } = getModelConfig(endpoint);

  async function tryGenerate(model: string): Promise<z.infer<T>> {
    console.log(`[aiClient] Trying raw JSON generation with: ${model}`);
    const { text, truncated } = await callModelRaw(model, prompt, opts?.maxTokens);

    let jsonStr: string;
    try {
      jsonStr = extractJsonString(text);
    } catch (error) {
      // Nothing parseable + provider hit the token cap ⇒ truncation, retryable.
      if (truncated) throw new AiTruncationError(model, error);
      throw error;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (error) {
      if (truncated) throw new AiTruncationError(model, error);
      throw new AiParseError(
        'bad_json',
        `Malformed JSON in response: ${(error as Error)?.message ?? 'parse failed'}`,
        error
      );
    }

    // Zod failures surface as the raw ZodError (callers inspect .issues);
    // isInfrastructureError fast-exits false on them, so no backup is bought.
    return schema.parse(parsed);
  }

  try {
    return await tryGenerate(primary);
  } catch (error) {
    console.error(`[aiClient] Primary raw generation failed:`, error);

    if (backup && isInfrastructureError(error)) {
      console.log(`[aiClient] Falling back to: ${backup}`);
      return await tryGenerate(backup);
    }

    throw error;
  }
}

/**
 * Generate with schema validation and automatic fallback
 *
 * @param endpoint - Which endpoint (determines model selection)
 * @param messages - System + user messages
 * @param schema - Zod schema for response validation
 * @param schemaName - Name for the schema (used in API calls)
 */
export async function generateWithSchema<T extends z.ZodType>(
  endpoint: Endpoint,
  messages: Message[],
  schema: T,
  schemaName: string
): Promise<z.infer<T>> {
  const { primary, backup } = getModelConfig(endpoint);

  try {
    console.log(`[aiClient] Trying primary model: ${primary}`);
    return await callModel(primary, messages, schema, schemaName);
  } catch (error) {
    console.error(`[aiClient] Primary model failed:`, error);

    // Only fallback on infrastructure errors (API down, rate limit)
    // NOT on content errors (schema validation fails won't be fixed by different model)
    if (backup && isInfrastructureError(error)) {
      console.log(`[aiClient] Infrastructure error, falling back to: ${backup}`);
      return await callModel(backup, messages, schema, schemaName);
    }

    throw error; // Content error or no backup - rethrow
  }
}
