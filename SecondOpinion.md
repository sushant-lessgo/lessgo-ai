Directionally: **yes**. This plan will let you swap providers safely and keep your `/api/v2/research` contract stable.

But in its current form it **won’t reliably fix “garbage IVOC”** unless you tighten three things: **cache behavior, grounding/evidence, and source control**.

## What’s good

* **Feature flag + fallback chain** is the right rollout strategy.
* Keeping the **frontend + API contract unchanged** reduces risk.
* Centralizing provider logic inside `src/app/api/v2/research/route.ts` is clean.

## The big gaps (and how to fix them)

### 1) Cache will hide Perplexity improvements

Right now your cache key is only `categoryKey + audienceKey`. So if a Tavily cache entry exists (even garbage), Perplexity will **never run** unless `forceRefresh=true`.

**Fix options (pick one):**

* **Option A (minimal):** If `RESEARCH_PROVIDER=perplexity` and cached.source !== `perplexity`, treat it as a miss.
* **Option B (better):** Add provider into the cache key (or add `providerVersion`), so Tavily/Perplexity can coexist.
* **Option C (best):** Keep same key but introduce `version` and bump it when you switch research engines; ignore cache when `cached.version < REQUIRED_RESEARCH_VERSION`.

If you don’t do this, you’ll think “Perplexity isn’t helping” when it’s just never being called.

---

### 2) “Verbatim quotes” will still be hallucinated without evidence linking

Your plan says “extract VERBATIM language” and returns `citations: string[]`. With Sonar, you typically get **`search_results` metadata** (titles/urls/dates), not guaranteed per-claim links. The model can still invent a “quote” that wasn’t actually in a source.

Perplexity’s chat-completions responses include `search_results` (sources list). ([Perplexity][1])

**Fix:** change the output format so every IVOC item includes **source indices** that point into `search_results`.

Example (still compatible with your existing IVOC arrays if you want):

* Keep arrays of strings, but embed source markers:
  `"they charged me twice and ghosted support [2]"`

Or (better but requires type change):

```json
"pains": [{ "text": "...", "sources": [2,5] }]
```

If you keep a separate `citations[]` array only, you’ll have no reliable way to know which source supports which insight.

---

### 3) Don’t rely on “Search Reddit…” in the prompt — enforce it via params

With Sonar you can pass **`search_domain_filter`** and **`search_recency_filter`** as request params. ([Perplexity][1])
This is much stronger than hoping the model “chooses” Reddit/forums.

**Recommendation for IVOC retrieval:**

* Use `search_domain_filter` allowlist like:
  `["reddit.com","g2.com","capterra.com","trustpilot.com","apps.apple.com","play.google.com","producthunt.com","indiehackers.com"]`
* Add `search_recency_filter: "year"` (or `"month"` for fast-moving categories). ([Perplexity][1])

That will reduce SEO/template garbage dramatically.

### 4 Instead of only giving category and audince, shall we also give what it does so that results are better.. for a category and audienc.. its too droad for IVOC

---

## Model choice for your plan

Given your goal (high-quality IVOC):

* Default **`sonar-pro`** for research quality (it’s explicitly “deeper content understanding”). ([Perplexity][2])
* Use **`sonar`** only when you need high volume / cheap mode.
* Avoid `sonar-reasoning-pro` **if you rely on strict JSON parsing**, because it can output a `<think>` block before JSON and requires special parsing. ([Perplexity][3])

---

## Implementation tweaks I’d apply to your plan

### Update `researchWithPerplexity` return type

Instead of `citations: string[]`, return the sources you actually get:

* `citations: { title: string; url: string; date?: string }[]` from `response.search_results` ([Perplexity][1])

And in `route.ts`, store:

* `rawSources = response.search_results`
* `query = prompt summary or the actual composed prompt`

### Use structured outputs (so JSON is guaranteed)

Perplexity supports **JSON Schema structured outputs** via `response_format`. ([Perplexity][4])
This will reduce parsing failures and weird formatting.

### Add an IVOC “quality gate” before caching

If output contains phrases like:

* “target audience”, “pain points”, “market research”, “pricing transparency concerns”
  …then mark it low-quality and **don’t cache** (or cache with short TTL).

---

[1]: https://docs.perplexity.ai/guides/chat-completions-guide "OpenAI Compatibility - Perplexity"
[2]: https://docs.perplexity.ai/getting-started/models/models/sonar-pro?utm_source=chatgpt.com "Sonar pro"
[3]: https://docs.perplexity.ai/getting-started/models/models/sonar-reasoning-pro?utm_source=chatgpt.com "Sonar reasoning pro"
[4]: https://docs.perplexity.ai/guides/structured-outputs "Structured Outputs Guide - Perplexity"
[5]: https://docs.perplexity.ai/api-reference/search-post "Search - Perplexity"
