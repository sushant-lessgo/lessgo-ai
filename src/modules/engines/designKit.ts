// src/modules/engines/designKit.ts
// template-factory phase 4 — the design-kit GENERATOR.
//
// PURE DERIVATION. Joins the engine contract's flat maps into a structured
// "design kit" per copy engine, and renders that kit as markdown. Because the
// kit is DERIVED from the live schemas it cannot rot: change a contract slot,
// regenerate, the kit reflects it (proven by designKit.test.ts asserting against
// the live schema, not a frozen string).
//
// ── FIREWALL (load-bearing) ─────────────────────────────────────────────────
// This module must be importable WITHOUT pulling any template component into the
// graph. Every import below is either a TYPE-only import (erased at compile time)
// or a PURE-DATA leaf (coreSections / elementContracts / blockManifest / knobs /
// the audience element schemas + their pure helpers). NO `.tsx`, no `'use
// client'` module, no resolver, no ThemeInjector/SSRTokens ever enters here.
//
// ── the four joined maps ─────────────────────────────────────────────────────
//   1. required sections IN ORDER      → engineCoreSections[engine]
//   2. per-section slots + card min/max → elementContracts[engine][sectionType]
//                                          (thing) walked via getAllElements /
//                                          getCardRequirements; trust/work have
//                                          NO populated contract → fall back to
//                                          the flagship template's layout schema
//                                          (labeled `legacy-layout`).
//   3. capacities/requiresAssets/variants → blockManifest[flagship]
//   4. knob RANGES to design            → STANDARD_KNOB_AXES

import type { CopyEngine } from '@/types/brief';
import type { TemplateId } from '@/types/service';
import type { PrimitiveKind } from '@/modules/editing/primitiveTypes';

import { engineCoreSections } from './coreSections';
import { elementContracts } from './elementContracts';
import { STANDARD_KNOB_AXES, KNOB_AXES } from '@/modules/templates/knobs';
import { blockManifests } from '@/modules/templates/blockManifest';
import type { SectionBlockSet, AssetKind } from '@/modules/templates/blockManifest';
import {
  getAllElements,
  getCardRequirements,
  layoutElementSchema,
  type CardRequirements,
  type LayoutElement,
} from '@/modules/sections/layoutElementSchema';
import { MERIDIAN_LAYOUT_NAMES } from '@/modules/audience/product/elementSchema';
import { PILOT_LAYOUT_NAMES } from '@/modules/audience/service/elementSchema';
import { writerElementSchema } from '@/modules/audience/writer/elementSchema';

// ── engine → flagship template + section→layout map ─────────────────────────
// The kit is engine-level (it briefs a NEW template for an engine); capacities /
// variants come from the engine's current FLAGSHIP template. thing→meridian,
// trust→hearth, work→granth.
const ENGINE_FLAGSHIP: Record<CopyEngine, TemplateId> = {
  thing: 'meridian',
  trust: 'hearth',
  work: 'granth',
};

/** Build sectionType → layoutName for granth by scanning its (seeded) schema. */
function granthSectionLayouts(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [layoutName, schema] of Object.entries(writerElementSchema)) {
    const st = (schema as { sectionType?: string }).sectionType;
    if (st && !(st in map)) map[st] = layoutName;
  }
  return map;
}

/** sectionType → flagship layout name, per engine (legacy-layout fallback path). */
const ENGINE_SECTION_LAYOUTS: Record<CopyEngine, Record<string, string>> = {
  thing: MERIDIAN_LAYOUT_NAMES,
  trust: PILOT_LAYOUT_NAMES,
  work: granthSectionLayouts(),
};

