# businessTypes

Closed business-type config for the self-serve scale track (scalePlan §7, spec `docs/task/scale-01-brief-registry.spec.md` D-H).

## Purpose

Each entry maps a business type → copy engine, required capabilities, default design style, minimal wizard fields, and likely goal intents. `fit()`/`shortlist()` (`src/modules/templates/fit.ts`) and the serve gate (spec 02+) read this to decide which templates can serve a Brief.

## v0 = shape, not behavior

The 6 seed entries (`saas`, `manufacturer`, `agency`, `consultant`, `coach`, `writer`) exist to prove the contract — nothing in the app imports this module yet. `extractionSchemaKey` values are `'<key>-v0'` placeholders; real extraction schemas arrive with their readers (spec 02+).

Spec 08 melts the existing `manufacturerFlow` into the `manufacturer` entry later; until then that key just exists and is shape-tested.

Note: `manufacturer` requires `lead-form` only — `catalog` is preferred, not required (required flags shrink serveability, scalePlan §7.3).

## Source of truth

`config.ts` is the single source of truth for entries; `config.test.ts` freezes the shape (keys, engine/capability/style/intent validity, wizard-field completeness).
