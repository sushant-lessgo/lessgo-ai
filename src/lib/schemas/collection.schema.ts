// src/lib/schemas/collection.schema.ts
// CMS collections contract (docs/task/cms-collections.plan.md phase 1).
// Zod is the single source of truth; TS types are inferred here and re-exported
// by `src/modules/cms/types.ts`.
//
// Enforced at the /api/collections/* routes ONLY — NEVER bolted onto
// DraftSaveSchema (the CMS payload is table-backed, not draft content).
//
// ── COERCION-PROOF RULES (publish-only failure modes; the plan's "Pinned
//    render-model shape") ──────────────────────────────────────────────────
// 1. No object that ends up in persisted/materialized SECTION content may carry
//    BOTH a string `content` key and a string `type` key — `coercePublishValue`
//    (layoutElementSchema.ts:380-397) collapses it to the bare `content` string.
//    Hence the render model's per-field shape is `{fieldType, value}`; the
//    video/audio value discriminator here is `kind`, never `type`+`content`.
//    (`FieldDef.type` is safe: field DEFS live in the Collection table and never
//    travel inside section content, and a FieldDef has no `content` key.)
// 2. Field ids — the keys of item `values` and of every materialized per-item
//    map — must be NON-NUMERIC: the same coercion pass reassembles any object
//    whose keys are all numeric strings into one concatenated string. Enforced
//    by FIELD_ID_REGEX (must start with a letter). Group/item ids are Prisma
//    cuids (letter-prefixed) → safe by construction.
//
// TRAP 1 decision (recorded in the plan): CMS image values store
// `{url, assetId?}` OBJECTS, not bare URL strings. New data, no legacy readers;
// renderers consume `.url`.

import { z } from 'zod';

/**
 * The CLOSED set of field types — now **10** (`stat` added by the 2026-07-20 spec
 * amendment, item 1). Do not extend without a spec change.
 */
export const FIELD_TYPES = [
  'image',
  'gallery',
  'video',
  'audio',
  'text_short',
  'text_long',
  'link',
  'date',
  'tags',
  'stat',
] as const;

export const FieldTypeSchema = z.enum(FIELD_TYPES);
export type FieldType = z.infer<typeof FieldTypeSchema>;

/**
 * Coercion-proof rule 2: field ids must start with a letter, so a `values` map
 * can never be all-numeric-keyed and get concatenated at publish.
 */
export const FIELD_ID_REGEX = /^[A-Za-z][A-Za-z0-9_-]*$/;

export const FieldIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(FIELD_ID_REGEX, 'Field id must start with a letter (A-Za-z0-9_- only)');

export const FieldDefSchema = z.object({
  id: FieldIdSchema,
  name: z.string().min(1).max(120),
  type: FieldTypeSchema,
});
export type FieldDef = z.infer<typeof FieldDefSchema>;

/** Ordered field defs with unique ids. Order IS the render order. */
export const FieldSchemaArraySchema = z
  .array(FieldDefSchema)
  .max(50)
  .superRefine((fields, ctx) => {
    const seen = new Set<string>();
    fields.forEach((f, i) => {
      if (seen.has(f.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, 'id'],
          message: `Duplicate field id: ${f.id}`,
        });
      }
      seen.add(f.id);
    });
  });

// ── Per-type VALUE schemas ──────────────────────────────────────────────────
// All values are optional at the item level (see makeItemValuesSchema); these
// describe the shape a value must have WHEN PRESENT.

/** TRAP 1: image values are objects, never bare URL strings. */
export const ImageValueSchema = z.object({
  url: z.string().min(1),
  assetId: z.string().min(1).optional(),
});

export const GalleryValueSchema = z.array(ImageValueSchema);

/** `kind` (not `type`) — coercion-proof rule 1. */
export const MediaValueSchema = z.object({
  kind: z.enum(['upload', 'link']),
  url: z.string().min(1),
});

export const TextShortValueSchema = z.string().max(500);
export const TextLongValueSchema = z.string().max(20000);

export const LinkValueSchema = z.object({
  url: z.string().min(1),
  label: z.string().max(200),
});

/** ISO date — `YYYY-MM-DD` or a full ISO timestamp. */
export const DateValueSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}([T ].*)?$/, 'Expected an ISO date (YYYY-MM-DD)')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Not a parseable date');

export const TagsValueSchema = z.array(z.string().min(1).max(80)).max(50);

/**
 * `stat` — one spec/stat PAIR (amendment item 1: Naayom specs, Scalifix metrics).
 * One field = one pair; a spec LIST is several `stat` fields, never a numeric-keyed
 * map (which `coercePublishValue` would concatenate — coercion-proof rule 2).
 *
 * ⚠️ KEY NAMES ARE LOAD-BEARING: `key` / `value` were chosen because neither ends
 * in `href|url|link|slug`. `sanitizeContentHtml` (publishSanitizer.ts, the SECOND
 * publish chokepoint) rewrites any string under such a key to `'#'` — publish-only,
 * invisible in the editor. That bug already shipped once in this feature (phase 3:
 * `roles.primaryLink` / `collectionSlug`). Do NOT rename these to e.g. `specLink`.
 *
 * Both halves may be EMPTY (the all-values-optional law). Unlike date/link/media,
 * `stat` therefore needs NO empty→null mapping in the caller: `{key:'',value:''}`
 * validates. It carries no `type`+`content` pair (coercion-proof rule 1).
 */
