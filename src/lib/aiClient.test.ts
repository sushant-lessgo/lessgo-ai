import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// ⚠️ BOTH SDK client modules MUST be mocked: `openaiClient` instantiates the
// OpenAI SDK at module load and throws without OPENAI_API_KEY (see
// src/modules/audience/__tests__/captureGolden.test.ts:20-22). Without these
// mocks this suite dies on a keyless machine.
const { openaiCreate, anthropicCreate } = vi.hoisted(() => ({
  openaiCreate: vi.fn(),
  anthropicCreate: vi.fn(),
}));

vi.mock('@/lib/openaiClient', () => ({
  openai: {
    chat: { completions: { create: openaiCreate, parse: vi.fn() } },
  },
  mistral: {},
}));

vi.mock('@/lib/anthropicClient', () => ({
  anthropic: {
    messages: { create: anthropicCreate },
    beta: { messages: { create: vi.fn() } },
  },
}));

import { generateRawJson, AiParseError, AiTruncationError } from '@/lib/aiClient';

// 'copy' @ cheap tier => primary gpt-4o-mini (openai), backup claude-haiku (anthropic)
const ENDPOINT = 'copy' as const;

function openaiText(text: string, finish_reason = 'stop') {
  return { choices: [{ message: { content: text }, finish_reason }] };
}
function anthropicText(text: string, stop_reason = 'end_turn') {
  return { content: [{ type: 'text', text }], stop_reason };
}

const LOOSE = z.record(z.any());

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.env.AI_MODEL_TIER = 'cheap';
  delete process.env.AI_MODEL_OVERRIDE;
});

