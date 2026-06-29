Verdict: Nearly ready. Fix the editor-toggle contradiction (must), decide the shared-schema containment (should), clean up two stale bits.

🔴 Internal contradiction: is the editor toggle active or not?

The plan says both, in conflict:
- §60 (WarmNavHeader): "edit: render inert/disabled — editor is EN-only."
- §75 / §88 / §D: "the header toggle in edit mode sets editLang" and "LumenEditable binds to key or key_nl by the active lang."

These can't both be true. The agreed approach (POreview #1: she self-manages both languages) requires the active toggle — she edits NL too. So §60 is stale (left over from the earlier seed-both/EN-only idea) and must be rewritten to match §75/§88: the header toggle is active in edit, drives editLang, and LumenEditable routes edits to key/key_nl. This is the one blocker — left as-is, the dev gets contradictory instructions and could build an EN-only editor that can't edit Dutch (defeating the whole decision).

Shared-schema containment (judgment call — recommend tightening)

The plan reuses 4 shared layouts (WarmNavHeader, PetalFramedHero, LogoStrip, ContactFooterRich) and adds _nl twins to them in the shared serviceElementSchema (§37/§93). That works (additive, manual_preferred, other templates ignore them) — but it pollutes layouts used by Hearth/Lex/Surge with Lumen-only Dutch twins, and leaves residue when Lumen retires. For a §13 bespoke template whose whole point is containment + clean retirement, the cleaner move is Lumen-named layouts for all sections (LumenNav/LumenHero/LumenLogos/LumenFooter with _nl built in) — then retirement is just "delete the Lumen* entries," and nothing shared is touched. Tradeoff: a bit more schema duplication now vs. zero shared pollution + clean teardown. I'd lean Lumen-named-for-all given §13; the plan's reuse approach is acceptable if you'd rather minimize code — but call it consciously.

This also makes the plan's "no shared changes" claim honest — as written, it's not strictly true: the 4 reused-layout _nl twins and the middleware.ts geo cookie (§90/§121) are both shared touches. The geo cookie is harmless/additive (fine), but don't claim zero shared footprint.

Two cleanups

- nl_subtitle naming clashes with the _nl twin convention (§66). It's a distinct, always-visible Dutch tagline on service cards (per the HTML), not a translation twin — but _nl-suffixed it reads like one. Rename (e.g. dutch_tagline) so no one treats it as the NL twin of a subtitle field.
- Stale "translation tests" (§127): there's no translation pipeline anymore (PO #1). Replace with the twin-field/editLang test (edits in NL mode write *_nl; published emits both data-en/data-nl from seed) — which the plan otherwise describes well in §H/§129.

Otherwise solid

The bilingual mechanism is right: independent twin fields seeded once, Lumen-scoped editLang flag (no shared store/persistence), published data-en/data-nl + lumen.v1.js toggle/geo, no pipeline/migration. Lumen* layout names + the collision-guard test (§110) correctly close the ContactForm bug. §13 exclusivity, §3f boundary (plain styles.ts + guard), §7.5 asset, proven affordances, single-page flat seed, Spectral fonts — all correct.

Unresolved questions

1. Resolve the toggle contradiction to the active-in-edit editLang approach (required) — confirm?
2. Containment: Lumen-name all layouts (clean retirement, recommended) vs. reuse 4 shared + add _nl twins to the shared schema (less code, some pollution)?
3. Rename nl_subtitle → dutch_tagline (or similar) to avoid the twin-convention clash?
4. (carried) Kundius token exists or create it? Geo: navigator.language+cookie OK for v1?