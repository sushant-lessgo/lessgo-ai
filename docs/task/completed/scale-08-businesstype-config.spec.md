# scale-08 — businessType config system: melt the manufacturer hack, re-key voice, delete legacy

Source: scalePlan §2 List 1, D9, §4 #23 + manufacturerFlow inventory, §10 P2. Depends: scale-06, scale-07.

## Goal
"Any difference between two customers lives in a list entry" becomes true in code. The 24-file manufacturer hack becomes config entry #1; two new entries prove the pattern.

## Scope IN
1. **Melt `manufacturerFlow.ts`** — the ~7 forks keyed on `templateId==='vestria'` (scouted): page menu, strategy schema swap, section list, block map, voice, prompt branch (whatYouMake/industries relabel), fan-out+valueAdds slot. After 06/07, remaining deltas = businessType entry fields: `wizardFields` (labels/examples), `extractionSchemaKey`, `voiceHint`, `structureDefault`, `requiredCapabilities`. Target: `grep "templateId === 'vestria'"` in src → only render-layer hits (theme popover dispatch), zero pipeline hits.
2. **Voice re-key** (inventory #23): product voice off `isManufacturerFlow(templateId)` → off businessType/engine (`tailored-trade` = manufacturer entry's voiceHint; `modern-tech` = saas default). Service voice (`selectServiceVoice` — already right pattern) folds into same shape. Voice id, never templateId, in prompts (firewall).
3. **Prove the pattern — 2 new entries, config-only** (P2): `photographer` (work engine, requiredCapabilities: gallery — will sit MANUAL-ONBOARD until gallery blocks exist, that's correct) + `app` (thing engine, likelyIntents: download-app/signup). Acceptance = zero non-config code for both.
4. **Delete dead legacy** (inventory ☠️, 0 callers — verify then delete): legacy `/api/generate-landing` path + `elementDetermination` + IVOC routes (`market-insights`, `validate-fields`, tavily/ivocExtractor if unreferenced) + `IVOCCache` (keep table, drop code) + `/onboarding/persona` remnants + retired techpremium from catalogs (code stays, unreachable).
5. **Admin: businessType entries visible** on demand board (which types live, which capabilities missing) — read-only v1; editing entries stays a code deploy (frozen-enum philosophy, §11.2 applies to intents; entries are config-in-repo, not DB).

## Scope OUT
New capability blocks (gallery — rung C when a photographer lead is real) · place/quick-yes engines · DB-editable business types (config-in-repo is deliberate: reviewed, tested, versioned).

## Acceptance
Golden Shadow regenerates byte-equivalent-quality via manufacturer ENTRY (no templateId key anywhere in its pipeline path) — golden test. Adding `app` entry touches only the config module + tests. Grep-gates in CI test: no `isManufacturerFlow`, no pipeline `templateId===`. Dead routes return 404/410, `npm run build` green, bundle sheds dead code. Field-drop regression discipline (memory: grep all readers before deleting fields).

## Open questions
1. `IVOCCache` prisma model: drop table via migration now or keep dormant? (lean keep 1 release, drop after)
