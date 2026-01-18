## UIBlock selection prompt — what to improve

### ✅ What’s good

* Composition constraints are explicit (“MUST FOLLOW”).
* You pass **filtered candidates per section**, which is the biggest reliability win.
* Output includes `selections` + `questions` with `null` when uncertain (good for batching).

### 🔧 Fixes / upgrades

1. Only one time it can ask questions to user, right or will it be in an infinit loop?

2. **Give each candidate layout metadata**
   “text-heavy / accordion / image-based / persona-aware” needs to be machine-readable; otherwise the model guesses.

Pass per candidate:

* `tags: ["text-heavy","accordion","image","persona-aware"]`
  Example format:
  `Hero: [CenterStacked(tags:image), Minimalist(tags:text-heavy)]`

3. **Avoid quoting “multiple audiences: true/false” vaguely**
   Instead pass:

* `personasCount: 2` (or list of personas)
  So the model can reliably apply persona-aware preference.

4. **Enforce “one selection per section”**
   Add: “Return exactly one layout (or null) per section listed. Do not invent sections.”

5. **Question format should include `id` + options = layout IDs**
   To make second pass deterministic:

```json
{ "id": "Hero.assetImage", "section": "Hero", "question": "...", "options": ["use-text-only", "use-pexels-image"] }
```

---

## Copy generation prompt — what to improve

### ✅ What’s good

* “Identity” + “Voice” anchors (IVOC phrases + beliefs) help the model stay grounded.
* You provide **per-element char limits** and **mandatory/optional** rules — excellent.
* You include card count bounds (min/max/optimal) and “null to exclude”.

### 🔧 Must-fix: you’re only listing ai_generated elements

In your pseudo-code you filter:
`filter(e => e.generation === 'ai_generated')`

But the spec expects:

* `ai_generated` → model outputs
* `ai_generated_needs_review` → model outputs BUT flagged
* `manual_preferred` → skipped in prompt, yes — but your post-processing must handle defaults

So for the prompt, include **both**:

* `ai_generated`
* `ai_generated_needs_review` (and tell the model to output them, but expect review)

Add a note per element:

* “If element is needs_review: output value, keep realistic, avoid made-up numbers.”

Otherwise the model may not output testimonials/pricing/results content correctly.

### 🔧 Add “don’t hallucinate hard facts” rule

The “No placeholder text” rule is good, but it doesn’t prevent **invented metrics**.

Add:

* “Do not invent statistics, customer names, company logos, or exact numbers. If unknown, write in a way that avoids specific numbers, or return `{ value: '...', needsReview: true }` for review-required fields.”

(You already have the needsReview plan — this makes the model use it correctly.)

### 🔧 Output format is underspecified for repeaters

For cards/lists, the model needs to know the **shape**:

* Is `faq_items` an array of `{ q, a }`?
* Are features arrays of strings, or objects?
* Are pricing tiers objects?

Right now your `ElementValue` allows `string | string[]`, but lots of UIBlocks will require structured arrays (e.g., `{ title, description }`).

You should include **element schemas** (even minimal) per element, e.g.:

* `faq_items`: array of `{ question: string; answer: string }`
* `feature_cards`: array of `{ headline: string; detail: string }`

Otherwise parsing becomes brittle and the model will vary formats.

### 🔧 Add “return JSON only” + strictness

Add at bottom:

* “Return **valid JSON only**. No markdown, no commentary.”

And for each section include a stable `sectionId` key format (e.g., the section name string exactly).