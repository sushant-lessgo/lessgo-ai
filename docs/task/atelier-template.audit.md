# atelier-template — audit

## Phase 1 — audienceType ruling + serve-route reconciliation

### Files changed
- `src/modules/brief/serveGate.ts` — added `TEMPLATE_AUDIENCE` map; `decideServe()` serve branch now derives `audienceType` from the picked template.
- `src/modules/brief/serveGate.test.ts` — added a `TEMPLATE_AUDIENCE` derivation describe block; extended imports.

`src/types/service.ts` was NOT touched — the map homed cleanly in serveGate.ts (both `TemplateId` and `AudienceType` already imported there), so no natural reason to relocate it.

### What changed + why
- **`TEMPLATE_AUDIENCE: Record<TemplateId, AudienceType>`** added right after `BRIDGEABLE_ENGINES`. A FULL Record (not Partial) so tsc will FORCE the `atelier: 'service'` entry when the `TemplateId` union grows in phase 4. Values mirror today's engine→audience result exactly: trust-engine (hearth/lex/surge/lumen)→`service`, thing-engine (meridian/techpremium/vestria)→`product`, work-engine granth→`writer`.
- **`decideServe()` serve branch** now hoists the pick into `const pickedTemplateId = pickTemplate(brief, sl)` (single pick — reused for both fields, no second `pickTemplate` call) and returns `audienceType: TEMPLATE_AUDIENCE[pickedTemplateId] ?? BRIDGEABLE_ENGINES[engine]`. The `??` fallback never fires today (Record is total) but keeps `engine` referenced and is the documented safety net. Net observable behavior: byte-identical to before.

### Where the map is homed
`src/modules/brief/serveGate.ts`, immediately after `BRIDGEABLE_ENGINES`. Exported for testability.

### Premise-verification findings (read-only)
1. **`usesTemplateModule()`** (`src/types/service.ts:79-89`) — blanket-true for `audienceType === 'service'` (line 84). No per-id whitelist for service (only product has `PRODUCT_TEMPLATE_MODULE_IDS`). CONFIRMED: atelier as service needs no whitelist edit.
2. **`contractFor()`** (`src/modules/templates/templateConformance.ts:143-148`) — consults `resolveEngineSectionSchema` then `productElementSchema ?? serviceElementSchema`. Never `writerElementSchema`. CONFIRMED: atelier layouts registered in serviceElementSchema (phase 4) will let `consumes ⊆ contract` resolve.
3. **Consumer grep (`BRIDGEABLE_ENGINES`)** — the ONLY production reader is `serveGate.ts` (now line ~239). Sole authoritative consumer of `decision.audienceType` is `src/app/api/brief/confirm/route.ts:78` (writes `audienceType: decision.audienceType` to the project). No other site recomputes engine→audience. Remaining references are the test file + `serveGate` README doc line. CONFIRMED: changing the derivation inside `decideServe` is sufficient; no downstream recompute to reconcile.

### Tests added (serveGate.test.ts)
New `describe('TEMPLATE_AUDIENCE …')` block:
- map equals the expected full literal;
- map is total over `templateIds` (forces future entries);
- for every current template, `TEMPLATE_AUDIENCE[id] === BRIDGEABLE_ENGINES[engineOfTemplate[id]]` — proves the picked-template derivation is byte-identical to the old engine derivation across all three engines;
- a served work brief that picks granth still yields `audienceType: 'writer'`.
No photographer flip / SERVE case added (atelier not declared yet — photographer still routes MANUAL; existing outcomes unchanged).

### Commands run + results
- `npx tsc --noEmit` — my touched files produce ZERO errors (filtered grep for serveGate/brief/confirm/types-service = empty). PASS for this phase's scope. NOTE: pre-existing, unrelated errors exist in `src/app/api/saveDraft/route.ts` (`aiBaseline`/`editDelta` not on the Prisma client) — a stale/undgenerated Prisma client (the Worktree Prisma pitfall in MEMORY), NOT introduced by this phase; out of files-touched, left alone.
- `npm run test:run -- src/modules/brief` — **PASS: 5 files, 122 tests passed.** All existing serve decisions byte-identical (green) + new derivation cases pass.

### For the next phase (phase 4)
- Adding `'atelier'` to the `TemplateId` union will make tsc FORCE an `atelier: 'service'` entry in `TEMPLATE_AUDIENCE` (as designed) alongside the four service.ts full-Records the plan already lists.
- The `TEMPLATE_AUDIENCE` test's `.toEqual({...})` literal and the `engineOfTemplate` map in the derivation-parity test are hard-coded to the current 8 templates — phase 4 must add `atelier: 'service'` to both (atelier's engine = `work`, but it maps to `service`, so the parity test's `engineOfTemplate` assumption BREAKS for atelier — atelier is exactly the template that deviates from `BRIDGEABLE_ENGINES[engine]`; phase 4 should exclude atelier from that parity assertion or special-case it).
- Serve-flip test updates for the photographer path land in phase 4 (per plan), not here.

### Open risks
- Pre-existing `saveDraft` Prisma-client tsc errors remain in the tree (environment/Prisma-generation, not this phase). If phase 4 runs a full `tsc`, expect them until `prisma generate` is re-run.

---
### Phase 1 — impl-review verdict: SHIP (1 loop)
No blocking issues. Gates green: tsc exit 0, brief suite 122/122. Scope clean (service.ts untouched).
Non-blocking (carry to phase 4): parity test `engineOfTemplate` hand-feeds lumen:'trust' (lumen real engine = 'work', templateMeta.ts:177) + techpremium rows → those 2 rows self-satisfy the parity assertion (harmless: both bespoke/retired, excluded by fit(), never picked). Stronger form = derive engine from templateMeta.copyEngines + skip bespoke/retired. Also: lumen already deviates (work→service) today, so atelier is NOT the first deviation — fix that framing when adding atelier:'service'.
