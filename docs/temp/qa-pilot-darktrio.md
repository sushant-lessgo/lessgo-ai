# QA pilot — dark-trio real-LLM quality samples (2026-07-12)

Env: worktree `feature-tracking-pixels` (main, all 3 features merged), `npm run dev` :3000, real OpenAI path, dev Clerk session (sushantjain24@gmail.com / user_2xd9rxq…). Kill-switch env vars unset → features live. Projects: **Plausible Analytics** (`QhF4YMiht53s`, product/vestria) for social; **Naayom** (`xUAzD2Y1LI_B`, real customer, intent=enquiry) for emails + outreach (Plausible's goal = free-trial → email archetype deferred, correct empty state shown).

---

## 1. Social posts — project: Plausible Analytics

### Sample 1 — LinkedIn · Product Spotlight · "From brand" mode (verbatim)

> Imagine having the ability to see how your website is performing in real-time, empowering you to make informed decisions instantly.
>
> With Plausible Analytics, you gain immediate insights into user behavior as it happens. This means you can fine-tune your strategies on the fly, adapting to what your visitors want in the moment, ultimately enhancing their experience.
>
> Our user-friendly dashboard ensures that even non-technical team members can dive into the data without feeling overwhelmed. Simplifying insights helps everyone contribute to your success.
>
> If you're ready to take control of your web analytics while keeping your users' privacy protected, I invite you to try Plausible Analytics for free today.
>
> Start making data-driven decisions that respect user privacy and boost your performance.
>
> #WebAnalytics #RealTimeData #PrivacyFocused

Scores: specific-to-business 3 · grounded 4 · tone 4 · CTA 4 · placeholders 5 · formatting 5.
Real brand facts used (real-time, privacy, simple dashboard, free trial) and nothing invented, but the connective tissue is AI-sheen filler ("empowering you to make informed decisions instantly", "contribute to your success").

### Sample 2 — X · Announcement · "With context" mode (context supplied: crossed 1,000 websites) (verbatim)

> 🎉 We just crossed 1,000 websites using our dashboard! 🥳 A huge thank you to our incredible community for trusting Plausible Analytics to simplify your data while keeping privacy a top priority. Here's to more insights together! #Analytics

Scores: specific 4 · grounded 5 (milestone was user-supplied context, used verbatim) · tone 4 · CTA n/a (announcement) · placeholders 5 · formatting 5. ~236 chars, X limit respected.

**Verdict: SHIP-QUALITY** — on-brand, factual, platform presets visibly differ; LinkedIn long-form has mild generic-filler sheen a founder would lightly edit, not be embarrassed by. Both posts persisted to library (survived refresh, copy/delete present).

---

## 2. Email sequences — project: Naayom (Follow-up nurture, 4 emails, generated in one shot ~13s)

Timing labels rendered per email ("Send immediately / day 2 / day 4 / day 6") + per-email Copy + Regenerate buttons. First 2 emails verbatim, 3–4 condensed:

### Email 1 — Send immediately — "Instantly acknowledge the enquiry and set expectations" (verbatim)

> **Thank You for Reaching Out!**
>
> Hello,
>
> Thank you for your enquiry about our mushroom climate control systems and automated monitoring solutions. We've received your message, and a real person is on it!
>
> We understand how important it is to maintain optimal conditions for your mushroom crops, and we're here to help. You can expect a detailed response from us within the next couple of business days. If you have any additional details or specific questions you'd like us to address, feel free to reply to this email.
>
> Looking forward to connecting!
>
> Warm regards,
> The Naayom Team

### Email 2 — Send day 2 — "Build confidence with honest social proof" (verbatim)

> **Join Others Who've Found Success**
>
> Hello again,
>
> I wanted to share some feedback we've received from clients in the mushroom farming community. Many have discovered great value in our mushroom climate control systems and monitoring technologies.
>
> For instance, one grower mentioned that our solutions significantly boosted his crop yield and changed the way he manages his farm. Another grower expressed joy over achieving his best flush yet using our systems.
>
> These stories are a testament to the impact our offerings can have on your farming efficiency. We're proud to support mushroom growers like you.
>
> Best,
> The Naayom Team

Email 3 (day 4, objection-killer): addresses "initial investment" hesitation, pivots to ease-of-integration + consultation services. Email 4 (day 6, direct ask): subject "Ready to Take the Next Step?", asks to schedule a call — contains **"Simply reply to this email or click here to set up a time"** — "click here" is a dead pseudo-link in copy-only output.

**Proof-truth verified against DB**: Brief holds 2 real testimonials ("boosted my Cordyceps crop yield by 50%…", "first flush… best one yet"). Email 2's claims trace to them exactly, and the engine *dropped* the 50% hard metric rather than repeating/inventing — conservative, spec-compliant. No invented companies.

Scores: specific 4 · grounded 4.5 · tone 4 · CTA 3 ("click here" artifact) · placeholders 3 (same artifact; greetings are bare "Hello" — fine for copy-paste) · formatting 5.

**Verdict: SHIP-QUALITY (borderline on Email 4)** — grounded, warm, correct archetype structure; the "click here" pseudo-link is the one thing a founder must catch before pasting. Also note Email 1 invents an expectation ("response within a couple of business days") the business never stated — harmless but a claim the sender must own.

Unmapped-goal empty state also verified (Plausible/free-trial → clean "not available for this project's goal" message, no error).

---

## 3. Cold outreach — project: Naayom → prospect https://scalifixai.com

Intake prefilled target audience from Brief ICP ("Mushroom growers, Agricultural businesses, Farmers" — good). Channels: cold email + LinkedIn connection note. Scrape succeeded (1 page, 6,037 chars). Bump messages were also generated (bump checkbox toggle didn't stick in my automation — see issues), giving 4 messages total.

### Cold email (verbatim)

> **Boosting Your Performance Marketing with Precision**
>
> Hi there, I admire how Scalifix AI focuses on performance marketing for e-commerce and SMEs. We specialize in real-time monitoring solutions that enhance farming efficiency, which could complement your data-driven efforts. Would you be open to a quick chat about potential synergies?

### LinkedIn connection note (verbatim)

> I'm impressed by Scalifix AI's comprehensive approach to SEO and conversion rate optimization for e-commerce. I believe there are interesting overlaps in our fields that could lead to insightful conversations.

### Bumps (verbatim)

> **Exploring Opportunities for E-commerce Growth**
> Hi there, I wanted to circle back to my previous note. Your focus on conversion rate optimization for e-commerce is impressive, and I think our automated control technologies could enhance the efficiency of your clients' operations. Would you be open to a brief chat?

> Thanks for connecting! I appreciate Scalifix AI's work in digital marketing. I think our expertise in real-time monitoring could intersect nicely with your SEO efforts, creating value for your e-commerce clients. Let's chat if you're interested!

**Grounding verified against scrape record in DB**: "performance marketing", "e-commerce and SMEs", "SEO", "CRO" all appear verbatim on scalifixai.com — ≥1 concrete prospect fact per message ✓. Sender claims (real-time monitoring, automated control) trace to Naayom's Brief ✓. Formats respected: email = subject + ~44 words + 1 CTA ✓; LI note ~208 chars, no pitch ✓.

Scores: prospect-specific 5 · grounded 4 · tone/format 4 · CTA 4 · placeholders 5 · **value-bridge 2**.

**Verdict: BORDERLINE** — the grounding machinery works exactly as designed, but when prospect ≠ sender's ICP (a mushroom-tech company cold-emailing a marketing agency — my test pairing), the engine papers over the mismatch with "potential synergies / interesting overlaps" filler instead of a concrete reason to talk. A founder pasting these unedited to an off-ICP prospect would look confused. With an in-ICP prospect this same output shape would read well. Consider: a soft warning when scrape facts don't intersect the target-audience descriptor.

---

## Credit-spend behavior (verified in UsageEvent ledger)

| Event | Credits |
|---|---|
| social_post_generation ×2 | 0 each |
| email_sequence_generation | 0 |
| outreach_scrape | **1** (spec-compliant, SCRAPE_WEBSITE precedent) |
| outreach_generation | 0 |

Page-generation credit pool untouched by any of the 3 features ✓. Ledger rows written per generation (Free-cap counting source of truth intact).

## Issues (secondary)

1. **Email 4 "click here" pseudo-link** — copy-only artifact with no URL; prompt should forbid unlinkable phrases (highest-value copy fix).
2. **Outreach value-bridge on off-ICP prospects** — vague "synergies" filler (above).
3. Bump checkbox: unchecking via DOM automation before generate still produced bumps — likely automation artifact (React controlled input), not confirmed as product bug; worth one manual re-check.
4. No console errors; no failed API requests during any flow (only 404 was my own probe of GET /api/projects, which has no GET handler).
5. Social "With context" mode faithfully repeats any user-supplied claim (1,000 websites) — by design, but means user-context is an unverified-claims channel.

## Overall recommendation (un-flagging)

1. Social posts: **un-flag** — ship-quality on both modes/platforms tested, persists correctly, zero credit leakage.
2. Email sequences: **un-flag after one prompt tweak** — forbid "click here"-style dead links; everything else (proof-truth, archetype structure, timing labels, regen/copy UI) held up.
3. Cold outreach: **hold one beat** — machinery + grounding are solid; add off-ICP mismatch handling (or at least a UI hint) before real users point it at arbitrary prospects.
4. Gating still absent by design (all generations = 0 credits except scrape) — do not deploy un-flagged without pricing-v2 gating or kill-switches ON, per standing caveat.
5. Copy quality overall is above "founder-embarrassment" floor; worst artifacts are editable in <1 min per artifact.
