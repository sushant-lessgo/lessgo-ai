Your plan is a **solid “first 60%”** for the Phase-3 UIBlock selection problems, but there are a couple of hidden traps + a few missing fixes that will keep the system brittle even after these 3 changes.

## What’s good

* **#1 (missing candidates)** is very plausibly the *root cause* behind “AI invents layouts / assigns Pricing layouts to other sections”. Fixing candidate retrieval will immediately improve downstream behavior.
* **#2 (question quality)** is the right direction: you want questions that surface *user assets + intent*, not internal layout mechanics.
* **#3 (validation)** is a necessary safety net. You *must* prevent “Include”/random strings from propagating as a layout.

## Biggest risk in your #1 fix

Removing `toLowerCase()` is only correct **if**:

* `layoutNamesBySection` keys are **exactly** the same casing as `sectionType` values everywhere (e.g. `uniqueMechanism`, `useCases`, etc.), and
* nothing else passes `sectionType` as `UniqueMechanism`, `UseCases`, `HERO`, etc.

If today your map keys are lowercased (common pattern), then removing normalization will **break** sections like `Hero`/`Header` that might have been working by accident.

**Safer fix:** normalize with an alias map rather than removing normalization entirely, e.g.:

* First try `layoutNamesBySection[sectionType]`
* Then try common variants: `camelCase`, `lowercase`, `PascalCase` mapping
* And log when a fallback path was used (so you can kill the fallback later)

This avoids “fix #1 breaks 5 other sections” surprises.

## #2 Prompt guidance: good, but you need one more constraint

Guidelines alone often won’t prevent technical questions unless you also:

* **ban layout IDs from appearing in questions**, explicitly
* enforce a **question type** (asset/goal/audience/offer/proof) so it doesn’t drift back to “include/exclude”
* add a rule: **ask questions only when confidence is low** (otherwise users get interrogated)

If you don’t add the “only ask when needed” rule, the AI will still generate obvious filler questions because it thinks it must.

## #3 Validation: fallback-to-first-candidate is dangerous

“If invalid, pick first candidate” will hide real issues and can lead to weird mismatches.

Better behavior:

* If invalid layout → set `layout = null` and **force a question** (or run your “auto-fix composition” logic explicitly with a reason)
* If no candidates → return a structured error that points to candidate retrieval (not silent defaults)

At minimum, log:

* sectionType
* candidates
* invalid value received
* the fallback chosen + reason

## What’s missing (you’ll still have bugs after implementing this plan)

### 4) Separate “include/exclude” from “layout selection” in the response schema

Right now “Include” is being interpreted like a layout. Validation helps, but the real fix is schema separation:

* `includeSections: { UniqueMechanism: true/false }`
* `sectionLayouts: { UniqueMechanism: "SomeLayout" | null }`

If you don’t split these, you’ll keep fighting the same class of bug.

### 5) Copy generation keying/section naming mismatch (your known issue #1)

This plan doesn’t address: **AI returning layout names as keys** (e.g. `SimpleFooter`) instead of section keys (`Footer`). That’s not a UIBlock selection bug — it’s copy output schema / parsing validation.

You need either:

* stricter schema in copy prompt + validation, or
* a post-processor that maps `{ layout: "SimpleFooter" }` into `{ section: "Footer", layout: "SimpleFooter" }`

### 6) Layout registry/schema mismatch issues (causes missing fields → frontend crashes)

Even with correct layout names, if your schema registry can’t find a layout definition, your extraction/validation will drop fields and your UI components will receive `undefined`.

Add a check:

* “layout exists in registry” **before** generating or parsing copy for it

## Suggested execution order (to avoid churn)

1. Fix candidate retrieval (#1) **but with safe normalization**
2. Add validation (#3) + log hard when invalid
3. Split include vs layout schema (missing #4)
4. Upgrade question prompt (#2) + “ask only when needed”
5. Fix copy section naming (missing #5)
6. Add registry/schema existence check (missing #6)