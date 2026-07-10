// src/modules/outreach/prospectExtraction.ts
// PURE prospect-grounding core for cold outreach: the zod extraction schema, the
// extraction prompt builder, a grounding-summary renderer, and a mock fixture.
// No AI call, no Prisma, no next/*, no 'use client' imports — a plain module a
// server route imports (the route makes the actual generateWithSchema call).
//
// PROOF-TRUTH (prospect side): the extraction prompt pulls facts ONLY from the
// scraped page text; it must never infer or invent details about the prospect.
// This mirrors the sender-side proof-truth rules in the email engine.
//
// CONSTRAINT-LIGHT SCHEMA (decision #6 / plan note): `ProspectExtractSchema` is
// handed to `generateWithSchema`, which routes through OpenAI STRICT structured
// outputs. Strict mode rejects zod `.min()`/`.max()` (minItems/maxItems/minLength)
// and requires nullable-not-optional. So: `name` is `.nullable()` (NOT bare
// `.optional()`), and there are NO length/count constraints on any field. The
// "2–6 short specifics" guidance lives in the PROMPT TEXT below, never the schema.

import { z } from 'zod';

// ---- extraction schema (constraint-light — see header) ----------------------

/** Facts extracted from a prospect's own site — the prospect-side grounding. */
export const ProspectExtractSchema = z.object({
  /** Business/person name if plainly stated on the page; null if not present. */
  name: z.string().nullable(),
  /** What the prospect does, in plain terms drawn from the page. */
  whatTheyDo: z.string(),
  /** Who they serve / their audience, drawn from the page. */
  whoFor: z.string(),
  /** Concrete, referenceable facts: product names, niches, recent focus, etc. */
  specifics: z.array(z.string()),
});

export type ProspectExtract = z.infer<typeof ProspectExtractSchema>;

/** Pasted-text grounding form — used verbatim, never fetched (LinkedIn ToS). */
export interface ProspectRawGrounding {
  rawText: string;
}

export type ProspectGrounding = ProspectExtract | ProspectRawGrounding;

function isRawGrounding(g: ProspectGrounding): g is ProspectRawGrounding {
  return typeof (g as ProspectRawGrounding).rawText === 'string';
}

// ---- extraction prompt -------------------------------------------------------

/**
 * Build the prospect-extraction prompt over a crawler's `combinedText` (pages are
 * `## PAGE:`-marked). Extract ONLY facts literally present in the text — no
 * inference, no invention (prospect-side proof-truth). Requests 2–6 concrete
 * referenceable specifics and JSON-only output.
 */
export function buildProspectExtractionPrompt(combinedText: string): string {
  const parts: string[] = [];

  parts.push(
    'You are extracting factual grounding about a PROSPECT (a business or person ' +
      'someone wants to reach out to) from the text of their own website. This ' +
      'grounding will be used to write a personalized cold-outreach message that ' +
      'references their real business.',
  );

  parts.push(
    '=== HARD RULES (proof-truth) ===\n' +
      '- Use ONLY facts that literally appear in the page text below.\n' +
      '- Do NOT infer, guess, generalize, or invent ANY detail about the prospect.\n' +
      '- If a field is not stated in the text, leave it empty (name: null; empty ' +
      'string or empty list for the others). Never fill a gap with a plausible guess.',
  );

  parts.push(
    '=== WHAT TO EXTRACT ===\n' +
      '- name: the business or person name if plainly stated, else null.\n' +
      '- whatTheyDo: one plain sentence describing what they do, from the text.\n' +
      '- whoFor: who they serve / their audience, from the text.\n' +
      '- specifics: 2–6 SHORT, concrete, referenceable facts (product names, niches, ' +
      'named services, recent focus, notable clients ONLY if named on the page). ' +
      'Each specific is something a message could name directly. Prefer fewer, ' +
      'solid specifics over padding — never invent to reach a count.',
  );

  parts.push('=== PAGE TEXT (source — the only allowed source of facts) ===\n' + combinedText);

  parts.push(
    '=== OUTPUT ===\n' +
      'Respond with ONLY a JSON object of the form ' +
      '{"name": "..."|null, "whatTheyDo": "...", "whoFor": "...", "specifics": ["...", ...]}. ' +
      'No commentary, no markdown fences.',
  );

  return parts.join('\n\n');
}

// ---- grounding summary (prompt fragment) ------------------------------------

/**
 * Render either grounding form into a prompt fragment for the generation engine.
 * An extract becomes a labeled PROSPECT FACTS block; a raw-text grounding is
 * passed through as prospect-provided text (used as-is, per phase 4). Never
 * fabricates: empty extract fields are simply omitted.
 */
export function summarizeProspect(grounding: ProspectGrounding): string {
  if (isRawGrounding(grounding)) {
    return (
      'PROSPECT-PROVIDED TEXT (pasted by the sender — treat as facts about the ' +
      'prospect, use only what is here, do not invent beyond it):\n' +
      grounding.rawText.trim()
    );
  }

  const lines: string[] = ['PROSPECT FACTS (use ONLY these; never invent prospect details):'];

  if (grounding.name && grounding.name.trim()) lines.push(`- Name: ${grounding.name.trim()}`);
  if (grounding.whatTheyDo && grounding.whatTheyDo.trim()) {
    lines.push(`- What they do: ${grounding.whatTheyDo.trim()}`);
  }
  if (grounding.whoFor && grounding.whoFor.trim()) lines.push(`- Who it's for: ${grounding.whoFor.trim()}`);

  const specifics = (grounding.specifics ?? []).map((s) => s.trim()).filter((s) => s.length > 0);
  if (specifics.length > 0) {
    lines.push('- Concrete specifics:');
    for (const s of specifics) lines.push(`  - ${s}`);
  }

  return lines.join('\n');
}

// ---- mock fixture (demo / mocked paths) -------------------------------------

/** Deterministic extract for demo/mocked paths — passes `ProspectExtractSchema`. */
export const mockProspectExtract: ProspectExtract = {
  name: 'Acme Robotics',
  whatTheyDo: 'Builds warehouse automation robots for mid-size fulfilment centers.',
  whoFor: 'Operations leads at regional e-commerce and 3PL warehouses.',
  specifics: [
    'Flagship pick-and-pack robot "Cart-X"',
    'Recently expanded into cold-storage warehouses',
    'Case study with a Midwest grocery distributor',
  ],
};