// ── self-hosted font whitelist ──────────────────────────────────────────────
// Hardcoded from src/styles/fonts-self-hosted.css (the @font-face `font-family`
// declarations). POINTER: when a face is added/removed there, update this list
// (the handoff lint, phase 5, checks fonts ⊆ this set). Kept as kit DATA so the
// generator stays a pure leaf and does not read the CSS file at runtime.
export const SELF_HOSTED_FONTS: readonly string[] = [
  'Archivo',
  'Bodoni Moda',
  'Bricolage Grotesque',
  'Cormorant Garamond',
  'DM Sans',
  'EB Garamond',
  'Fraunces',
  'Hanken Grotesk',
  'Instrument Serif',
  'Inter',
  'Inter Tight',
  'JetBrains Mono',
  'Lora',
  'Mukta',
  'Source Serif 4',
  'Space Grotesk',
  'Spectral',
  'Tiro Devanagari Hindi',
] as const;

// ── kit shape ────────────────────────────────────────────────────────────────

export type ContractSource = 'contract' | 'legacy-layout';

/** One editable slot in a section. `primitive` is INFERRED (heuristic) — no
 *  per-slot primitive declaration exists in the schema yet (future editorPlan
 *  work); the kit surfaces it as a design hint, not a hard contract. */
export interface KitSlot {
  key: string;
  required: boolean;
  fillMode: string;
  isCard: boolean;
  primitive: PrimitiveKind;
}

/** One declared block variant a template could ship for the section. */
export interface KitVariant {
  layoutName: string;
  label: string;
  blurb?: string;
  capacity?: { minCards: number; maxCards: number };
  requiresAssets?: AssetKind[];
}

export interface KitSection {
  sectionType: string;
  /** Flagship reference layout this section derives from (null if unmapped). */
  layoutName: string | null;
  /** Where the slot list came from — contract (frozen §3) vs legacy layout. */
  source: ContractSource;
  slots: KitSlot[];
  /** Card/collection min-max for the section's primary collection, if any. */
  cards: CardRequirements | null;
  /** Flagship manifest capacity for the section's default block, if declared. */
  capacity?: { minCards: number; maxCards: number };
  /** Assets the flagship's default block requires, if declared. */
  requiresAssets?: AssetKind[];
  /** All declared block variants (manifest) for this section. */
  variants: KitVariant[];
}

export interface KitKnobAxis {
  axis: string;
  attr: string;
  values: readonly string[];
  default: string;
  note: string;
}

/** The format-constraints block: the axes/tokens/fonts a handoff HTML must obey.
 *  One self-contained static HTML, no external URLs. */
export interface KitFormat {
  /** Class-prefix convention every element must carry. */
  classPrefix: string;
  /** Design-axis DOM attributes the HTML must be structured around. */
  axes: string[];
  /** Font whitelist — the handoff may only use these families. */
  fonts: readonly string[];
  /** Hard rules the handoff must satisfy (self-contained, tokens, surfaces). */
  rules: string[];
}

export interface DesignKit {
  engine: CopyEngine;
  flagshipTemplate: TemplateId;
  sections: KitSection[];
  knobs: KitKnobAxis[];
  format: KitFormat;
}

// ── primitive inference ──────────────────────────────────────────────────────
// Heuristic mapping of an element key → its likely edit primitive. There is no
// per-slot primitive declaration in the schema yet, so this is a design hint.
function inferPrimitive(el: LayoutElement): PrimitiveKind {
  const key = el.element.toLowerCase();
  const leaf = key.includes('.') ? key.split('.').pop()! : key;
  if (leaf.includes('logo')) return 'logo';
  if (leaf.endsWith('_image') || leaf.endsWith('_photo') || leaf === 'image' ||
      leaf.includes('image') || leaf.includes('photo') || leaf.includes('poster')) {
    return 'image';
  }
  if (leaf.endsWith('_href') || leaf.endsWith('_url') || leaf.endsWith('_number')) return 'link';
  if (leaf.includes('cta') && (leaf.includes('text') || leaf.includes('label'))) return 'button';
  return 'text';
}

// ── section derivation ───────────────────────────────────────────────────────

