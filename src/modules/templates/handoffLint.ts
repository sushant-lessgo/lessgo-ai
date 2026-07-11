// src/modules/templates/handoffLint.ts
// template-factory phase 5 — the HANDOFF LINT.
//
// Validates a designer's single self-contained HTML handoff BEFORE the agent
// ports it into a template pair. Catching structural gaps here means fixes are
// one prompt away (the designer/agent still holds the whole file in context),
// not a build-time archaeology dig after the port.
//
// PURE CORE. No DOM, no filesystem, no template-component imports — regex over a
// string so it stays vitest-testable and firewall-safe. The thin CLI
// (`scripts/lintHandoff.ts`, `npm run kit:lint`) reads the file and calls this.
//
// ── HANDOFF MARKER CONVENTION (load-bearing — kit + lint MUST agree) ─────────
// The lint cannot see a designer's intent from raw markup, so the handoff HTML
// declares structure with two data attributes. The SAME convention is stated in
// the design-kit format block (`src/modules/engines/designKit.ts`) so the brief
// the designer receives and the lint that checks their output can never drift:
//
//   • Each required ENGINE SECTION is one container carrying
//         data-section="<sectionType>"        e.g. data-section="hero"
//     (sectionType values come from the engine contract — see below.)
//
//   • Each CONTRACT SLOT is representable one of two ways, both accepted:
//         data-slot="<slotKey>"                (an explicit handoff marker)
//         data-element-key="<slotKey>"         (a real editable element — the
//                                               same attr the editor emits)
//     Slot markers are scoped to their section: a slot counts only when its
//     marker sits inside that section's container region. (Slot keys such as
//     `headline` recur across sections, so a global check would be a lie.)
//
// ── DERIVED, NOT HARDCODED ──────────────────────────────────────────────────
// Required sections + required slots come from `buildDesignKit(engine)` (the
// phase-4 pure derivation over the live engine contract). Add a slot to the
// contract and the lint requires it — no list to maintain here, can't rot.

import type { CopyEngine } from '@/types/brief';
import { buildDesignKit } from '@/modules/engines/designKit';
import { SELF_HOSTED_FONTS } from '@/modules/engines/designKit';
import { KNOB_AXES, STANDARD_KNOB_AXES } from '@/modules/templates/knobs';

/** The DOM attribute a required engine section must carry. */
export const SECTION_MARKER_ATTR = 'data-section';
/** The explicit handoff attribute marking a contract slot. */
export const SLOT_MARKER_ATTR = 'data-slot';
/** The real editable-element attribute the editor emits — also accepted as a
 *  slot's "matching element". */
export const ELEMENT_KEY_ATTR = 'data-element-key';

export type LintCheck =
  | 'missing-section'
  | 'missing-required-slot'
  | 'axis'
  | 'font'
  | 'self-contained';

export interface LintFinding {
  check: LintCheck;
  message: string;
}

export interface LintResult {
  engine: CopyEngine;
  ok: boolean;
  findings: LintFinding[];
}

// ── small regex helpers (no DOM) ─────────────────────────────────────────────

/** All values of an attribute, in document order, e.g. attrValues(html,'data-section'). */
function attrValues(html: string, attr: string): string[] {
  const re = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

/** Match objects (value + index) for an attribute, in document order. */
function attrMatches(html: string, attr: string): Array<{ value: string; index: number }> {
  const re = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'gi');
  const out: Array<{ value: string; index: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push({ value: m[1], index: m.index });
  return out;
}

/** The HTML substring belonging to a section: from its `data-section` attr to
 *  the next `data-section` (or EOF). Convention: one container per engine
 *  section, declared top-to-bottom. */
function sectionRegions(html: string): Map<string, string> {
  const marks = attrMatches(html, SECTION_MARKER_ATTR);
  const regions = new Map<string, string>();
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : html.length;
    const region = html.slice(start, end);
    // If a section type appears more than once, union the regions.
    regions.set(marks[i].value, (regions.get(marks[i].value) ?? '') + '\n' + region);
  }
  return regions;
}

