Here’s the crisp “final advice” you can hand to Claude Code and ship the MVP safely:

## MVP rule

Be **strict on IDs**, **relaxed on text**.

## Do this

1. **Lock the spine**

   * Sections must be **canonical enums** (no free strings).
   * UIBlock/layout IDs must be validated against your **registry**.
   * Always return **valid JSON** (Structured Outputs).

2. **Avoid unsupported schema features (Anthropic + OpenAI)**

   * Don’t use JSON Schema `propertyNames` (so avoid `z.record(enum, …)` if it generates it).
   * Don’t rely on `minItems > 1` / `minLength` in the provider schema.
   * If you must keep Zod strict, enforce constraints **post-parse**.

3. **Best MVP shape**

   * Strategy returns only **`middleSections`** (enum array with `min(1)`), and server appends `Header, Hero, CTA, Footer`.
   * If `middleSections` empty/missing → default to `['Features']`.

4. **Sanitize only for provider schema, not your business rules**

   * Use `sanitizeSchemaForAnthropic()` to strip unsupported constraints **only in `output_format`**.
   * Keep real validation in Zod/business logic, but for MVP use **safeParse + fallback**, not throw.

5. **Fallback logic**

   * Fallback to backup model **only for infrastructure errors** (429/5xx/timeout/network).
   * On content/validation issues: **apply deterministic defaults** (don’t waste money switching models).

6. **Two must-have guardrails**

   * Dedupe + stable sort sections server-side.
   * If a layout is invalid/unknown → set `null` or choose first candidate (and log).

That’s it: schema-safe outputs + deterministic fallbacks → no more “Heroic”, no more crashes, MVP stays unblocked.
