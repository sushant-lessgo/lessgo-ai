// src/modules/audience/work/copyPrompt.ts
// ============================================================================
// WORK PER-PAGE COPY PROMPT — the FACTS-LAW core of the work copy engine.
//
// Inherits the service copyPrompt binding-rules pattern
// (src/modules/audience/service/copyPrompt.ts): static numbered RULES (anti-
// invention, no-placeholder, voice-forbidden-words) + dynamically-appended
// BINDING lines that pin the copy to the seller's ACTUAL stated facts (one card
// per stated group, NO padding, prices verbatim-or-mode-phrased) + a conditional
// bracketed-placeholder rule for the ONE placeholder zone (agency case-study
// metrics) + a FINAL SELF-CHECK echo.
//
// Differences from service/product (deliberate, work-specific):
//   • ALL work elements are `manual_preferred` in the contract (granth lineage) —
//     the AI writes every string here, so we list ALL non-system elements, not a
//     `generation === 'ai_generated'` subset (which would be empty for work).
//   • Proof quotes are INJECTED verbatim at parse time (injectPraise) — the model
//     writes only the proof FRAMING, never the quotes themselves.
//   • LEAN length caps per element (portfolio copy earns its place by restraint).
//   • PRIMARY-LANGUAGE directive: every string in the site's primary language.
//   • Story ship-grade rules: facts-only, graceful omission, NO fabricated bio.
//
// ── FIREWALL ────────────────────────────────────────────────────────────────
//   Calls assertNoTemplateLeak(input) + assertNoTemplateNamesInText(prompt).
//   No templateId / skeletonId / template names ever reach the prompt.
// ============================================================================

import type { WorkFacts } from '@/lib/schemas/workFacts.schema';
import type { WorkStrategyOutput } from './strategy/parseStrategyWork';
import type { WorkVoiceSpec } from './voice';
import { formatWorkVoiceForPrompt } from './voice';
import { buildWorkLibraryPromptBlock } from './workLibrary';
import {
  assertNoTemplateLeak,
  assertNoTemplateNamesInText,
} from './promptFirewall';
import {
  workElementContract,
  type WorkSectionKey,
} from '@/modules/engines/workSections';
import type { UIBlockSchemaV2 } from '@/modules/sections/layoutElementSchema';

/** The page THIS call writes (from the strategy sitemap). Body-only sections. */
export interface WorkCopyPage {
  archetypeKey: string;
  title: string;
  pathSlug: string;
  isHome: boolean;
  /** The section keys to generate for this page. */
  sections: string[];
}

