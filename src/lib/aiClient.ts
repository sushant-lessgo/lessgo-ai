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
 * Check if error is infrastructure-related (should trigger backup)
 */
function isInfrastructureError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Rate limits, API down, network errors, truncation
    return (
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('503') ||
      msg.includes('502') ||
      msg.includes('500') ||
      msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('econnrefused') ||
      msg.includes('unavailable') ||
      msg.includes('max_tokens') ||
      msg.includes('length')
    );
  }
  return false;
}

/**
 * Call model without structured outputs - for schemas with z.record() that
 * Anthropic doesn't support (additionalProperties: object)
 */
async function callModelRaw(model: string, prompt: string): Promise<string> {
  const provider = getProvider(model);

  if (provider === 'openai') {
    const response = await openai.chat.completions.create({
      model,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0].message.content || '';
  } else {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }
}

/**
 * Generate raw JSON without structured outputs
 * Use for schemas with z.record() that Anthropic doesn't support
 * Parses JSON from response text and validates with zod
 */
export async function generateRawJson<T extends z.ZodType>(
  endpoint: Endpoint,
  prompt: string,
  schema: T
): Promise<z.infer<T>> {
  const { primary, backup } = getModelConfig(endpoint);

  async function tryGenerate(model: string): Promise<z.infer<T>> {
    console.log(`[aiClient] Trying raw JSON generation with: ${model}`);
    const text = await callModelRaw(model, prompt);

    // Extract JSON from response (may have markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      text.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
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