export const StatValueSchema = z.object({
  key: z.string().max(120),
  value: z.string().max(500),
});

export const FIELD_VALUE_SCHEMAS: Record<FieldType, z.ZodTypeAny> = {
  image: ImageValueSchema,
  gallery: GalleryValueSchema,
  video: MediaValueSchema,
  audio: MediaValueSchema,
  text_short: TextShortValueSchema,
  text_long: TextLongValueSchema,
  link: LinkValueSchema,
  date: DateValueSchema,
  tags: TagsValueSchema,
  stat: StatValueSchema,
};

export type ImageValue = z.infer<typeof ImageValueSchema>;
export type GalleryValue = z.infer<typeof GalleryValueSchema>;
export type MediaValue = z.infer<typeof MediaValueSchema>;
export type LinkValue = z.infer<typeof LinkValueSchema>;
export type StatValue = z.infer<typeof StatValueSchema>;

/** Union of every legal stored value (for readers/renderers). */
export type FieldValue =
  | ImageValue
  | GalleryValue
  | MediaValue
  | LinkValue
  | StatValue
  | string
  | string[];

/**
 * Item `values` validator, built against a collection's field schema.
 *
 * - ALL values optional (an item may fill any subset, including none).
 * - Unknown keys are TOLERATED AND PRESERVED (z.record, not z.object): removing
 *   a field from `fieldSchema` orphans its key in existing items, and a later
 *   item PATCH must not destructively strip it. Readers ignore unknown keys.
 * - Every key — known or orphaned — must still satisfy FIELD_ID_REGEX
 *   (coercion-proof rule 2 holds for orphans too).
 */
export function makeItemValuesSchema(fields: FieldDef[]) {
  const byId = new Map(fields.map((f) => [f.id, f]));
  return z.record(z.string(), z.unknown()).superRefine((values, ctx) => {
    for (const [key, value] of Object.entries(values)) {
      if (!FIELD_ID_REGEX.test(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `Illegal value key "${key}" — must start with a letter (A-Za-z0-9_- only)`,
        });
        continue;
      }
      const field = byId.get(key);
      // Orphaned key from a removed field — tolerated, not validated, kept.
      if (!field) continue;
      // Absent value = unfilled field.
      if (value === undefined || value === null) continue;
      const result = FIELD_VALUE_SCHEMAS[field.type].safeParse(value);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key, ...issue.path],
            message: `${field.type}: ${issue.message}`,
          });
        }
      }
    }
  });
}

export type ItemValues = Record<string, unknown>;

// ── Roles ───────────────────────────────────────────────────────────────────

/** Which field types may fill each role. Closed, cross-validated below. */
export const ROLE_ALLOWED_TYPES = {
  title: ['text_short'],
  cover: ['image', 'gallery'],
  primaryLink: ['link'],
} as const satisfies Record<string, readonly FieldType[]>;

export type RoleKey = keyof typeof ROLE_ALLOWED_TYPES;

/** Shape only — no cross-field checks. Use makeRolesSchema for a real gate. */
export const RolesShapeSchema = z
  .object({
    title: FieldIdSchema.optional(),
    cover: FieldIdSchema.optional(),
    primaryLink: FieldIdSchema.optional(),
  })
  .strict();
export type CollectionRoles = z.infer<typeof RolesShapeSchema>;

/**
 * Roles validator bound to a field schema: each role must point at an EXISTING
 * field whose type is allowed for that role.
 */
export function makeRolesSchema(fields: FieldDef[]) {
  const byId = new Map(fields.map((f) => [f.id, f]));
  return RolesShapeSchema.superRefine((roles, ctx) => {
    for (const role of Object.keys(ROLE_ALLOWED_TYPES) as RoleKey[]) {
      const fieldId = roles[role];
      if (!fieldId) continue;
      const field = byId.get(fieldId);
      if (!field) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [role],
          message: `Role "${role}" points at unknown field "${fieldId}"`,
        });
        continue;
      }
      const allowed = ROLE_ALLOWED_TYPES[role] as readonly FieldType[];
      if (!allowed.includes(field.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [role],
          message: `Role "${role}" requires a ${allowed.join('|')} field, got ${field.type}`,
        });
      }
    }
  });
}