describe('generateRawJson — extraction', () => {
  it('extracts a ```json fenced object', async () => {
    openaiCreate.mockResolvedValue(
      openaiText('Here you go:\n```json\n{"a": 1}\n```\nHope that helps!')
    );
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({ a: 1 });
  });

  it('extracts a bare ``` fenced object', async () => {
    openaiCreate.mockResolvedValue(openaiText('```\n{"a": 2}\n```'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({ a: 2 });
  });

  it('extracts an unfenced object', async () => {
    openaiCreate.mockResolvedValue(openaiText('{"a": 3}'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({ a: 3 });
  });

  it('extracts a prose-wrapped object', async () => {
    openaiCreate.mockResolvedValue(
      openaiText('Sure! {"a": 4, "b": {"c": 5}} — let me know if you need edits.')
    );
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({
      a: 4,
      b: { c: 5 },
    });
  });

  it('accepts an UNFENCED top-level ARRAY (the real sequenceEngine gap)', async () => {
    // This is the discriminating case: the old /(\{[\s\S]*\})/ had no `[` branch,
    // so it spanned first `{` .. last `}` => `{"a": 1}, {"a": 2}` => parse failure.
    // (A fenced array would have passed under the OLD code too — it hits the fence
    // branch and JSON.parse()s the array directly — so it guards nothing on its own.)
    openaiCreate.mockResolvedValue(openaiText('[{"a": 1}, {"a": 2}]'));
    const schema = z.array(z.object({ a: z.number() }));
    await expect(generateRawJson(ENDPOINT, 'p', schema)).resolves.toEqual([
      { a: 1 },
      { a: 2 },
    ]);
  });

  it('accepts a fenced top-level ARRAY', async () => {
    openaiCreate.mockResolvedValue(openaiText('```json\n[{"a": 1}, {"a": 2}]\n```'));
    const schema = z.array(z.object({ a: z.number() }));
    await expect(generateRawJson(ENDPOINT, 'p', schema)).resolves.toEqual([
      { a: 1 },
      { a: 2 },
    ]);
  });

  it('takes the FIRST balanced object in a multi-object response (greedy-match regression)', async () => {
    // Greedy /(\{[\s\S]*\})/ would have spanned first `{` .. last `}` and thrown.
    openaiCreate.mockResolvedValue(
      openaiText('First: {"a": 1}\nAlternative: {"a": 999}')
    );
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({ a: 1 });
  });

  it('is not fooled by braces inside string literals', async () => {
    openaiCreate.mockResolvedValue(openaiText('{"a": "} not the end {", "b": 1}'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({
      a: '} not the end {',
      b: 1,
    });
  });

  it('respects ESCAPED quotes around a brace inside a string literal', async () => {
    // Doubly discriminating:
    //  - OLD greedy /(\{[\s\S]*\})/ spans first `{` .. last `}` (both objects) => parse failure.
    //  - A scanner WITHOUT the `escaped` branch ends the string at the `\"` before `}`,
    //    then closes depth at that `}` => returns `{"a": "say \"}` => parse failure.
    openaiCreate.mockResolvedValue(
      openaiText('First: {"a": "say \\"}\\" ok"}\nAlternative: {"a": "other"}')
    );
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({
      a: 'say "}" ok',
    });
  });

  it('throws AiParseError kind=no_json with the EXACT telemetry-matched message', async () => {
    openaiCreate.mockResolvedValue(openaiText('I cannot help with that.'));
    const err = await generateRawJson(ENDPOINT, 'p', LOOSE).catch((e) => e);
    expect(err).toBeInstanceOf(AiParseError);
    expect((err as AiParseError).kind).toBe('no_json');
    // src/utils/trackTelemetry.ts:45 string-matches this literal.
    expect((err as Error).message).toBe('No JSON found in response');
  });

  it('throws a tagged AiParseError kind=bad_json for malformed JSON (not a bare SyntaxError)', async () => {
    openaiCreate.mockResolvedValue(openaiText('```json\n{"a": 1,,}\n```'));
    const err = await generateRawJson(ENDPOINT, 'p', LOOSE).catch((e) => e);
    expect(err).toBeInstanceOf(AiParseError);
    expect((err as AiParseError).kind).toBe('bad_json');
    expect((err as Error).message).toMatch(/JSON/); // telemetry PARSE_SIGNATURE
  });

  it('passes opts.maxTokens through to the provider (default 8192 preserved)', async () => {
    openaiCreate.mockResolvedValue(openaiText('{"a": 1}'));
    await generateRawJson(ENDPOINT, 'p', LOOSE);
    expect(openaiCreate.mock.calls[0][0].max_tokens).toBe(8192);

    openaiCreate.mockClear();
    openaiCreate.mockResolvedValue(openaiText('{"a": 1}'));
    await generateRawJson(ENDPOINT, 'p', LOOSE, { maxTokens: 512 });
    expect(openaiCreate.mock.calls[0][0].max_tokens).toBe(512);
  });
});

describe('generateRawJson — fallback (isInfrastructureError via observable behavior)', () => {
  it('does NOT buy a backup call on a zod/content failure', async () => {
    openaiCreate.mockResolvedValue(openaiText('{"a": "not-a-number"}'));
    const schema = z.object({ a: z.number() });
    await expect(generateRawJson(ENDPOINT, 'p', schema)).rejects.toThrow();
    expect(openaiCreate).toHaveBeenCalledTimes(1);
    expect(anthropicCreate).not.toHaveBeenCalled();
  });

  it('does NOT buy a backup call on a zod too_long message (old "length" match regression)', async () => {
    openaiCreate.mockResolvedValue(openaiText('{"a": "wayyyy too long"}'));
    const schema = z.object({ a: z.string().max(3) }); // message mentions "length"/maxLength
    const err = await generateRawJson(ENDPOINT, 'p', schema).catch((e) => e);
    expect(err).toBeTruthy();
    expect(anthropicCreate).not.toHaveBeenCalled();
  });

  it('does NOT buy a backup call on a parse failure', async () => {
    openaiCreate.mockResolvedValue(openaiText('no json here'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).rejects.toBeInstanceOf(
      AiParseError
    );
    expect(anthropicCreate).not.toHaveBeenCalled();
  });

  it('does NOT buy a backup call for an error whose message merely contains "500"', async () => {
    // e.g. a zod/content error mentioning `maxLength: 500` or a token count.
    openaiCreate.mockRejectedValue(new Error('Invalid value: maxLength: 500 exceeded'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).rejects.toThrow(/maxLength/);
    expect(anthropicCreate).not.toHaveBeenCalled();
  });

  it('buys exactly one backup call on status 429', async () => {
    openaiCreate.mockRejectedValue(Object.assign(new Error('Too many'), { status: 429 }));
    anthropicCreate.mockResolvedValue(anthropicText('{"ok": true}'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({ ok: true });
    expect(anthropicCreate).toHaveBeenCalledTimes(1);
  });

  it('buys a backup call on status 503', async () => {
    openaiCreate.mockRejectedValue(Object.assign(new Error('nope'), { status: 503 }));
    anthropicCreate.mockResolvedValue(anthropicText('{"ok": true}'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({ ok: true });
    expect(anthropicCreate).toHaveBeenCalledTimes(1);
  });

  it('does NOT buy a backup call on status 400', async () => {
    openaiCreate.mockRejectedValue(Object.assign(new Error('bad req'), { status: 400 }));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).rejects.toThrow('bad req');
    expect(anthropicCreate).not.toHaveBeenCalled();
  });

  it('buys a backup call on ECONNREFUSED', async () => {
    openaiCreate.mockRejectedValue(
      Object.assign(new Error('connect failed'), { code: 'ECONNREFUSED' })
    );
    anthropicCreate.mockResolvedValue(anthropicText('{"ok": true}'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({ ok: true });
    expect(anthropicCreate).toHaveBeenCalledTimes(1);
  });

  it('buys a backup call on a plain timeout message', async () => {
    openaiCreate.mockRejectedValue(new Error('Request timeout'));
    anthropicCreate.mockResolvedValue(anthropicText('{"ok": true}'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({ ok: true });
    expect(anthropicCreate).toHaveBeenCalledTimes(1);
  });

  it('treats an unparseable truncated response (finish_reason=length) as retryable', async () => {
    openaiCreate.mockResolvedValue(openaiText('{"a": "cut off here', 'length'));
    anthropicCreate.mockResolvedValue(anthropicText('{"ok": true}'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).resolves.toEqual({ ok: true });
    expect(anthropicCreate).toHaveBeenCalledTimes(1);
  });

  it('surfaces AiTruncationError when there is no backup', async () => {
    process.env.AI_MODEL_OVERRIDE = 'gpt-4o-mini'; // override => backup: null
    openaiCreate.mockResolvedValue(openaiText('{"a": "cut off', 'length'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).rejects.toBeInstanceOf(
      AiTruncationError
    );
    expect(anthropicCreate).not.toHaveBeenCalled();
  });

  it('reads anthropic stop_reason=max_tokens off the response object', async () => {
    process.env.AI_MODEL_OVERRIDE = 'claude-haiku-4-5-20251001';
    anthropicCreate.mockResolvedValue(anthropicText('{"a": "cut', 'max_tokens'));
    await expect(generateRawJson(ENDPOINT, 'p', LOOSE)).rejects.toBeInstanceOf(
      AiTruncationError
    );
  });
});
