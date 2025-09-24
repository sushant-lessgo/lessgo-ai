Here’s a tight **Root Cause Report** you can drop into Claude/code review threads. (Per your request: **issues only, no solutions**.)

---

# Root Cause Report — Optional Element Leakage into UI

## Symptom

Hero (`leftCopyRightImage`) and other sections render **optional elements** (supporting text, ratings, avatars, social proof, links, etc.) that the backend rules **explicitly excluded**. UI fills them with **defaults** (incl. booleans as `true`). &#x20;

## Ground Truth (Backend)

For `Hero_leftCopyRightImage`, the rules engine evaluates 8 rules and **includes only** `trust_item_1` and `trust_item_2`. It **excludes** `supporting_text`, `badge_text`, `trust_item_3`, `customer_count`, `rating_value`, etc. Final elements map shows **many exclusions** and **totalExclusions: 70** sent to client.  &#x20;

## What the Frontend Actually Does

* `useLayoutComponent.ts` **prefers stored exclusions** from `sectionContent.aiMetadata.excludedElements` whenever present—even when that array is **empty**. It then passes that empty list to `extractLayoutContent`. &#x20;
* Logs confirm: **“stored exclusions array: Array(0)”** for `hero` and `header`; extractor proceeds with **no exclusions**. &#x20;
* With no exclusions, extractor **treats undefined optionals as included** and **injects defaults** (e.g., `supporting_text`, `trust_item_3`, `rating_value`, `rating_count`, `show_social_proof`, `show_customer_avatars`, etc.).&#x20;

## Primary Root Cause

**Exclusion propagation is broken at the handoff to the UI.**
Although the backend computes and returns a populated `excludedElements` list per section, the client reads an **empty `aiMetadata.excludedElements`** from section content and **trusts it** over live computation. This **permits** all optionals by default, and the extractor **fills them with defaults**, contradicting backend intent.  &#x20;

## Contributing Issues (that amplify the mismatch)

1. **Rules intermittently “missing.”** Some sections log **“No rules found … returning empty array.”** When paired with an empty stored exclusions list, the UI again **defaults to including** optionals. &#x20;
2. **Section type/ID coupling risk.** `useLayoutComponent` derives `sectionType` via capitalization (`"hero" → "Hero"`). Any drift from backend’s section typing strategy can misalign rule lookups and exclusions.&#x20;
3. **SSR instability.** Repeated **`window is not defined`** errors in `storage.ts` during SSR for `/create/[token]` and `/generate/[token]` cause 500s. This disrupts consistent hydration/state transfer of inclusion/exclusion sets to the client.  &#x20;
4. **Noise masking signal.** Tailwind safelist warnings flood logs, making it harder to spot selection/exclusion diagnostics.&#x20;
5. **Code validity hazard.** `useLayoutComponent.ts` contains stray `...` in an object literal (near enhanced color tokens), which can break the branch where it compiles/runs.&#x20;

## Net Effect

* Backend: **deny-by-default** for optionals unless rules include them. ✔️
* Frontend: **allow-by-default** for optionals unless exclusions are present—and it often sees **empty exclusions**—so it **renders defaults** for many elements the backend excluded. ❌

## Evidence Pointers

* Backend selection & final summary for `Hero_leftCopyRightImage`: **INCLUDED (2), EXCLUDED (5)** with detailed scores. &#x20;
* Elements map sent to client with **totalExclusions: 70**.&#x20;
* Frontend shows **stored exclusions: Array(0)** and then **default-includes** numerous optional elements.&#x20;
* `useLayoutComponent.ts` logic path preferring stored (possibly empty) exclusions over live computation.&#x20;

---

**Bottom line:** The **root cause** is a **client-side permissive extraction policy combined with empty/absent exclusion data** at render time, which overrides the backend’s stricter rule outcomes and surfaces excluded optionals with defaults.