// ── Purposes (amendment 2026-07-20, item 2) ─────────────────────────────────
//
// ⚠️ STORED AND VALIDATED, READ BY NOTHING. Marks what a collection is FOR
// (offer / proof / price). v1 ships ONE shared block that renders identically on
// every template (plan Deviations #1), so "case studies as a proof band" needs
// per-purpose renderers that are explicitly deferred. Founder ruling: "store it,
// unread for now."
//
//   → A future agent must NOT delete this as dead code (it is forward-compat by
//     ruling), and must NOT branch any render/materialization path on it without
//     a spec change lifting Deviation #1.

/** Closed vocabulary. Set semantics: order is not meaningful, duplicates collapse. */
export const COLLECTION_PURPOSES = ['offer', 'proof', 'price'] as const;

export const PurposeSchema = z.enum(COLLECTION_PURPOSES);
export type CollectionPurpose = z.infer<typeof PurposeSchema>;

/** Deduped list, no default — use `PurposesSchema` on create bodies. */
export const PurposesListSchema = z
  .array(PurposeSchema)
  .max(COLLECTION_PURPOSES.length * 4) // bounded before dedupe; a set can't exceed 3
  .transform((list) => Array.from(new Set(list)));

/** Deduped list defaulting to `[]` (absent = no purposes, never null). */
export const PurposesSchema = PurposesListSchema.default([]);
export type CollectionPurposes = CollectionPurpose[];

// ── Request bodies (consumed by /api/collections/*) ─────────────────────────

export const SlugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with single hyphens');

export const CollectionCreateSchema = z.object({
  tokenId: z.string().min(1),
  name: z.string().min(1).max(120),
  slug: SlugSchema.optional(), // derived from name server-side when absent
  fieldSchema: FieldSchemaArraySchema,
  roles: RolesShapeSchema.default({}),
  purposes: PurposesSchema,
  detailPages: z.boolean().default(false),
  /** Phase 8: publish also emits a listing subpage at `/<slug>`. */
  listingPage: z.boolean().default(false),
  layoutHint: z.string().max(60).nullable().optional(),
});
export type CollectionCreateInput = z.infer<typeof CollectionCreateSchema>;

export const CollectionPatchSchema = z
  .object({
    tokenId: z.string().min(1),
    name: z.string().min(1).max(120).optional(),
    slug: SlugSchema.optional(),
    fieldSchema: FieldSchemaArraySchema.optional(),
    roles: RolesShapeSchema.optional(),
    purposes: PurposesListSchema.optional(),
    detailPages: z.boolean().optional(),
    listingPage: z.boolean().optional(),
    layoutHint: z.string().max(60).nullable().optional(),
    order: z.number().int().min(0).optional(),
  })
  .refine(
    (v) => Object.keys(v).some((k) => k !== 'tokenId'),
    'Nothing to update'
  );
export type CollectionPatchInput = z.infer<typeof CollectionPatchSchema>;

export const GroupCreateSchema = z.object({
  tokenId: z.string().min(1),
  name: z.string().min(1).max(120),
  order: z.number().int().min(0).optional(),
});
export type GroupCreateInput = z.infer<typeof GroupCreateSchema>;

export const GroupPatchSchema = z.object({
  tokenId: z.string().min(1),
  groups: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(120).optional(),
        order: z.number().int().min(0).optional(),
      })
    )
    .min(1),
});
export type GroupPatchInput = z.infer<typeof GroupPatchSchema>;

/** Item bodies: `values` is shape-checked here, TYPE-checked at the route with
 *  makeItemValuesSchema (which needs the collection's field schema). */
export const ItemCreateSchema = z.object({
  tokenId: z.string().min(1),
  values: z.record(z.string(), z.unknown()).default({}),
  groupId: z.string().min(1).nullable().optional(),
  slug: SlugSchema.optional(),
  order: z.number().int().min(0).optional(),
});
export type ItemCreateInput = z.infer<typeof ItemCreateSchema>;

export const ItemPatchSchema = z
  .object({
    tokenId: z.string().min(1),
    values: z.record(z.string(), z.unknown()).optional(),
    groupId: z.string().min(1).nullable().optional(),
    slug: SlugSchema.optional(),
    order: z.number().int().min(0).optional(),
    /**
     * Amendment item 3 — RESERVED, UNWIRED BY RULING. Accepted + persisted so the
     * column isn't dead at the API edge, but NOTHING reads it: there is no
     * engine-agnostic home lineup to promote into (the `materializeHome*` helpers
     * are products+techpremium hardcoded and spec §Out). No UI control ships.
     */
    featuredOnHome: z.boolean().optional(),
  })
  .refine(
    (v) => Object.keys(v).some((k) => k !== 'tokenId'),
    'Nothing to update'
  );
export type ItemPatchInput = z.infer<typeof ItemPatchSchema>;

export const ItemBulkPatchSchema = z.object({
  tokenId: z.string().min(1),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        order: z.number().int().min(0).optional(),
        groupId: z.string().min(1).nullable().optional(),
      })
    )
    .min(1),
});
export type ItemBulkPatchInput = z.infer<typeof ItemBulkPatchSchema>;
