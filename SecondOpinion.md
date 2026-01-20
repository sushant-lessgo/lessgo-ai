Here’s what stands out in the **two backend logs** specifically around **section selection quality** (ignoring UIBlocks), plus **concrete fixes**.

---

## 1) You’re calling `/understand` twice → downstream section selection becomes noisy

In **both logs**, the *exact same* understand prompt is fired twice, producing slightly different outputs (audiences/features).  
That cascades into different strategy + section choices across runs.

**Fix (do this first):**

* Add **idempotency** for onboarding calls:

  * Frontend: guard the “auto-call” with a `useRef` “alreadyCalled” flag + AbortController.
  * Backend: accept an `onboardingRunId + stepName` key and **return cached response** if already computed.
* In dev, React Strict Mode can double-invoke effects. Your logs look exactly like that pattern. 

---

## 2) IVOC/research quality is contaminating section selection

### A) “Ray” research retrieval includes wildly irrelevant sources (cookies, human cloning, Reddit alternatives)

Your IVOC extraction prompt is fed search results that include **Congress.gov human cloning**, **web cookies**, and **Reddit alternatives**.  
So the extracted “pains/desires” become generic/low-signal (“pain points and challenges…”, etc.). 

**Concrete improvements:**

* Improve the Tavily/query formation:

  * Use a more specific query like: **“AI personal trainer real-time adaptive workouts app pain points pricing complaints”** instead of just Fitness + audience.
  * Add exclusion keywords: `-cookies -congress -cloning -reddit alternatives -voat`.
  * Prefer review/community domains (Reddit fitness subs, app stores, G2/Capterra) and filter everything else.
* Add a **relevance filter step** before IVOC extraction:

  * Embed each search snippet and drop any below a similarity threshold to (category + audience + product type).
  * If < N relevant results remain, **re-search** with a fallback query template.

### B) “Invoicer” cache looks polluted / mismatched for “invoicing/freelancers”

Cache hit includes things like “better alternative to Upwork”, “keep getting rejected” etc. which don’t belong to invoicing tools. 
This will push the strategist into wrong objections → wrong sections.

**Concrete improvements:**

* Make cache keys more specific than `category/audience`:

  * include **subcategory** or **productType** (e.g., `invoice-generator` vs “freelancer SaaS”), or include a short “whatItDoes” hash.
* Add a cache quality validator:

  * If IVOC contains platform-market phrases (Upwork, “getting rejected”) while category is invoicing → mark as **cache miss** and re-fetch.

---

## 3) Strategy → section selection is **non-deterministic** and varies too much

### Invoicer shows two different section sets / orders across runs

One run outputs:
`Problem, UniqueMechanism, Features, HowItWorks, Testimonials, SocialProof, ObjectionHandle, Pricing, FAQ` 
Another run outputs a *different* set including `BeforeAfter` and `UseCases`, and a different order. 

### Ray also varies (different middleSections across runs)

Example run includes `Problem` and `BeforeAfter` and starts with `UniqueMechanism`. 
Another run omits `Problem` and includes `UseCases`. 

**Concrete improvements (make selection stable):**

* Introduce a **deterministic “base skeleton”** chosen by rules, then allow the model to add only 0–2 extras.

  * For *solution-aware SaaS free trial*, a safe base is usually:
    **Problem → BeforeAfter → Features → HowItWorks → Proof (Testimonials OR SocialProof) → Pricing/Trial → FAQ**
* Put a hard cap like **7–9 middle sections** to avoid bloat.
* Add a post-processor that:

  * **Deduplicates** (already done),
  * **Reorders** into a canonical funnel order (see next point),
  * Ensures required sections exist (e.g., if awareness is solution-aware, don’t skip Problem/BeforeAfter).

---

## 4) The model’s section ORDER is sometimes wrong for persuasion flow

Ray example starts: `UniqueMechanism → HowItWorks → Problem…` 
That’s usually backwards: readers need the **pain + outcome** before mechanism/steps.

**Concrete improvements:**

* Apply a **canonical ordering layer** after `middleSections` comes back:

  * **Awareness/Empathy**: Problem
  * **Outcome**: BeforeAfter
  * **Differentiation**: UniqueMechanism
  * **What you get**: Features
  * **How to use**: HowItWorks
  * **Trust**: Testimonials/SocialProof/Results
  * **Price & risk**: Pricing + ObjectionHandle
  * **Leftovers**: FAQ + UseCases + FounderNote
* If you want the model to still “choose”, let it choose inclusion, but **you own the order**.

---

## 5) Thought → section mapping is semantically inconsistent

Examples:

* “Is this built for freelancers or generic?” mapped to **Problem** in one run. That’s really **UseCases** or **UniqueMechanism**. 
* In another invoicer run, “Does this solve my specific freelance invoicing needs?” correctly maps to **UseCases**. 
  This inconsistency is why section selection feels “off” even when the set is reasonable.

**Concrete improvements:**

* Tighten definitions in prompt with a “routing table”, e.g.:

  * **Problem** = empathy/recognition of pain
  * **UseCases** = “is it for me / my scenario”
  * **UniqueMechanism** = “why different”
  * **ObjectionHandle** = risk/cancellation/security/switching
* Or: do mapping with a small deterministic classifier (rule-based / few-shot) rather than free-form LLM.

