# src/modules/brief — entry classification, serve gate, wizard bridges

PURE modules for the scale-02 router + serve gate (plan:
`docs/task/scale-02-router-serve-gate.plan.md`). No `'use client'`, no
template resolvers/registry/renderers/ThemeInjector/block imports — only pure
data (`templateMeta`, `businessTypes`, `fit`, goal vocabulary, `BriefSchema`).
Importable from BOTH server routes and client components.

**Phase-1 status: nothing in the app imports `@/modules/brief` yet** (zero
runtime change — readers arrive phases 3–6).

## The D1 spine (data flow)

```
entry page (client state, in-memory draft)
  → AI emits EntrySignals (understand/scrape entry mode, phase 3)
  → buildBriefDraft(signals, rawInput)         [classify.ts — CODE resolves engine]
  → page-2 confirm card                        [playback.ts copy; chooser = applyBusinessTypeCorrection]
  → POST /api/brief/confirm                    [phase 4]
  → server re-runs decideServe(brief)          [serveGate.ts — authoritative]
      SERVE  → Project.{brief, audienceType, templateId} → wizard redirect
               wizard page.tsx mount-hydrates via briefTo{Product,Service}Prefill  [bridge.ts]
      MANUAL → DemandLead.briefDraft (+ `missing` tags) — NO Project write
```

## Engine carriage (D2 — schema safety)

`copyEngines` (`@/types/brief`) = `{thing, trust, work}` and
`BriefSchema.copyEngine` is that enum. The RESOLVED engine can also be
`place` / `quick-yes` — writing those to `brief.copyEngine` would make
`BriefSchema.parse` THROW. So:

- `facts.entry.resolvedEngine` ALWAYS holds the true 5-value resolution.
- `brief.copyEngine` is set only for `{thing, trust, work}`; omitted otherwise.
- The gate reads engine clauses from `facts.entry.resolvedEngine`, never
  `brief.copyEngine`.

## Gate table (D2, serve-gate-v2 law)

SERVE iff businessType KNOWN (∈ `businessTypes`) AND in-ICP AND
`resolvedEngine ∈ {thing, trust, work}` AND shortlist non-empty. Otherwise
MANUAL with `missing` = comma-joined tags in canonical order
**`rungC → rungE → bridge → rungA`**; `out-of-icp` is EXCLUSIVE (single tag,
nothing else collected).

**Capability satisfaction (serve-gate-v2):** in `fit()`, a required capability
is satisfied by the template's own `templateMeta.capabilities` **OR** by a
SHARED BLOCK (`sharedBlocks/capabilities.ts` — `lead-form`, `store-badges`; a
shared block renders on every template, so its capability is available
regardless of the picked template). Consequence: an M1 or download-app brief no
longer rejects for lack of a native lead-form/store-badges template
(F13/F15/F16 now SERVE). A capability with NO backing template AND no shared
block (today: `gallery`) is still unsatisfiable ⇒ still rejects.

**Inferred structure is a SOFT signal (serve-gate-v2):** AI-inferred
`structure.mode==='multi'` is NO LONGER derived into a `multipage` requirement
by `requiredCapabilitiesFromBrief` — it never rejects and never re-routes. It
only acts as a style-SUBORDINATE pick tiebreak (see Files → serveGate.ts). The
hard `multipage` requirement lives ONLY on the USER-CONFIRMED 7b structure
(`requiredCapabilitiesFromStructure`, unchanged).

| Clause | Tag | Gating |
|---|---|---|
| transactional platform (checkout/ordering) | `out-of-icp` | exclusive; short-circuits everything |
| required capability unmet (tiebreaker gallery) | `rungC:gallery` | SOURCE-gated: `classificationSource==='tiebreaker'` AND `tiebreaker==='portfolio-is-proof'`; augmented caps via `fit(t, facts.entry.resolvedEngine, caps+'gallery')` per-template (`shortlist()` cannot carry the injected cap); independent of engine/bridge clauses. `gallery` has no shared block ⇒ still rejects |
| engine not live (place/quick-yes) | `rungE:<engine>` | NOT known-gated — fires for unknown types too |
| businessType not in List 1 | `rungA:<guess or 'unclassified'>` | — |
| fallback: known thing/trust/work type, shortlist empty, no other tag | `rungC:<first-unmet-capability>` | guard so `missing` is never empty on a manual outcome; the live path is photographer→`rungC:gallery` |

Fixtures: agency ⇒ serve/service/surge; consultant + inferred multi (F13) ⇒
serve/service/lex; writer + lead-magnet (F15) ⇒ serve/writer/granth; app +
download-app (F16) ⇒ serve/product/meridian; photographer ⇒ `rungC:gallery`
(KNOWN work type, gallery unbacked — no rungA); restaurant ⇒
`rungE:place,rungA:restaurant`; checkout ⇒ `out-of-icp`.

## Files

- `classify.ts` — `EntrySignals` shape, `resolveEngine` (lookup vs 5-rung
  tiebreaker ladder), `buildBriefDraft`, `applyBusinessTypeCorrection` (the
  ONLY sanctioned correction path — resets classification state so a stale
  portfolio rung never survives a chooser fix), `getEntryFacts`,
  `LOW_CONFIDENCE_THRESHOLD = 0.6`.
- `serveGate.ts` — `decideServe`, `BRIDGEABLE_ENGINES`. Template pick (D3 +
  serve-gate-v2): STYLE ALWAYS WINS — style-match shortlist against
  `templateMeta.designStyles` (ARRAY — `.includes`) trying `designStyleHint`
  first → `businessTypes[bt].defaultStyle` retry → `shortlist[0]`. Within a
  style-matched set of >1, an inferred `structure.mode==='multi'` prefers a
  multipage-capable template — a same-style TIEBREAK only, never a candidate
  restriction and never an override of the style match. DORMANT under today's
  config (no two same-engine templates share a style ⇒ every style match is a
  singleton); deliberate forward-compat behavior, not dead code.
- `bridge.ts` — `briefToProductPrefill` / `briefToServicePrefill` (null when
  `facts.entry` absent — hydrate no-op guard), `serviceTypeForBusinessType`
  (agency/consultancy/coaching, fallback `'agency'`), goalIntent→goal maps.
- `playback.ts` — ALL user-facing entry copy (`playbackSentence`,
  `chooserCards`); internal terms (engine/rung) never rendered; centralized
  for founder pre-launch review.
