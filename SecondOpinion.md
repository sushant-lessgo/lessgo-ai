## Awareness Level Detection (LLM Prompt)

Given: [product, audience, problem, category]

Choose ONE awareness level that will resonate with the most number of users:

1. Problem aware - Cold
   Knows problem exists but low emotional intensity. Not urgently seeking solutions. Needs to be reminded why this matters.

2. Problem aware - Hot
   Feels the pain intensely. Actively frustrated. Urgently wants relief. "Hair on fire" problem.

3. Solution aware - Skeptical
   Knows solutions exist. Has seen/tried alternatives. Hesitant, needs convincing why THIS one is different.

4. Solution aware - Eager
   Knows solutions exist. Ready to act. Just needs to confirm this is the right choice.

---

## Unique Mechanism / Before-After / Objection Handle Detection (LLM Prompt)

Given: [product, audience, problem, category, awareness level]

Choose section(s) that will resonate most:

1. Before/After
   Show transformation. State before → state after.
   Use when: outcomes are tangible, visual, or emotionally relatable.
   Examples: design tools, fitness, productivity, revenue growth.

2. Unique Mechanism
   Reveal WHY/HOW it works differently.
   Use when: product has novel methodology, process, or technology.
   Examples: proprietary algorithm, unique framework, contrarian approach.

3. Objection Handle
   Address common doubts, hesitations, or "why this won't work for me" thoughts.
   Use when: audience is skeptical, has tried alternatives, or has specific concerns.
   Examples: "But I'm not technical", "I've tried X before", "This seems too good".

Pick one or more. Combine only if strongly justified.
If both Before/After and Unique Mechanism: Before/After first, then Unique Mechanism.

---

# Templates

## 1. Waitlist


Problem aware - Cold


Hero

Problem

Unique mechanism

Features (always)

Use cases (only if B2B + multiple target audiences)

How it works (always)

Trust section — Order: Results → Testimonials → Social Proof → Founder Note. Include all available. Skip Founder Note if 2+ of [Results, Testimonials, Social Proof] exist.

CTA


Problem - aware - hot

Hero

Unique mechanism

Features (always)

Use cases (only if B2B + multiple target audiences)

How it works (always)

Trust section — Order: Results → Testimonials → Social Proof → Founder Note. Include all available. Skip Founder Note if 2+ of [Results, Testimonials, Social Proof] exist.

CTA


Solution aware


Hero

Unique mechanism

Features (always)

Use cases (only if B2B + multiple target audiences)

How it works (always)

Trust section — Order: Results → Testimonials → Social Proof → Founder Note. Include all available. Skip Founder Note if 2+ of [Results, Testimonials, Social Proof] exist.

CTA

2. Product ready (all other landing goals)


Problem aware - Cold


Hero

Problem

Before/After and/or Unique Mechanism (per LLM decision above)


Trust section — Order: Results → Testimonials → Social Proof. Include all available. If none, use Founder Note as fallback.

Features (always)

Use cases (only if B2B + multiple target audiences)

How it works (always)

Pricing

CTA

FAQ (Answer all practical questions)


Problem aware - hot




Hero

Before/After and/or Unique Mechanism (per LLM decision above)


Trust section — Order: Results → Testimonials → Social Proof. Include all available. If none, use Founder Note as fallback.

Features (always)

Use cases (only if B2B + multiple target audiences)

How it works (always)

Pricing

CTA

FAQ (Answer all practical questions)


Solution aware - skeptical


Hero

Trust section — Order: Results → Testimonials → Social Proof. Include all available. If none, use Founder Note as fallback.

Before/After and/or Unique Mechanism and/or Objection Handle (per LLM decision above) 

Features (always)

Use cases (only if B2B + multiple target audiences)

How it works (always)

Pricing

CTA

FAQ (Answer all practical questions)


Solution aware - eager


Hero

Features (always)

Use cases (only if B2B + multiple target audiences)

How it works (always)

Trust section — Order: Results → Testimonials → Social Proof. Include all available. If none, use Founder Note as fallback.

Pricing

CTA

FAQ (Answer all practical questions)
