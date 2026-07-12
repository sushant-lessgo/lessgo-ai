# Data Capture — Spec

**Goal:** capture the signals needed to (a) improve generation quality, (b) run the beta funnel — with the minimum build. No dashboards, no warehouse, no A/B infra.

**Staging context:** ~5 pages founder-made now → private beta to 20 pages → public beta to 100 pages.

---

## Build NOW (before private beta)

### 1. Edit-delta capture (highest value)

The dataset of "what the AI wrote vs what the user changed it to" — future prompt-eval / fine-tuning data. PostHog `content_edited` (char_count only) is useless for this; store real text in our own DB.

- **Baseline snapshot:** at generation complete, freeze the AI output per section on the project (e.g. `Project.generatedContent` JSON or sibling column). On section/element **regen, re-freeze that section** — regen output becomes the new baseline (we only care about the delta from the *latest* AI attempt).
- **Delta capture:** hook into auto-save. On save, diff current content vs baseline per section/element; write rows only for changed elements.
- **New table `EditDelta`** (queryable > JSON blob):
  - `id, projectToken, sectionId, sectionType, elementKey`
  - `aiText, userText` (text)
  - `editDistance` (int, cheap Levenshtein or just char diff)
  - `templateId, audienceType` (denormalized for querying)
  - `createdAt`
- Dedupe: one row per element per save is fine; latest row per element = current state. Don't over-normalize.
- No UI. No admin viewer. Query via SQL when needed.

### 2. Regen events (explicit "AI failed" votes)

- PostHog event `section_regenerated`: `{ sectionType, attemptNumber, templateId, audienceType }` (same for element regen).
- **No reason-chip UI** — infer the reason later from the delta between regen attempts. Skip the friction.

### 3. Failure telemetry (succeeded-but-garbage + hard failures)

- PostHog events with `reason` prop: `generation_failed`, `parse_failed`, `scrape_failed` (provider included). Most call sites already log — just ensure each failure path fires one event.

---

## Build at PRIVATE BETA (first external users, →20 pages)

### 4. Prefill acceptance

- On wizard step submit, compare prefilled (scrape/inferred) value vs submitted value per field.
- PostHog event `prefill_field_outcome`: `{ field, outcome: accepted | tweaked | replaced }`. Per-field accuracy score for scraper + Brief inference.

### 5. Structural edits

- PostHog events: `section_deleted`, `section_added`, `section_reordered` with `{ sectionType, templateId }`. Structural rejection > copy edits as a section-selection signal.

### 6. Funnel + qualitative (config, not code)

- PostHog: define activation funnel (signup → onboarding complete → first edit → publish), turn on session recordings for onboarding + editor.
- Founder process (not code): 15-min call with every beta user after first publish.

---

## Build at PUBLIC BETA (→100 pages) — analysis only, no new capture

- Credit-wall analysis from existing `UsageEvent` (credits before first publish; % Free users hitting 20-credit wall) → validates pricing v2.
- Attribution: UTM/referrer on signup already captured — chart which channel produces publishers.
- Conversion join: `PageAnalytics` conversions × (templateId, category, awareness stage). Only prerequisite built now: **join keys exist** (delta table + events carry templateId/audienceType — covered above).

---

## Explicitly NOT building

- Dashboards / BI / warehouse / ETL
- NPS or in-app surveys
- A/B testing infra
- Regen reason-chip UI
- Admin viewer for EditDelta (SQL is fine)

---

## Rough scope (build-now portion)

- 1 Prisma migration (`EditDelta` + baseline snapshot storage)
- Baseline freeze: generation-complete + regen paths
- Diff-on-save hook in auto-save path
- ~4 PostHog events on existing code paths

## Unresolved questions

- Baseline storage: new column on `Project` vs inside existing `content` JSON?
- Diff on every auto-save vs debounced (e.g. only on save after N s idle)? Auto-save cadence decides row volume.
- Capture edits made by founder-operated pages too, or flag/exclude them (`isFounderEdit`)?