export interface WorkCopyPromptInput {
  strategy: WorkStrategyOutput;
  page: WorkCopyPage;
  facts: WorkFacts;
  voice: WorkVoiceSpec;
  /** Optional existing-site context block (server-fed; tone reference only). */
  siteContextBlock?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAN length caps (chars) — portfolio copy earns its place by restraint. Caps
// are advisory guidance in the prompt (the contract has no charLimit field).
// ─────────────────────────────────────────────────────────────────────────────

const WORK_CHAR_CAPS: Record<string, number> = {
  eyebrow: 32,
  heading: 70,
  lead: 160,
  role_line: 60,
  name: 48,
  quote: 120,
  bio: 480,
  awards_line: 120,
  note: 160,
  copyright: 80,
  cta_label: 28,
  cta2_label: 28, // optional second hero CTA — same restraint as the primary CTA
  description: 140,
  price_line: 40,
  category: 24, // per-tier category label — 1-3 words (e.g. "Portrait", "Wedding")
  badge: 36, // about portrait badge — a short accent chip, DISTINCT from eyebrow
  bullets: 200, // whole newline-list; each line stays short (see the packages rule)
  label: 40,
  value: 24,
  question: 100,
  answer: 260,
  title: 60,
};

/** System-owned fields the model must NOT write (ids etc.). */
function isSystemField(fillMode: string | undefined): boolean {
  return fillMode === 'system';
}

/** The praise collection injected at parse time — never written by the model. */
const INJECTED_COLLECTIONS = new Set(['quotes']);

function capHint(name: string): string {
  const cap = WORK_CHAR_CAPS[name];
  return cap ? ` (max ${cap} chars)` : '';
}

/**
 * Render one section's element spec from the FROZEN work contract. Unlike
 * service, EVERY non-system element is listed (work contract is all
 * manual_preferred, but the copy engine fills it). Injected collections (proof
 * quotes) are omitted with a note.
 */
function buildWorkSectionSpec(section: string, schema: UIBlockSchemaV2): string {
  const lines: string[] = [`### ${section}`];

  // Scalar elements.
  for (const [key, def] of Object.entries(schema.elements)) {
    if (isSystemField(def.fillMode)) continue;
    const req = def.requirement === 'required' ? '[REQUIRED]' : '[optional, omit to exclude]';
    lines.push(`- ${key}${capHint(key)} ${req}`);
  }

  // Collections.
  if (schema.collections) {
    for (const [collKey, coll] of Object.entries(schema.collections)) {
      if (INJECTED_COLLECTIONS.has(collKey)) {
        lines.push(
          `- ${collKey}: DO NOT WRITE — the system injects real client praise here verbatim.`
        );
        continue;
      }
      const { min, max } = coll.constraints;
      const fields = Object.entries(coll.fields)
        .filter(([, f]) => !isSystemField(f.fillMode))
        .map(([fk]) => fk + capHint(fk));
      lines.push(`- ${collKey}[] (min ${min}, max ${max}) — each item: { ${fields.join(', ')} }`);
    }
  }

  return lines.join('\n');
}

/** True if the page carries an agency case-study metrics zone (the ONE placeholder zone). */
function hasAgencyMetrics(voice: WorkVoiceSpec, page: WorkCopyPage): boolean {
  return voice.profession === 'agency' && page.sections.includes('results');
}

export function buildWorkCopyPrompt(input: WorkCopyPromptInput): string {
  assertNoTemplateLeak(input, 'buildWorkCopyPrompt');
  const { strategy, page, facts, voice, siteContextBlock } = input;

  const language = strategy.primaryLanguage || 'en';
  const workLibraryBlock = buildWorkLibraryPromptBlock(facts);

  // Section specs from the FROZEN work contract (structure comes from the
  // sitemap page's sections — NOT the inert uiblocks identity map).
  const sectionSpecs = page.sections
    .map((section) => {
      const schema = workElementContract[section as WorkSectionKey];
      if (!schema) return null;
      return buildWorkSectionSpec(section, schema);
    })
    .filter(Boolean)
    .join('\n\n');

  // ── Dynamic binding lines — pin copy to the seller's ACTUAL stated facts. ──
  const groupNames = (facts.groups ?? []).map((g) => g.name);
  const hasWork = page.sections.includes('work');
  const hasPackages = page.sections.includes('packages');
  const hasAbout = page.sections.includes('about');
  const hasContact = page.sections.includes('contact');
  const agencyMetrics = hasAgencyMetrics(voice, page);

  let nextRule = 11;
  const bindingRuleLines: string[] = [];

  if ((hasWork || hasPackages) && groupNames.length > 0) {
    bindingRuleLines.push(
      `${nextRule++}. **One card per stated item — NO padding.** The seller offers EXACTLY ${groupNames.length} item(s): ${groupNames
        .map((n) => `"${n}"`)
        .join(
          ', '
        )}. Emit exactly one card per stated item in the work \`groups\` and \`packages\` collections — derive each card from that item (polish the wording only; do NOT invent, rename, drop, merge, or add items). If the schema max allows more, emit FEWER cards; NEVER pad with fabricated work (this overrides any array-min).`
    );
    bindingRuleLines.push(
      `${nextRule++}. **Prices are law — verbatim or mode-phrased.** Use each item's price EXACTLY as given in the WORK LIBRARY: an exact price as stated, a "from" price framed as "from …", and an on-request item framed as "on request" / "price on enquiry". NEVER invent, round, discount, or attach a number the library does not state.`
    );
  }

  if (hasPackages) {
    // Package bullets are facts-verbatim-injected at parse (injectPackages) from
    // the seller's stated group items — like proof quotes. So the model drafts
    // bullets ONLY as a silent-facts fallback, and never fabricates inclusions.
    bindingRuleLines.push(
      `${nextRule++}. **Package \`bullets\` — draft only when the facts are silent; NEVER fabricate inclusions.** \`bullets\` is a short newline-separated "what's included" list (one concise line per line, no leading dash — the layout adds it). If the WORK LIBRARY states what a package includes, the system injects those verbatim — do NOT restate or invent them. When the library says nothing about inclusions, you MAY draft 3–5 true, concrete lines drawn ONLY from what the seller actually offers — never invent a deliverable, turnaround, or perk the facts do not support. Leave \`bullets\` empty rather than pad it.`
    );
    bindingRuleLines.push(
      `${nextRule++}. **Package \`category\` — a short per-tier label, distinct from the name.** Give each package tier a 1-3 word \`category\` (e.g. "Portrait", "Wedding", "Commercial") that classifies the tier at a glance — NOT a restatement of its \`name\`. Draw it from the kind of work the tier covers. Leave it empty rather than force a label that adds nothing.`
    );
  }

  if (hasAbout) {
    // The about `badge` is a short accent chip beside the portrait. It is
    // manual_preferred (AI-drafted, seller-editable) and MUST read differently
    // from the section `eyebrow` — otherwise the chip just echoes the label.
    bindingRuleLines.push(
      `${nextRule++}. **About \`badge\` — a short accent chip, DISTINCT from the eyebrow.** In the \`about\` section, \`badge\` is a tiny caption that sits over the portrait (e.g. a name·place stamp, discipline, or years like "Photographer · Amsterdam"). Keep it a few words and make it DIFFERENT text from the \`eyebrow\` — never restate the eyebrow or heading. Draw it only from stated facts; leave it empty rather than invent a credential.`
    );
  }

  if (hasContact) {
    // Slot 7 is an ENUM (whatsapp | booking | form) — never a specific address.
    // Facts-law: the contact section must reflect ONLY the stated method and MUST
    // NOT invent a concrete email/phone/URL/@handle (regression: the engine once
    // fabricated "info@<name>.nl" from the business name).
    const cm = facts.contactMethod ?? 'form';
    const methodPhrase =
      cm === 'whatsapp'
        ? 'WhatsApp'
        : cm === 'booking'
          ? 'an online booking link'
          : 'a contact form';
    bindingRuleLines.push(
      `${nextRule++}. **Contact — bind to the stated method; invent NO address.** The seller's ONLY stated way to be reached is ${methodPhrase} (contactMethod: "${cm}"${facts.contactMethod ? '' : ', default'}). Set \`contact_method\` to exactly "${cm}". Do NOT invent, guess, or construct a specific email address, phone number, website URL, or social @handle the seller did not provide — NEVER fabricate an "info@…" (or any) email from the business name. Write only method-appropriate framing plus a CTA that points to that mechanism${cm === 'form' ? ` (for a form, a nudge in ${language} like "Get in touch" / "Send a message" — NOT an email address)` : ''}. Use a concrete address or number ONLY if the WORK LIBRARY states one verbatim.`
    );
  }

  if (agencyMetrics) {
    bindingRuleLines.push(
      `${nextRule++}. **Case-study metrics — placeholders, NOT fabrication (the ONE place placeholders are allowed).** In the \`results\`/\`metrics\` items you do NOT know real figures. Emit EXPLICIT bracketed placeholders the founder will replace — each metric "value" like "[+XX%]" / "[X.X×]" and "label" as real, specific-sounding copy in the voice. NEVER invent a real-looking client name or exact figure.`
    );
  }

  const bindingRules =
    bindingRuleLines.length > 0 ? `\n${bindingRuleLines.join('\n')}` : '';

  const forbidden = voice.lexicon.forbidden.join(', ');

  const prompt = `${voice.identity}

## OUTPUT LANGUAGE — ${language} (READ FIRST)
Your entire output MUST be written in ${language}. The grounding material below —
the facts, the WORK LIBRARY, and any POSITIONING / STORY ANGLE text — MAY be written
in another language. When it is, render its MEANING in ${language}: translate the
idea, never copy or echo the source-language wording. No source-language fragments,
names of things, or phrases may survive into your output (unless ${language} IS that
language). Proper nouns (the business name, place names, people's names) stay as-is.

## POSITIONING (the angle this site takes)
${strategy.positioningAngle}

## STORY ANGLE (for the about section)
${strategy.storyAngle}

Establishment: ${strategy.storyBranch}
${voice.establishmentNote}

${formatWorkVoiceForPrompt(voice)}

${workLibraryBlock}
${siteContextBlock ? `\n${siteContextBlock}\n` : ''}
## PAGE TO WRITE — ${page.title} (${page.pathSlug})${page.isHome ? ' [HOME]' : ''}

Write copy for EVERY section listed below, in the site's PRIMARY LANGUAGE.

${sectionSpecs}

## RULES (MUST FOLLOW)
1. **Write EVERY string in ${language}.** The entire page — headings, ledes, card
   labels, CTAs, story, everything — must be in ${language}. No other language, no
   mixed-language cards, no English fragments (unless ${language} IS English).
2. **Anti-invention — facts are law.** State ONLY what the WORK LIBRARY above
   states. NEVER invent a service, package, price, client name, award, statistic,
   date, location, or track record that is not in the facts. If a detail is not
   stated, leave it out — graceful omission beats a fabricated claim.
3. **NO placeholder text** — every field is real, usable copy in the voice (the
   ONE exception is the agency case-study metrics zone, if present — see below).
4. **Respect array min/max and the lean length caps** on each field. Portfolio
   copy earns its place by restraint: one true line beats three clever ones.
5. **The work carries the page — frame it, do NOT describe it.** Never narrate
   what a photo already shows; write the promise and mood around it.
6. **Proof quotes are injected verbatim by the system.** For the \`proof\` section,
   write ONLY the framing (eyebrow / heading / awards_line). Do NOT write, invent,
   paraphrase, or attribute any client quote — the real praise is inserted for you.
7. **Story is ship-grade (about section).** Use ONLY facts stated by the seller.
   Do NOT fabricate a biography, a founding year, a client roster, or credentials.
   If the story facts are thin, write a short, true, human story — never pad it
   with invented history.${strategy.storyBranch === 'new' ? ' This seller is NEW — do NOT imply a long history or an award shelf; lean on craft and care.' : ''}
8. Return ONLY valid JSON. No markdown, no commentary.
9. **Output EVERY section listed in "PAGE TO WRITE"** — no omissions. Each section
   key maps to a complete "elements" object. Do not drop trailing sections.
10. Use the ${voice.label} voice. **Avoid its forbidden words ANYWHERE** — headings,
    ledes, card labels, CTAs, story, footer. Forbidden words: ${forbidden}.${bindingRules}

## FINAL SELF-CHECK (before returning)
Scan your JSON once more and fix any miss:
(a) Every section listed in "PAGE TO WRITE" has an "elements" entry.
(b) Every string is written in ${language}.
(c) No invented service / price / client / award / number appears anywhere.${
    groupNames.length > 0
      ? `
(d) The work and packages collections have EXACTLY ${groupNames.length} card(s) — one per stated item, none invented.`
      : ''
  }
(e) You wrote NO client quotes in the proof section (they are injected for you).${
    hasContact
      ? `
(f) The contact section invents NO email address, phone number, URL, or @handle — it only reflects the stated contact method.`
      : ''
  }

## OUTPUT FORMAT
Return a JSON object keyed by section. Each value is { "elements": { … } }. For
collection fields, return the array of item objects (omit "id" — the system
assigns it). Optional elements may be omitted or set to null.

Generate copy now:`;

  // Last line of firewall defence: no template/skeleton NAME may reach the copy
  // prompt (word-boundary matched, so seller words like "flexible" don't trip).
  assertNoTemplateNamesInText(prompt, 'buildWorkCopyPrompt');
  return prompt;
}

/** Retry prompt when the previous attempt failed to parse (mirrors service). */
export function buildWorkCopyRetryPrompt(
  originalPrompt: string,
  parseError: string,
  invalidSnippet: string
): string {
  return `${originalPrompt}

---
PREVIOUS ATTEMPT FAILED TO PARSE

Error: ${parseError}
Invalid snippet: ${invalidSnippet.slice(0, 500)}

Common issues: trailing commas, unescaped quotes in strings, missing closing braces, comments in JSON.

Return the complete, valid JSON response (no markdown wrapping, no commentary):`;
}