/** Is a slot representable inside a region — marker or matching element? */
function slotRepresentable(region: string, key: string): boolean {
  const slot = new RegExp(`${SLOT_MARKER_ATTR}\\s*=\\s*["']${escapeRe(key)}["']`, 'i');
  const elem = new RegExp(`${ELEMENT_KEY_ATTR}\\s*=\\s*["']${escapeRe(key)}["']`, 'i');
  return slot.test(region) || elem.test(region);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── font extraction ──────────────────────────────────────────────────────────

const GENERIC_FAMILIES = new Set([
  'sans-serif', 'serif', 'monospace', 'system-ui', 'ui-sans-serif', 'ui-serif',
  'ui-monospace', 'cursive', 'fantasy', 'emoji', 'math', 'fangsong',
  'inherit', 'initial', 'unset', 'revert', 'none',
]);

/** Literal font families referenced by `font-family:` or `--*font*:` custom
 *  props. Skips generic keywords and `var(...)` references. */
function referencedFonts(html: string): string[] {
  const re = /(?:font-family|--[\w-]*font[\w-]*)\s*:\s*([^;}"']*(?:"[^"]*"[^;}]*|'[^']*'[^;}]*)*)/gi;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const value = m[1];
    if (/var\s*\(/i.test(value)) continue; // a reference, resolved elsewhere
    for (const raw of value.split(',')) {
      const fam = raw.trim().replace(/^["']|["']$/g, '').trim();
      if (!fam) continue;
      if (GENERIC_FAMILIES.has(fam.toLowerCase())) continue;
      found.add(fam);
    }
  }
  return [...found];
}

// ── external-URL (self-contained) detection ──────────────────────────────────

const EXTERNAL = String.raw`(?:https?:)?//`;

/** Offending external references in stylesheet/script/font positions (NOT plain
 *  content anchors — those may legitimately link out). */
function externalReferences(html: string): string[] {
  const patterns: Array<{ label: string; re: RegExp }> = [
    { label: 'external stylesheet <link>', re: new RegExp(`<link\\b[^>]*\\bhref\\s*=\\s*["']?${EXTERNAL}[^"'>\\s]*`, 'gi') },
    { label: 'external <script src>', re: new RegExp(`<script\\b[^>]*\\bsrc\\s*=\\s*["']?${EXTERNAL}[^"'>\\s]*`, 'gi') },
    { label: 'external @import', re: new RegExp(`@import\\s+(?:url\\(\\s*)?["']?${EXTERNAL}[^"')\\s]*`, 'gi') },
    { label: 'external url() (font/asset)', re: new RegExp(`url\\(\\s*["']?${EXTERNAL}[^"')\\s]*`, 'gi') },
  ];
  const out: string[] = [];
  for (const { label, re } of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      out.push(`${label}: ${m[0].slice(0, 120)}`);
    }
  }
  return out;
}

// ── the lint ─────────────────────────────────────────────────────────────────

/**
 * Lint a designer's handoff HTML against a copy engine's contract.
 * Returns every finding (does not throw); `ok` is true iff there are none.
 */
export function lintHandoff(html: string, engine: CopyEngine): LintResult {
  const findings: LintFinding[] = [];
  const kit = buildDesignKit(engine);

  // 1 — all engine core sections present (marker convention)
  const present = new Set(attrValues(html, SECTION_MARKER_ATTR));
  const regions = sectionRegions(html);
  for (const section of kit.sections) {
    if (!present.has(section.sectionType)) {
      findings.push({
        check: 'missing-section',
        message: `Missing required section: ${SECTION_MARKER_ATTR}="${section.sectionType}" not found.`,
      });
    }
  }

  // 2 — every required contract slot representable (marker or matching element),
  //     scoped to a PRESENT section (a missing section is already reported above;
  //     don't double-count its slots).
  for (const section of kit.sections) {
    const region = regions.get(section.sectionType);
    if (!region) continue; // section absent → covered by check 1
    for (const slot of section.slots) {
      if (!slot.required) continue;
      if (!slotRepresentable(region, slot.key)) {
        findings.push({
          check: 'missing-required-slot',
          message: `Section "${section.sectionType}": required slot "${slot.key}" not representable ` +
            `(${SLOT_MARKER_ATTR}="${slot.key}" or ${ELEMENT_KEY_ATTR}="${slot.key}").`,
        });
      }
    }
  }

  // 3 — axes structured: :root tokens + palette/variant/knob selectors
  if (!/:root\b/.test(html)) {
    findings.push({ check: 'axis', message: 'No `:root` custom-property block found — design tokens must be declared on `:root`.' });
  }
  if (!/\[data-palette/i.test(html)) {
    findings.push({ check: 'axis', message: 'No `[data-palette]` selector found — palette accents must apply via `[data-palette]`.' });
  }
  if (!/\[data-variant/i.test(html)) {
    findings.push({ check: 'axis', message: 'No `[data-variant]` selector found — type/spacing feel must apply via `[data-variant]`.' });
  }
  const hasKnob = KNOB_AXES.some((a) => new RegExp(escapeRe(STANDARD_KNOB_AXES[a].attr), 'i').test(html)) || /data-knob-/i.test(html);
  if (!hasKnob) {
    findings.push({ check: 'axis', message: 'No `data-knob-*` selector found — at least one knob axis must be represented.' });
  }

  // 4 — fonts ⊆ self-hosted list
  const whitelist = new Set(SELF_HOSTED_FONTS.map((f) => f.toLowerCase()));
  for (const fam of referencedFonts(html)) {
    if (!whitelist.has(fam.toLowerCase())) {
      findings.push({
        check: 'font',
        message: `Font "${fam}" is not in the self-hosted whitelist (see src/styles/fonts-self-hosted.css).`,
      });
    }
  }

  // 5 — self-contained: no external stylesheet/script/font URLs
  for (const ref of externalReferences(html)) {
    findings.push({ check: 'self-contained', message: `External reference not allowed (handoff must be self-contained): ${ref}` });
  }

  return { engine, ok: findings.length === 0, findings };
}

/** Human-readable report for the CLI. */
export function formatLintResult(result: LintResult, source?: string): string {
  const header = source ? `${source} (engine: ${result.engine})` : `engine: ${result.engine}`;
  if (result.ok) return `PASS — ${header}: no findings.`;
  const lines = [`FAIL — ${header}: ${result.findings.length} finding(s).`];
  const byCheck = new Map<LintCheck, LintFinding[]>();
  for (const f of result.findings) {
    if (!byCheck.has(f.check)) byCheck.set(f.check, []);
    byCheck.get(f.check)!.push(f);
  }
  for (const [check, fs] of byCheck) {
    lines.push(`  [${check}] ${fs.length}`);
    for (const f of fs) lines.push(`    - ${f.message}`);
  }
  return lines.join('\n');
}
