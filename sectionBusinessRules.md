# Section Selection & Ordering Business Rules

**Last Updated**: 2025-10-07
**Purpose**: Concrete, implementable business rules for section selection and ordering based on objection flow principles

---

## Core Principle

**"What is this person thinking RIGHT NOW, and what section moves them to the next thought?"**

Sections are steps in a mental journey. Each section answers a specific objection at a specific moment in the prospect's mind.

---

## Rule Categories

1. [Awareness-Based Section Flows](#1-awareness-based-section-flows)
2. [Market Sophistication Modifiers](#2-market-sophistication-modifiers)
3. [Startup Stage Constraints](#3-startup-stage-constraints)
4. [Landing Goal Rules](#4-landing-goal-rules)
5. [Category-Based Filters](#5-category-based-filters)
6. [Asset-Aware Substitution](#6-asset-aware-substitution)
7. [Intersection Override Rules](#7-intersection-override-rules)
8. [Section Ordering Rules](#8-section-ordering-rules)
9. [Section Cap Rules](#9-section-cap-rules)

---

## 1. Awareness-Based Section Flows

Awareness level determines the **starting point** of the mental journey and the **base section sequence**.

### Rule 1.1: Unaware Flow
**When**: Awareness level is "unaware"
**Mental State**: "I don't even know I have this problem"
**Base Sequence**: `hero → problem → beforeAfter → howItWorks → socialProof → cta`
**Optional Additions**: `features`, `results` (if traction stage or later)
**Forbidden**: `comparison`, `uniqueMechanism` (too advanced for unaware)

**Reasoning**: Unaware audiences need education first. Start by identifying the problem they don't know exists, show impact, explain solution, build basic trust.

---

### Rule 1.2: Problem-Aware Flow
**When**: Awareness level is "problem-aware"
**Mental State**: "I know I struggle with this, do you get me?"
**Base Sequence**: `hero → problem → beforeAfter → features → results → testimonials → cta`
**Optional Additions**: `uniqueMechanism` (if level 3+), `comparison` (if level 3+), `faq`
**Forbidden**: Never skip problem section

**CRITICAL**: Problem section MUST come early (position 2 or 3) for emotional validation before any solution discussion.

**Reasoning**: Problem-aware users need their pain validated first before they care about your solution.

---

### Rule 1.3: Solution-Aware Flow
**When**: Awareness level is "solution-aware"
**Mental State**: "I know solutions exist, why are you different?"
**Base Sequence**: `hero → uniqueMechanism → features → results → testimonials → cta`
**Optional Additions**: `comparison` (if level 3+), `socialProof`, `objectionHandling`
**Forbidden**: Problem agitation (they're past that stage)

**CRITICAL**: uniqueMechanism MUST come early (position 2 or 3) to differentiate immediately.

**Reasoning**: Solution-aware users have seen other solutions. Lead with differentiation, not problem education.

---

### Rule 1.4: Product-Aware Flow
**When**: Awareness level is "product-aware"
**Mental State**: "I know about you specifically, evaluating fit"
**Base Sequence**: `hero → socialProof → features → integration → security → results → objectionHandling → cta`
**Optional Additions**: `pricing`, `testimonials`
**Forbidden**: Problem agitation, basic education

**Reasoning**: Product-aware users need trust and technical validation, not education.

---

### Rule 1.5: Most-Aware Flow
**When**: Awareness level is "most-aware"
**Mental State**: "Almost ready, need final push"
**Base Sequence**: `hero → pricing → testimonials → objectionHandling → cta`
**Optional Additions**: `faq`
**Forbidden**: Problem sections, heavy education

**Reasoning**: Most-aware users are warm leads. Quick reminder of value, clear offer, handle objections, close.

---

## 2. Market Sophistication Modifiers

Sophistication determines **when and how** to differentiate, not just which sections to include.

### Rule 2.1: Level 1-2 (Early Market)
**Modification**: Keep it simple, education-focused
**Add**: None specifically required
**Emphasize**: Clear explanations, `howItWorks`, basic `features`
**Avoid**: `comparison` (nothing to compare against), heavy differentiation
**Timing**: Differentiation can come late if at all

**Reasoning**: Early markets need understanding first. Simple claims work.

---

### Rule 2.2: Level 3 (Growing Competition)
**Modification**: Add differentiation early
**Add**: `uniqueMechanism` (position 2-4)
**Emphasize**: "Why this works when others fail"
**Conditional**: Add `comparison` ONLY if:
  - You have clear superiority AND
  - Landing goal is high-commitment (buy-now, subscribe, contact-sales) AND
  - NOT personal category (Personal Productivity, Health & Wellness)
**Timing**: uniqueMechanism right after hero or problem

**Reasoning**: Users have seen alternatives. Show what makes you different early.

---

### Rule 2.3: Level 4-5 (Skeptical/Saturated Market)
**Modification**: Lead with credibility, then differentiate, then prove extensively
**Add**: `socialProof` (early, position 2-3), `objectionHandling` (required), `testimonials` (multiple if available)
**Sequence Adjustment**: `hero → socialProof → uniqueMechanism → results → testimonials → objectionHandling → cta`
**Emphasis**: Heavy proof stack, risk reversal

**Reasoning**: Skeptical markets need overwhelming proof. Credibility gate first, then differentiation, then extensive validation.

---

## 3. Startup Stage Constraints

Startup stage determines what proof types are **available and credible**. This is a HARD CONSTRAINT.

### Rule 3.1: Pre-MVP / MVP Development
**Stage Values**: "pre-mvp", "mvp-development"

**FORBIDDEN SECTIONS**:
- ❌ `results` (no real metrics exist)
- ❌ `testimonials` (no customers yet)
- ❌ `pricing` (offer not finalized)
- ❌ `comparison` (can't back claims with data)
- ❌ `socialProof` (no customer logos)

**ALLOWED SECTIONS**:
- ✅ `problem` (deep problem understanding)
- ✅ `beforeAfter` (vision-based transformation)
- ✅ `uniqueMechanism` (technical approach)
- ✅ `howItWorks` (explanation of concept)
- ✅ `founderNote` (personal credibility)
- ✅ `features` (planned capabilities)

**SUBSTITUTION RULES**:
- If flow needs trust → Use `founderNote` instead of `testimonials`
- If flow needs proof → Use `beforeAfter` (vision) instead of `results`
- If flow needs validation → Use `uniqueMechanism` (technical credibility) instead of `socialProof`

**Reasoning**: MVP stage cannot fake proof. Use vision, mechanism, and founder credibility instead.

---

### Rule 3.2: MVP Launched / Early Feedback
**Stage Values**: "mvp-launched", "early-feedback"

**FORBIDDEN SECTIONS**:
- ❌ `pricing` (still being validated)
- ❌ Large-scale `results` (metrics are small)

**ALLOWED SECTIONS**:
- ✅ `testimonials` (named individuals, small-scale)
- ✅ `results` (small, specific metrics like "12 early users improved X by Y")
- ✅ `socialProof` (if have logos)

**SUBSTITUTION RULES**:
- If flow needs testimonials but none available → Use `founderNote` or `useCases`
- If flow needs results → Emphasize qualitative wins, specific user stories

**Reasoning**: Early feedback stage has some proof, but it must be authentic and small-scale.

---

### Rule 3.3: Traction / Growth / Scale
**Stage Values**: "traction", "growth", "scale"

**ALL SECTIONS AVAILABLE**: Can use any section type backed by real data

**EMPHASIS**:
- `testimonials` (multiple, diverse)
- `results` (comprehensive metrics)
- `socialProof` (customer logos, awards)
- `comparison` (backed by data)

**Reasoning**: Established stages can use all proof types credibly.

---

## 4. Landing Goal Rules

Landing goal determines objection **depth** and **section cap**.

### Rule 4.1: Waitlist / Early Access (Low Friction)
**Goal Values**: "waitlist", "early-access"

**Section Cap**: 5-6 sections maximum

**Required Sections**: `hero`, `cta`

**Recommended Sections**: `problem` OR `vision`, `socialSignal` (if available), `founderNote` (for MVP)

**Forbidden Sections**:
- ❌ `comparison` (too much for curiosity signup)
- ❌ `objectionHandling` (overkill)
- ❌ Heavy `results` or `testimonials`

**Reasoning**: Low-friction goals need minimal convincing. Create curiosity and FOMO, not extensive proof.

---

### Rule 4.2: Free Trial / Signup (Medium Friction)
**Goal Values**: "free-trial", "signup"

**Section Cap**: 7 sections maximum

**Required Sections**: `hero`, `features`, `cta`

**Recommended Sections**: `howItWorks`, `testimonials` (1-2), `faq`

**Forbidden Sections**:
- ❌ `comparison` (they can test themselves)
- ❌ Heavy `objectionHandling`

**CRITICAL RULE**: Features section MUST use scannable layout (not detailed). User needs quick comprehension.

**Reasoning**: Free trial is "try before you buy." Show value quickly, don't create decision paralysis.

---

### Rule 4.3: Demo / Book Call (Medium-High Friction)
**Goal Values**: "demo", "book-call"

**Section Cap**: 8 sections maximum

**Required Sections**: `hero`, `features`, `results`, `cta`

**Recommended Sections**: `problem` OR `uniqueMechanism`, `testimonials`, `objectionHandling`, `faq`

**Reasoning**: Demo requests need relevance proof. Show peer validation and promise value.

---

### Rule 4.4: Buy Now / Subscribe (High Friction)
**Goal Values**: "buy-now", "subscribe"

**Section Cap**: 8 sections maximum

**Required Sections**: `hero`, `features`, `results`, `testimonials`, `objectionHandling`, `cta`

**Recommended Sections**: `uniqueMechanism`, `comparison` (if applicable), `pricing`, `faq`

**Reasoning**: Purchase decisions need full justification. Provide complete proof stack with risk reversal.

---

### Rule 4.5: Contact Sales / Enterprise (High Friction)
**Goal Values**: "contact-sales"

**Section Cap**: 8 sections maximum

**Required Sections**: `hero`, `socialProof`, `features`, `results`, `cta`

**Recommended Sections**: `security`, `integration`, `objectionHandling`, `testimonials` (enterprise-focused)

**Sequence Preference**: `hero → socialProof → features → security → integration → results → objectionHandling → cta`

**Reasoning**: Enterprise needs technical validation and trust. Credibility first, then capabilities, then proof.

---

## 5. Category-Based Filters

Category determines mental model and filters incompatible sections.

### Rule 5.1: Personal Productivity Tools
**Category Value**: "Personal Productivity Tools"

**Mental Model**: "Will this make MY daily life easier?"

**Forbidden Sections**:
- ❌ `comparison` (too analytical for personal decision)
- ❌ `integration` (unless explicitly relevant)
- ❌ `security` (overkill for personal tools)

**Emphasized Sections**:
- ✅ `beforeAfter` (tangible transformation)
- ✅ `howItWorks` (simple explanation)
- ✅ `testimonials` (relatable personal stories)

**Reasoning**: Personal tools need relatable, simple messaging. Comparison tables feel corporate.

---

### Rule 5.2: Health & Wellness
**Category Value**: "Health & Wellness"

**Mental Model**: "Is this safe AND will it work for ME?"

**Forbidden Sections**:
- ❌ `comparison` (too clinical)
- ❌ Heavy technical details

**Emphasized Sections**:
- ✅ `beforeAfter` (transformation stories)
- ✅ `testimonials` (emotional, personal)
- ✅ `howItWorks` (safety-focused explanation)

**Reasoning**: Health/wellness is deeply personal. Emotional validation over analytical comparison.

---

### Rule 5.3: Business Productivity Tools
**Category Value**: "Business Productivity Tools"

**Mental Model**: "ROI and workflow integration?"

**Emphasized Sections**:
- ✅ `integration` (workflow fit)
- ✅ `results` (ROI metrics)
- ✅ `features` (capabilities)
- ✅ `comparison` (if applicable)

**Reasoning**: Business tools need ROI justification and integration clarity.

---

### Rule 5.4: Developer Tools
**Category Value**: "Engineering & Development Tools"

**Mental Model**: "Technically sound? Actually saves dev time?"

**Required Sections**: `integration`, `howItWorks`

**Emphasized Sections**:
- ✅ `integration` (technical approach)
- ✅ `howItWorks` (implementation details)
- ✅ `features` (technical capabilities)

**De-emphasized Sections**:
- ⚠️ Emotional `problem` agitation (too fluffy)
- ⚠️ Non-technical testimonials

**Reasoning**: Developers need technical proof, not emotional appeals.

---

### Rule 5.5: Enterprise/Legal/Healthcare Tech
**Category Values**: "Healthcare Technology", "Legal Technology"

**Mental Model**: "Security, compliance, and trust?"

**Required Sections**: `security`, `objectionHandling`

**Emphasized Sections**:
- ✅ `security` (certifications, compliance)
- ✅ `testimonials` (industry-specific)
- ✅ `socialProof` (trust signals)

**Reasoning**: Regulated industries need security and compliance proof upfront.

---

## 6. Asset-Aware Substitution

Asset availability triggers **intelligent substitution** to maintain objection coverage without gaps.

### Rule 6.1: Trust Objection Handling

**Objection**: "Can I trust this?"

**Primary Solutions** (in order):
1. `testimonials` (requires: customer testimonials)
2. `results` (requires: real metrics)
3. `socialProof` (requires: customer logos OR user counts)
4. `founderNote` (requires: founder photo)

**Substitution Logic**:

**IF** flow needs trust (testimonials selected)
**AND** no testimonials available
**THEN**:
  - **IF** startup stage is MVP → Substitute with `founderNote`
  - **ELSE IF** customer logos available → Substitute with `socialProof`
  - **ELSE IF** small metrics available → Use `results` (small-scale)
  - **ELSE** → Use `beforeAfter` (vision-based trust)

**NEVER**: Remove trust-building section without substitution (leaves objection gap)

---

### Rule 6.2: Social Validation Objection

**Objection**: "Is anyone else using this?"

**Primary Solutions**:
1. `socialProof` (requires: customer logos OR user count OR awards)
2. `testimonials` (requires: customer testimonials)

**Substitution Logic**:

**IF** flow needs social validation
**AND** no logos AND no testimonials
**THEN**:
  - **IF** waitlist count > 0 → Add social signal in hero ("Join 500+ on waitlist")
  - **ELSE IF** founder story compelling → Use `founderNote` (early believer community)
  - **ELSE** → Use `useCases` (make it relatable without social proof)

---

### Rule 6.3: Integration/Compatibility Objection

**Objection**: "Will this work with my tools?"

**Primary Solution**: `integration` (requires: partner logos OR integration list)

**Substitution Logic**:

**IF** flow needs integration
**AND** no integration logos available
**THEN**:
  - **IF** API available → Add technical approach section (API-first messaging)
  - **ELSE** → Remove `integration` section entirely (don't create doubt)
  - **AND** → Mention compatibility in `features` section instead

---

### Rule 6.4: Visual/Product Proof

**Objection**: "Show me what this looks like"

**Primary Solutions**:
1. Product images in `beforeAfter`, `features`, `howItWorks`
2. Demo video

**Substitution Logic**:

**IF** section requires product images
**AND** no product images available
**THEN**:
  - **IF** MVP stage → Use design mockups (clearly labeled as concept)
  - **ELSE** → Emphasize text-based descriptions, remove image-heavy sections

**Affected Sections**: `beforeAfter` (some layouts), `features` (some layouts)

---

### Rule 6.5: Founder Credibility

**Objection**: "Who's behind this?"

**Primary Solution**: `founderNote` (requires: founder photo)

**Substitution Logic**:

**IF** `founderNote` selected
**AND** no founder photo
**THEN**:
  - Add "About" section in footer with text-only founder background
  - OR remove `founderNote` if not critical to flow

---

## 7. Intersection Override Rules

When multiple factors conflict, these rules **override** base templates.

### Rule 7.1: Problem-Aware + Any Stage = MUST Include Problem Section Early

**When**: Awareness level is "problem-aware"
**Override**: Insert `problem` section at position 2 or 3 (after hero)
**Priority**: Highest - overrides all other rules
**Why**: Problem-aware users need emotional validation before solution discussion

**Example**:
- Base template says: `hero → uniqueMechanism → features → cta`
- Override applies: `hero → problem → uniqueMechanism → features → cta`

---

### Rule 7.2: MVP Stage + Any Sophistication = NEVER Results Section

**When**: Startup stage is "pre-mvp" OR "mvp-development"
**Override**: Remove `results` section from any template
**Substitute With**: `beforeAfter` (vision) OR `uniqueMechanism` (technical credibility)
**Priority**: Highest - this is a hard constraint
**Why**: MVP cannot generate credible metrics, generic copy hurts credibility

**Example**:
- Base template says: `hero → features → results → cta`
- Override applies: `hero → features → beforeAfter → cta`

---

### Rule 7.3: Free Trial Goal + Any Sophistication = NO Comparison

**When**: Landing goal is "free-trial" OR "signup"
**Override**: Remove `comparison` section from any template
**Priority**: High
**Why**: Free trial users can test themselves, comparison creates decision paralysis

**Example**:
- Base template says: `hero → features → comparison → results → cta`
- Override applies: `hero → features → results → cta`

---

### Rule 7.4: Personal Category + Any Goal = NO Comparison

**When**: Category is "Personal Productivity Tools" OR "Health & Wellness"
**Override**: Remove `comparison` section
**Priority**: High
**Why**: Personal mental model conflicts with analytical comparison tables

---

### Rule 7.5: Problem-Aware + Level-3 + MVP + Free Trial (Complex Intersection)

**When**: All conditions true:
- Awareness: problem-aware
- Sophistication: level-3
- Stage: MVP
- Goal: free-trial

**Analysis**:
- Problem-aware → Needs problem validation (section 2)
- Level-3 → Needs differentiation (uniqueMechanism)
- MVP → Cannot use results, comparison
- Free trial → Needs quick comprehension

**Resulting Flow**: `hero → problem → uniqueMechanism → features → howItWorks → founderNote → cta`

**Why This Works**:
- Problem validation (problem-aware need)
- Differentiation (level-3 need)
- Vision/credibility instead of metrics (MVP constraint)
- Clear, scannable (free trial need)

---

### Rule 7.6: Solution-Aware + Level-4 + Scaling + Buy Now (Complex Intersection)

**When**: All conditions true:
- Awareness: solution-aware
- Sophistication: level-4
- Stage: scaling
- Goal: buy-now

**Analysis**:
- Solution-aware → Lead with differentiation
- Level-4 → Need credibility first, then heavy proof
- Scaling → All proof types available
- Buy now → Need full justification

**Resulting Flow**: `hero → socialProof → uniqueMechanism → results → testimonials → comparison → objectionHandling → pricing → cta`

**Why This Works**:
- Credibility gate (level-4 need)
- Differentiation (solution-aware need)
- Full proof stack (buy now need)
- All proof types available (scaling stage)

---

## 8. Section Ordering Rules

After sections are selected, they must be **ordered** to create coherent mental journey.

### Rule 8.1: Fixed Positions (Non-Negotiable)

**Position 1**: Always `header`
**Position 2**: Always `hero`
**Last Position**: Always `footer`
**Second-to-Last Position**: Always `cta` (just before footer)

**Reasoning**: Header/hero set the stage, CTA/footer close the deal.

---

### Rule 8.2: Early Sections (Position 3-4)

**Purpose**: Set tone, establish context, hook attention

**Preferred Sections for Position 3**:
- `problem` (if problem-aware or unaware)
- `socialProof` (if level-4+ sophistication)
- `uniqueMechanism` (if solution-aware)

**Rule**: The section at position 3 sets the **flow tone** for the rest of the page:
- If `problem` with emotional layout → Flow tone = emotional
- If `socialProof` → Flow tone = credibility-focused
- If `uniqueMechanism` → Flow tone = differentiation-focused

---

### Rule 8.3: Middle Sections (Position 5-7)

**Purpose**: Deliver value, differentiate, prove

**Preferred Order**:
1. Value demonstration (`features`, `howItWorks`)
2. Differentiation (`uniqueMechanism`, `comparison`)
3. Proof (`results`, `testimonials`)

**General Pattern**: Educate → Differentiate → Prove

---

### Rule 8.4: Late Sections (Position 8-9, before CTA)

**Purpose**: Final validation, remove barriers

**Preferred Sections**:
- `objectionHandling` (address last doubts)
- `faq` (remove friction)
- `testimonials` (final social proof)
- `pricing` (if buy-now goal)

**Rule**: Section immediately before CTA should be **decisive**, not educational.

**Good before CTA**:
- `objectionHandling` (removes barriers)
- `testimonials` (builds confidence)
- `pricing` (shows value)

**Bad before CTA**:
- `howItWorks` (too educational, slows momentum)
- `problem` (creates doubt right before close)

---

### Rule 8.5: Section Pairing Rules

**If `problem` is included → `beforeAfter` should follow within 1-2 sections**
Why: After showing pain, show relief

**If `uniqueMechanism` is included → `results` or `testimonials` should follow within 2-3 sections**
Why: After claiming differentiation, prove it works

**If `features` comes early → `results` should come later**
Why: Show what it does, then prove outcomes

**If `comparison` is included → Should come AFTER `features` and `uniqueMechanism`**
Why: Establish value before comparing

---

### Rule 8.6: Tonal Consistency

**If early sections set emotional tone**:
- Keep middle sections accessible (avoid heavy technical)
- Use relatable proof (testimonial stories, not just metrics)
- Maintain simple language

**If early sections set analytical tone**:
- Use data-driven middle sections (metrics, comparisons)
- Technical explanations acceptable
- Use quantitative proof

---

## 9. Section Cap Rules

Section caps prevent decision paralysis while ensuring adequate proof.

### Rule 9.1: Goal-Based Section Caps

**Low Friction Goals**: 5-6 sections max
- waitlist, early-access, watch-video, join-community

**Medium Friction Goals**: 7 sections max
- signup, free-trial, download

**High Friction Goals**: 8 sections max
- demo, book-call, contact-sales, buy-now, subscribe

---

### Rule 9.2: Cap Application Method

**When** selected sections exceed cap:

1. **Never remove required sections** (hero, cta always stay)

2. **Prioritize by profile match**:
   - Tier 1 (highest priority): `hero`, `cta`, `problem` (if problem-aware), `objectionHandling` (if skeptical)
   - Tier 2: `uniqueMechanism`, `features`, `results`, `testimonials`, `socialProof`
   - Tier 3: `security`, `integration`, `howItWorks`, `useCases`
   - Tier 4: `founderNote`, `faq`, `beforeAfter`

3. **Apply objection necessity**:
   - Keep sections that address critical objections for this audience
   - Remove "nice to have" sections first

4. **Maintain flow coherence**:
   - Don't remove a section if it creates a gap in the mental journey
   - Example: Don't remove `beforeAfter` if you kept `problem` (need to show relief)

---

### Rule 9.3: Exception to Caps

**When section cap can be exceeded** (rare):
- Level-5 sophistication + High-friction goal + Scaling stage
- Maximum: 9 sections (excluding header/footer)
- Reasoning: Hyper-saturated markets with purchase decisions need maximum proof

---

## 10. Special Cases & Edge Conditions

### Rule 10.1: No Testimonials + No Social Proof + MVP Stage

**Situation**: Need trust but have minimal assets

**Solution**:
1. MUST include `founderNote` (personal credibility)
2. Emphasize `uniqueMechanism` (technical credibility)
3. Use `beforeAfter` (vision-based trust)
4. Consider `useCases` (relatable scenarios)

**Flow Example**: `hero → problem → founderNote → uniqueMechanism → beforeAfter → howItWorks → cta`

---

### Rule 10.2: Enterprise Goal + MVP Stage

**Situation**: Enterprise buyers but no enterprise proof

**Solution**:
1. Focus on `security` (if certifications available)
2. Emphasize founder background in `founderNote` (if relevant experience)
3. Use `uniqueMechanism` for technical credibility
4. AVOID `results` and `testimonials` (can't fake enterprise proof)
5. Set expectation: "Early stage with enterprise-grade approach"

**Flow Example**: `hero → founderNote → uniqueMechanism → security → howItWorks → integration → cta`

---

### Rule 10.3: Free Trial + Level-5 Sophistication

**Situation**: Low friction goal but hyper-skeptical market

**Conflict**: Free trial wants simplicity, level-5 needs extensive proof

**Resolution**:
1. Section cap: 7 sections (free trial cap)
2. Use efficient proof sections: `testimonials`, `socialProof` (logos-based), `faq`
3. AVOID lengthy sections: Skip `objectionHandling` (full section), use `faq` instead
4. Emphasize: "See for yourself" messaging (leverage free trial advantage)

**Flow Example**: `hero → socialProof → features → testimonials → results → faq → cta`

---

### Rule 10.4: All Assets Available + High Sophistication + High Friction

**Situation**: Full proof stack available, skeptical market, high-commitment decision

**Solution**: Use complete proof flow with all available sections

**Flow Example**: `hero → socialProof → problem → uniqueMechanism → features → results → testimonials → comparison → objectionHandling → pricing → faq → cta`

**Cap**: 8 sections + header/footer = 10 total elements (exception to normal cap)

---

## 11. Rule Application Priority

When multiple rules apply, follow this priority:

1. **Hard Constraints** (Highest)
   - Startup stage proof availability
   - Asset availability for required sections

2. **Awareness-Based Flow** (Very High)
   - Base mental journey sequence
   - Problem section positioning for problem-aware

3. **Intersection Overrides** (High)
   - Complex condition combinations
   - Goal + Stage + Sophistication intersections

4. **Sophistication Modifiers** (Medium-High)
   - Differentiation timing
   - Proof intensity

5. **Goal Rules** (Medium)
   - Section caps
   - Friction-based depth

6. **Category Filters** (Medium-Low)
   - Mental model alignment
   - Section exclusions

7. **Asset Substitution** (Applied Throughout)
   - Maintain objection coverage
   - No gaps in mental journey

---

## 12. Validation Checklist

Before finalizing section selection, validate:

### ✅ Objection Coverage
- [ ] Every critical objection for this audience/stage is addressed
- [ ] No gaps in mental journey (pain → solution → proof → close)
- [ ] Trust-building section included (testimonials OR socialProof OR founderNote)

### ✅ Hard Constraints Respected
- [ ] No forbidden sections for startup stage (MVP ≠ results)
- [ ] No sections requiring unavailable assets
- [ ] Section cap not exceeded (unless justified exception)

### ✅ Flow Coherence
- [ ] Sections follow logical mental progression
- [ ] Awareness level mental journey respected
- [ ] Problem validation before solution (if problem-aware)
- [ ] Differentiation timing appropriate for sophistication level

### ✅ Goal Alignment
- [ ] Proof depth matches decision friction
- [ ] Free trial goals avoid decision paralysis (no comparison)
- [ ] High friction goals have adequate proof stack

### ✅ Category Alignment
- [ ] Personal categories don't have comparison tables
- [ ] Technical categories have technical validation
- [ ] Enterprise categories have security/integration

### ✅ Asset Substitution Applied
- [ ] Missing assets replaced with viable alternatives
- [ ] No objection gaps from removed sections
- [ ] Substitutions maintain credibility level

---

## 13. Implementation Notes

**For Developers**:

1. Implement rules in order of priority (hard constraints first)
2. Use intersection rules as overrides to base templates
3. Asset substitution should be last step (after section selection)
4. Log which rules were applied for debugging
5. Track rule conflicts and resolution paths

**For Future Refinement**:

1. Monitor which rule combinations appear most frequently
2. Track user "regenerate" patterns to identify rule gaps
3. A/B test rule variations to optimize conversion
4. Build rule analytics dashboard for insights

---

## Conclusion

These rules translate objection flow philosophy into actionable decisions. Each rule exists to ensure the landing page answers the prospect's questions **in the order they ask them**.

**Remember**: The goal isn't to include every section, but to include the RIGHT sections in the RIGHT order to move prospects smoothly from awareness to action.

**The Question**: "What is this person thinking RIGHT NOW, and what section moves them to the next thought?"
