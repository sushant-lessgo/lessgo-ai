// src/modules/cms/types.ts
// TS surface for the CMS core. Types are INFERRED from the Zod contract in
// `src/lib/schemas/collection.schema.ts` — that schema is the single source of
// truth; nothing here re-declares a shape by hand.
//
// Import direction: types → schema only (type-only imports are erased at
// compile time, so no runtime cycle and no server-only code reaches clients).

import type {
  FieldType,
  FieldDef,
  CollectionRoles,
  RoleKey,
  ItemValues,
  FieldValue,
  ImageValue,
  GalleryValue,
  MediaValue,
  LinkValue,
} from '@/lib/schemas/collection.schema';

export type {
  FieldType,
  FieldDef,
  CollectionRoles,
  RoleKey,
  ItemValues,
  FieldValue,
  ImageValue,
  GalleryValue,
  MediaValue,
  LinkValue,
};

/**
 * A Collection row as the app sees it (Prisma Json columns narrowed to the
 * validated shapes). Prisma's generated `Collection` type has `fieldSchema`,
 * `roles` and `values` as `JsonValue`; readers should widen through these.
 */
export interface CmsCollection {
  id: string;
  projectId: string;
  tokenId: string;
  name: string;
  slug: string;
  fieldSchema: FieldDef[];
  roles: CollectionRoles;
  detailPages: boolean;
  /** Reserved seam for per-template group layouts (v1 renders stacked only). */
  layoutHint: string | null;
  order: number;
}

export interface CmsGroup {
  id: string;
  collectionId: string;
  name: string;
  order: number;
}

export interface CmsItem {
  id: string;
  collectionId: string;
  groupId: string | null;
  slug: string;
  /** Keys are field ids; unknown (orphaned) keys are tolerated and ignored. */
  values: ItemValues;
  order: number;
  slugLocked: boolean;
}

/** One collection with its groups + items — the unit both renderer feeds use. */
export interface CmsCollectionBundle {
  collection: CmsCollection;
  groups: CmsGroup[];
  items: CmsItem[];
}