interface ResolvedSchema {
  // `any` = the union AnySchema (not exported from layoutElementSchema); consumed
  // only through getAllElements/getCardRequirements which accept the union.
  schema: any | null;
  layoutName: string | null;
  source: ContractSource;
}

function resolveSectionSchema(engine: CopyEngine, sectionType: string): ResolvedSchema {
  const contract = elementContracts[engine]?.[sectionType];
  const flagshipLayout = ENGINE_SECTION_LAYOUTS[engine]?.[sectionType] ?? null;
  if (contract) {
    return { schema: contract, layoutName: flagshipLayout, source: 'contract' };
  }
  if (!flagshipLayout) return { schema: null, layoutName: null, source: 'legacy-layout' };
  const raw = layoutElementSchema[flagshipLayout] ?? null;
  return { schema: raw, layoutName: flagshipLayout, source: 'legacy-layout' };
}

function buildSection(engine: CopyEngine, sectionType: string, flagship: TemplateId): KitSection {
  const { schema, layoutName, source } = resolveSectionSchema(engine, sectionType);

  const slots: KitSlot[] = schema
    ? getAllElements(schema as any).map((el) => ({
        key: el.element,
        required: el.mandatory,
        fillMode: el.generation ?? 'ai_generated',
        isCard: Boolean(el.isCard),
        primitive: inferPrimitive(el),
      }))
    : [];

  const cards: CardRequirements | null = schema ? getCardRequirements(schema as any) : null;

  const set: SectionBlockSet | undefined = blockManifests[flagship]?.[sectionType];
  const defaultDecl = set?.variants.find((v) => v.layoutName === set.default);
  const variants: KitVariant[] = (set?.variants ?? []).map((v) => ({
    layoutName: v.layoutName,
    label: v.label,
    blurb: v.blurb,
    capacity: v.capacity,
    requiresAssets: v.requiresAssets,
  }));

  return {
    sectionType,
    layoutName,
    source,
    slots,
    cards,
    capacity: defaultDecl?.capacity,
    requiresAssets: defaultDecl?.requiresAssets,
    variants,
  };
}

// ── kit derivation ───────────────────────────────────────────────────────────

export function buildDesignKit(engine: CopyEngine): DesignKit {
  const flagship = ENGINE_FLAGSHIP[engine];
  const sectionTypes = engineCoreSections[engine];

  const sections = sectionTypes.map((st) => buildSection(engine, st, flagship));

  const knobs: KitKnobAxis[] = KNOB_AXES.map((axis) => {
    const def = STANDARD_KNOB_AXES[axis];
    return {
      axis: def.axis,
      attr: def.attr,
      values: def.values,
      default: def.default,
      note: def.note,
    };
  });

  const format: KitFormat = {
    classPrefix: 'lg-<templateId>-',
    axes: [
      '[data-palette]',
      '[data-variant]',
      ...KNOB_AXES.map((a) => STANDARD_KNOB_AXES[a].attr),
      '[data-surface]',
    ],
    fonts: SELF_HOSTED_FONTS,
    rules: [
      'ONE self-contained static HTML file — no external stylesheet, script, or font URL.',
      'All design tokens declared as CSS custom properties on `:root`.',
      'Palette accents applied via `[data-palette]` blocks; type/spacing feel via `[data-variant]`.',
      'Every knob axis emits its non-default CSS scoped under its `data-knob-<axis>="<value>"` selector; the DEFAULT value emits NOTHING (default = `:root`).',
      'Surface tones (light/dark bands) selected with the template-agnostic `[data-surface]` attribute — never per-template surface classes.',
      'Every element class prefixed `lg-<templateId>-` to avoid collision across templates.',
      'Only the self-hosted fonts above (see `src/styles/fonts-self-hosted.css`).',
      // HANDOFF MARKER CONVENTION — the handoff lint (`src/modules/templates/handoffLint.ts`,
      // `npm run kit:lint`) checks the output against exactly these two markers; keep in sync.
      'Each required section above is ONE container carrying `data-section="<sectionType>"` (values = the section names listed above).',
      'Each contract slot is representable by `data-slot="<slotKey>"` OR a real editable element `data-element-key="<slotKey>"`, placed INSIDE its section container.',
    ],
  };

  return { engine, flagshipTemplate: flagship, sections, knobs, format };
}

// ── markdown renderer ────────────────────────────────────────────────────────

function primitiveTag(p: PrimitiveKind): string {
  return `\`${p}\``;
}

function renderSection(s: KitSection): string {
  const lines: string[] = [];
  const layoutRef = s.layoutName ? ` — ref layout \`${s.layoutName}\`` : '';
  lines.push(`### \`${s.sectionType}\`${layoutRef}  _(source: ${s.source})_`);
  lines.push('');

  if (s.slots.length === 0) {
    lines.push('_No slots derivable (unmapped section)._');
    lines.push('');
  } else {
    lines.push('| slot | req | fill | primitive | card |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const slot of s.slots) {
      lines.push(
        `| \`${slot.key}\` | ${slot.required ? 'required' : 'optional'} | ${slot.fillMode} | ${primitiveTag(slot.primitive)} | ${slot.isCard ? 'yes' : ''} |`
      );
    }
    lines.push('');
  }

  if (s.cards) {
    lines.push(`- Collection \`${s.cards.type}\`: min ${s.cards.min}, max ${s.cards.max} (optimal ${s.cards.optimal[0]}–${s.cards.optimal[1]}).`);
  }
  if (s.capacity) {
    lines.push(`- Default block capacity: ${s.capacity.minCards}–${s.capacity.maxCards} cards.`);
  }
  if (s.requiresAssets?.length) {
    lines.push(`- Default block requires assets: ${s.requiresAssets.join(', ')}.`);
  }
  if (s.variants.length) {
    lines.push('- Declared variants:');
    for (const v of s.variants) {
      const cap = v.capacity ? ` (cap ${v.capacity.minCards}–${v.capacity.maxCards})` : '';
      const assets = v.requiresAssets?.length ? ` [needs ${v.requiresAssets.join(', ')}]` : '';
      const blurb = v.blurb ? ` — ${v.blurb}` : '';
      lines.push(`  - \`${v.layoutName}\` · ${v.label}${cap}${assets}${blurb}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

export function renderDesignKitMarkdown(kit: DesignKit): string {
  const out: string[] = [];
  out.push(`# Design kit — \`${kit.engine}\` engine`);
  out.push('');
  out.push(`_Derived artifact. Flagship reference template: \`${kit.flagshipTemplate}\`. Regenerate with \`npm run kit:generate\` — do not hand-edit._`);
  out.push('');

  out.push('## Required sections (in order)');
  out.push('');
  out.push(kit.sections.map((s) => `\`${s.sectionType}\``).join(' → '));
  out.push('');

  out.push('## Sections');
  out.push('');
  for (const s of kit.sections) out.push(renderSection(s));

  out.push('## Knob axes to design (ranges)');
  out.push('');
  out.push('| axis | attr | values | default | note |');
  out.push('| --- | --- | --- | --- | --- |');
  for (const k of kit.knobs) {
    out.push(`| \`${k.axis}\` | \`${k.attr}\` | ${k.values.map((v) => `\`${v}\``).join(', ')} | \`${k.default}\` | ${k.note} |`);
  }
  out.push('');

  out.push('## Format constraints (handoff HTML)');
  out.push('');
  out.push(`- **Class prefix:** \`${kit.format.classPrefix}\``);
  out.push(`- **Design axes:** ${kit.format.axes.map((a) => `\`${a}\``).join(', ')}`);
  out.push(`- **Self-hosted fonts (whitelist):** ${kit.format.fonts.map((f) => `\`${f}\``).join(', ')}`);
  out.push('- **Rules:**');
  for (const r of kit.format.rules) out.push(`  - ${r}`);
  out.push('');

  return out.join('\n');
}
