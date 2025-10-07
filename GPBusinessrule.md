# Landing Page Generation - Business Rules for Objection Flow Engine

**Last Updated**: 2025-10-07
**Purpose**: Define comprehensive business rules for selecting and sequencing landing page sections based on copywriting principles

## Core Principle

The objection flow engine exists to **gain attention, solve objections in the sequence they occur in the user's mind, and close the sale**.

Sections are not components to mix-and-match. They are **steps in a mental journey** where each section moves the prospect to the next thought.

---

## The Fundamental Flaw in Current Implementation

### Current Approach (Wrong)
- Treats sections as **components** ("include these sections")
- Mixes sections based on independent dimensions
- Doesn't map to the **sequence of objections** in the prospect's mind

### Correct Approach
- Map each awareness level to a **mental journey**
- Each section answers a **specific objection at a specific moment**
- Business rules define **objection sequences**, not section collections

**Key Question**: "What is this person thinking RIGHT NOW, and what section moves them to the next thought?"

---

## 1. Awareness Level = Mental Starting Point

Awareness level determines **where the prospect's mind starts** and therefore the **sequence of objections**.

### Unaware - "I don't know I have a problem"

**Mental Journey**:
1. "Wait, I have a problem I didn't realize?" → **Problem section** (identify it)
2. "How bad is it really?" → **Before/After** (show impact)
3. "What would solved look like?" → **Vision/Results**
4. "How does it work?" → **Mechanism/Features**
5. "Prove it" → **Social Proof**
6. "OK, tell me more" → **Low-friction CTA**

**Section Sequence**: `hero → problem → beforeAfter → howItWorks → results → socialProof → cta`

**Anti-patterns**:
- Starting with features (they don't know they need it)
- Comparison tables (nothing to compare against)
- Heavy differentiation (not educated enough yet)

---

### Problem-Aware - "I know I struggle with this"

**Mental Journey**:
1. "Do you GET my struggle?" → **Problem agitation** (emotional validation FIRST)
2. "Show me what solved looks like" → **Before/After transformation**
3. "OK, how?" → **Features/Solution**
4. "Why THIS solution vs others?" → **Unique mechanism** (only if level 3+)
5. "Proof it works for people like me?" → **Results/Testimonials**
6. "Let's do it" → **CTA**

**Section Sequence**: `hero → problem → beforeAfter → features → uniqueMechanism → results → testimonials → cta`

**Critical Rule**: Problem-aware MUST start with problem validation before any solution discussion.

**Anti-patterns**:
- Jumping to uniqueMechanism/features WITHOUT problem validation first
- Assuming they care about differentiation before you've validated their pain

**Current Bug**: "problem-aware + level-3" flow skips problem section entirely, jumping straight to uniqueMechanism. This violates copywriting fundamentals.

---

### Solution-Aware - "I know solutions exist, show me why you're different"

**Mental Journey**:
1. "You better be different" → **Unique mechanism FIRST** (they've seen others)
2. "Prove you're better" → **Results OR Comparison** (pick one, not both)
3. "Show me social proof" → **Others trust you**
4. "What exactly do I get?" → **Features** (they know features exist generally)
5. "Any gotchas?" → **FAQ/Objections**
6. "OK, I'm in" → **CTA**

**Section Sequence**: `hero → uniqueMechanism → results/comparison → socialProof → features → faq → cta`

**Anti-patterns**:
- Leading with features (they've seen features before)
- Starting with problem agitation (they're past that)

---

### Product-Aware - "I know about YOU specifically, evaluating"

**Mental Journey**:
1. "Can I trust you?" → **Social Proof/Credibility**
2. "Will it work for my situation?" → **Security/Integration/Technical**
3. "Prove the claims" → **Results**
4. "What's the investment?" → **Pricing**
5. "What could go wrong?" → **Objection Handling**
6. "Let's proceed" → **CTA**

**Section Sequence**: `hero → socialProof → security → integration → results → pricing → objectionHandling → cta`

---

### Most-Aware - "Warm lead, almost ready"

**Mental Journey**:
1. "Remind me why I want this" → **Hero**
2. "What's the offer?" → **Pricing**
3. "Quick confidence check" → **Testimonials**
4. "Any final concerns?" → **Objection Handling**
5. "Let's go" → **CTA**

**Section Sequence**: `hero → pricing → testimonials → objectionHandling → cta`

---

## 2. Market Sophistication = Differentiation Timing

Sophistication doesn't just add sections—it changes **WHEN** and **HOW** you differentiate.

### Level 1-2: "What is this?" (Early Market)

**Objection**: They need education first
**Rule**: Explain clearly, features → benefits → basic proof
**Differentiation**: Nice to have, can come late in the flow

**Strategy**:
- Focus on clarity and understanding
- Simple benefit statements work
- Basic social proof sufficient
- No need for comparison tables

---

### Level 3: "I've seen this before..." (Competitive Market)

**Objection**: "What makes YOU different from the 5 others I've looked at?"
**Rule**: Unique mechanism RIGHT AFTER HERO (problem-aware) or AS THE HERO (solution-aware)
**Comparison**: Only if you have clear superiority; otherwise skip (don't highlight parity)

**Strategy**:
- Move differentiation EARLY in flow
- Unique mechanism is mandatory
- Comparison table only if competitive advantage is clear
- Focus on "why this works when others fail"

**Critical Distinction**: Level-3 needs **unique mechanism positioned early**, not necessarily comparison table.

**Anti-pattern**: Adding comparison table by default creates decision paralysis for low-commitment goals.

---

### Level 4-5: "Yeah right, prove it" (Skeptical Market)

**Objection**: Burned before, need overwhelming proof
**Rule**: Lead with credibility (social proof), THEN differentiation, THEN proof stack
**Must include**: Objection handling, risk reversal

**Strategy**:
- Credibility gate first (social proof, authority)
- Then unique mechanism
- Then extensive proof (results, testimonials, case studies)
- Explicit objection handling
- Risk reversal in CTA

---

## 3. Startup Stage = Proof Strategy (Hard Constraint)

Startup stage determines **what proof is AVAILABLE and CREDIBLE**. This is a hard constraint—you can't fake proof types.

### Pre-MVP / MVP Development

**Can't Fake**:
- ❌ Results section
- ❌ Customer testimonials
- ❌ Metrics and numbers
- ❌ Enterprise claims

**CAN Use**:
- ✅ Problem depth (shows founder insight)
- ✅ Mechanism explanation (technical credibility)
- ✅ Founder story (personal authority)
- ✅ Vision (where it's going)
- ✅ Early signals (waitlist count, interest indicators)

**Objection**: "This doesn't exist yet, why care?"

**Section Strategy**: `hero → problem (deep) → beforeAfter (vision) → uniqueMechanism → howItWorks → founderNote → cta`

**CRITICAL RULE**: **NEVER allow results section** - it forces AI to generate generic, unbelievable copy like "improve productivity" which destroys credibility.

**Current Bug**: MVP stage allows "results" section, generating vague metrics that hurt credibility.

---

### MVP Launched / Early Feedback

**Can Use**:
- ✅ Small-scale proof ("12 early users saw X")
- ✅ Qualitative wins (specific improvements)
- ✅ Specific testimonials (named individuals)
- ✅ Limited metrics (real but small)

**Can't Use**:
- ❌ Large metrics
- ❌ Enterprise claims
- ❌ "Thousands of users" statements

**Objection**: "Is this proven or experimental?"

**Section Strategy**: Focus on specific small wins, use case stories, growing momentum signals

---

### Scaling / Established

**Can Use**:
- ✅ All proof types backed by real data
- ✅ Comprehensive results
- ✅ Multiple testimonials
- ✅ Case studies
- ✅ Comparison tables

---

## 4. Landing Goal = Objection Depth

Landing goal determines the **depth of objections** to overcome and therefore the **proof intensity needed**.

### Waitlist / Early Access (Low Friction)

**Objection Sequence**: "What is this?" → "Sounds cool" → "Will I get notified?" → "OK"

**Don't Need**:
- ❌ Comparison (not choosing yet)
- ❌ Extensive proof (just curiosity)
- ❌ Detailed features
- ❌ Pricing information

**Do Need**:
- ✅ Clear concept
- ✅ FOMO (exclusivity, scarcity)
- ✅ Simple signup
- ✅ Social signal (X people joined)

**Section Strategy**: `hero → problem/vision → uniqueAngle → socialSignal → cta`

**Section Cap**: 5-6 sections (curiosity-driven, not proof-driven)

---

### Free Trial (Low-Medium Friction)

**Objection**: "Worth my TIME to test?" → "What's the catch?" → "How fast can I see value?"

**Don't Need**:
- ❌ Comparison table (they'll test themselves)
- ❌ Extensive case studies
- ❌ Heavy objection handling

**Do Need**:
- ✅ Time-to-value promise
- ✅ Catch-clarity (truly free? card required?)
- ✅ Quick-win assurance
- ✅ Simple how-it-works

**Section Strategy**: `hero → features (what you'll try) → howItWorks (simple) → testimonial (quick) → cta`

**ANTI-PATTERN**: Comparison table signals high-commitment decision, conflicts with "just try it" message. This creates cognitive dissonance.

**Current Bug**: Free trial + comparison table = user confusion. Message says "just try it" but structure says "make a serious decision."

**Section Cap**: 7 sections

---

### Demo / Book Call (Medium-High Friction)

**Objection**: "Worth MY TIME?" → "Will this meeting be valuable?" → "Is this relevant to my situation?"

**Strategy**: Demonstrate relevance, show peer proof, promise value

**Section Cap**: 8 sections

---

### Buy Now / Subscribe (High Friction)

**Objection**: "Worth my MONEY?" → "What if it fails?" → "Why not cheaper option?" → "Risk?"

**Need**:
- ✅ Full proof stack
- ✅ Price justification
- ✅ Comparison (if relevant)
- ✅ Risk reversal
- ✅ Testimonials
- ✅ Results
- ✅ Objection handling

**Section Strategy**: Full proof flow with heavy emphasis on value demonstration

**Section Cap**: 8 sections

---

### Contact Sales / Enterprise (High Friction)

**Objection**: "Scale?" → "Security?" → "Integration?" → "Support?" → "Proof?"

**Need**:
- ✅ Technical validation first
- ✅ Security
- ✅ Integration
- ✅ Results
- ✅ Social proof (credibility)
- ✅ Objection handling

**Section Strategy**: `hero → socialProof → security → integration → results → objectionHandling → cta`

**Section Cap**: 8 sections

---

## 5. Category = Mental Model Filter

Category determines the **mental model** prospects use to evaluate the solution.

### Personal Productivity Tools

**Mental Model**: "Will this make MY daily life easier?"

**Objection Focus**: "Does it ACTUALLY save time or just feel productive?"

**Proof Preference**:
- ✅ Before/After (tangible)
- ✅ Personal stories
- ✅ Time-saved metrics
- ✅ Relatable testimonials

**Anti-patterns**:
- ❌ Enterprise features
- ❌ Complex integration talk
- ❌ Comparison tables (too analytical for personal decision)
- ❌ Heavy technical details

**Natural Section Flow**: `hero → relatable problem → beforeAfter → simple howItWorks → "Sarah saved 10 hours/week" → cta`

**Current Bug**: Personal Productivity + Comparison Table conflicts with mental model. Personal users think "for me?" not "feature matrix comparison."

---

### Health & Wellness

**Mental Model**: "Is this safe AND will it work for ME?"

**Objection Priority**: Safety > Efficacy > Sustainability

**Proof Preference**:
- ✅ Personal transformations
- ✅ Before/After
- ✅ Emotional testimonials
- ✅ Safety information

**Anti-patterns**:
- ❌ Comparison tables (too clinical)
- ❌ Heavy technical details
- ❌ Complex mechanisms

**Natural Section Flow**: `hero → emotional problem → transformation stories → howItWorks (safety focus) → testimonials → cta`

---

### Developer Tools

**Mental Model**: "Technically sound? Actually save dev time or more complexity?"

**Objection Focus**: "Is this real or marketing fluff?"

**Proof Preference**:
- ✅ Technical details
- ✅ Integration clarity
- ✅ Developer testimonials
- ✅ Code examples
- ✅ Benchmarks

**Anti-patterns**:
- ❌ Emotional problem agitation
- ❌ Vague "productivity" claims
- ❌ Non-technical testimonials

**Natural Section Flow**: `hero → technical approach → integration → useCases → benchmarks/results → cta`

---

### Business Productivity Tools

**Mental Model**: "ROI? Integration with existing workflow?"

**Proof Preference**:
- ✅ Integration showcase
- ✅ ROI metrics
- ✅ Team testimonials
- ✅ Security

**Natural Section Flow**: `hero → features → integration → results (ROI) → testimonials → cta`

---

## 6. Asset Availability = Objection Coverage Strategy

**CRITICAL INSIGHT**: Asset availability should inform **STRATEGY**, not just exclusion.

### Current Approach (Wrong)
1. Generate section flow based on objection logic
2. Filter out sections if assets aren't available
3. Result: **Objection gap** - the trust objection is now unhandled

### Correct Approach
Asset availability should drive **intelligent substitution** to maintain objection coverage.

**Key Question**: "This section handles a specific objection. If we can't use it (no assets), what ALTERNATIVE section handles the same objection?"

---

### Trust Objection Handling

**Objection**: "Can I trust this?"

**Primary Solutions** (in order of strength):
1. **Testimonials** (strongest - real customer voices)
   - Requires: Customer testimonials with names/photos
   - Handles: Credibility, social proof, results validation

2. **Results Section** (strong - data-driven)
   - Requires: Real metrics, established product
   - Handles: Proof of effectiveness, concrete outcomes

3. **Social Proof** (good - authority signals)
   - Requires: Customer logos, user count, media mentions
   - Handles: Market validation, "others trust them"

4. **Founder Note** (alternative - personal trust)
   - Requires: Founder photo, story
   - Handles: Personal connection, authenticity, vision
   - **Best for**: MVP/early stage, founder-led audiences

**Asset-Aware Substitution Logic**:
```
IF testimonials_needed BUT no_testimonials_available:
  IF startup_stage in [mvp, early]:
    SUBSTITUTE: founderNote (builds personal trust)
  ELSE IF social_proof_assets_available:
    SUBSTITUTE: socialProof (market validation)
  ELSE:
    SUBSTITUTE: results (if metrics available) OR beforeAfter (vision-based trust)
```

---

### Social Validation Objection

**Objection**: "Is anyone else using this?"

**Primary Solutions**:
1. **Social Proof Section**
   - Requires: Customer logos, user counts, awards, media
   - Handles: Market presence, popularity signals

2. **Testimonials**
   - Requires: Customer testimonials
   - Handles: Peer validation, "people like me use this"

**Asset-Aware Substitution Logic**:
```
IF social_validation_needed BUT no_logos_no_testimonials:
  IF waitlist_count > 0:
    ADD: Social signal in hero ("Join 500+ on waitlist")
  ELSE IF founder_story_compelling:
    ADD: founderNote (why I built this, early believer community)
  ELSE:
    SUBSTITUTE: Use case stories (make it relatable even without social proof)
```

---

### Integration/Compatibility Objection

**Objection**: "Will this work with my existing tools?"

**Primary Solution**:
1. **Integration Section**
   - Requires: Partner logos, integration list
   - Handles: Ecosystem fit, compatibility assurance

**Asset-Aware Substitution Logic**:
```
IF integration_needed BUT no_integration_logos:
  IF api_available:
    ADD: Technical approach section (API-first, flexible)
  ELSE:
    REMOVE: Integration section (don't create doubt if can't demonstrate)
    ADJUST: Features section to mention compatibility/flexibility
```

---

### Credibility for Enterprise Objection

**Objection**: "Is this enterprise-ready?"

**Primary Solutions**:
1. **Security Section**
   - Requires: Certifications, security docs
   - Handles: Data safety, compliance

2. **Customer Logos** (enterprise brands)
   - Requires: Enterprise customer logos
   - Handles: "If IBM trusts them, we can too"

**Asset-Aware Substitution Logic**:
```
IF enterprise_goal BUT no_enterprise_logos:
  IF security_certifications_available:
    EMPHASIZE: Security section (technical credibility)
  ELSE:
    SUBSTITUTE: Technical depth in features, detailed how-it-works
    ADD: Founder background (if enterprise experience)
```

---

### Visual Proof Objection

**Objection**: "Show me what this looks like / how it works"

**Primary Solutions**:
1. **Product Images/Screenshots**
   - Requires: Product screenshots, UI images
   - Handles: Visual clarity, interface quality

2. **Demo Video**
   - Requires: Demo video
   - Handles: Dynamic demonstration, ease-of-use proof

**Asset-Aware Substitution Logic**:
```
IF visual_proof_needed BUT no_product_images:
  IF pre_mvp:
    ADD: Design mockups, concept visuals (clearly labeled)
  ELSE:
    EMPHASIZE: How-it-works section (descriptive walkthrough)
    ADD: Before/After (conceptual visualization)
```

---

### Asset Availability Matrix

| Objection Type | Asset Available | Section | Asset Missing | Alternative Section |
|---|---|---|---|---|
| Trust | Testimonials | Testimonials | None | Founder Note (MVP), Social Proof (scaling) |
| Trust | Metrics | Results | None | Before/After (vision), Founder Note |
| Social Validation | Customer Logos | Social Proof | None | Use Cases, Community Signals |
| Integration | Partner Logos | Integration | None | Remove (or technical approach) |
| Enterprise Ready | Enterprise Logos | Social Proof | None | Security, Technical Depth |
| Visual Proof | Screenshots | Product Showcase | None | How It Works (descriptive) |
| Founder Credibility | Founder Photo | Founder Note | None | About section in footer |

---

### Implementation Strategy

**Step 1: Identify Required Objections**
Based on awareness level, sophistication, and goal, determine which objections MUST be addressed.

**Step 2: Check Asset Availability**
For each required objection, check if primary section's assets are available.

**Step 3: Intelligent Substitution**
If assets missing, substitute with alternative section that handles same objection.

**Step 4: Never Leave Objection Gaps**
If no substitution possible, adjust flow to AVOID raising the objection in the first place.

**Example**:
```
Flow requires: Trust handling
Primary: Testimonials
Asset check: ❌ No testimonials
Stage: MVP
Substitution: ✅ Founder Note (personal trust for MVP stage)
Result: Trust objection still handled, different vehicle
```

---

## 7. Intersection Logic (The Missing Layer)

**CRITICAL INSIGHT**: Business rules must evaluate **COMBINATIONS**, not dimensions independently.

When multiple factors conflict, intersection rules should **OVERRIDE template defaults**.

### Example 1: Problem-Aware + Level-3 + MVP + Free Trial

**Current Output** (Wrong):
`hero → uniqueMechanism → features → comparison → results → cta`

**Problems**:
1. Problem-aware needs problem validation FIRST (skipped)
2. MVP can't deliver credible results or comparison data
3. Free trial doesn't need comparison (low commitment)
4. Level-3 needs differentiation, but comparison is wrong vehicle for MVP

**Correct Output**:
`hero → problem → uniqueMechanism → features → howItWorks → founderNote → cta`

**Why**:
- Problem-aware → Start with problem validation (non-negotiable)
- Level-3 → Differentiation via mechanism (achievable), but no comparison (can't back with data)
- MVP → Use mechanism and vision, NOT results
- Free trial → Skip heavy proof, focus on value clarity

---

### Example 2: Solution-Aware + Level-2 + Scaling + Contact Sales

**Context**:
- Solution-aware → They know solutions exist, need differentiation
- Level-2 → Early market, not much competition
- Scaling → Have real proof available
- Contact sales → Need enterprise confidence

**Correct Output**:
`hero → uniqueMechanism → features → security → integration → results → objectionHandling → cta`

**Why**:
- Solution-aware → Lead with differentiation (unique mechanism)
- Level-2 → Simple differentiation sufficient (no comparison needed)
- Scaling → Can use real results
- Contact sales → Add security, integration for enterprise confidence

---

### Example 3: Problem-Aware + Level-4 + Scaling + Buy Now

**Context**:
- Problem-aware → Need problem validation
- Level-4 → Skeptical market, need heavy proof
- Scaling → Have comprehensive proof
- Buy now → High commitment, need full justification

**Correct Output**:
`hero → problem → socialProof → results → testimonials → uniqueMechanism → comparison → objectionHandling → pricing → cta`

**Why**:
- Problem-aware → Start with problem (emotional hook)
- Level-4 → Lead with credibility (social proof), then proof stack
- Scaling → Can deliver all proof types
- Buy now → Full proof flow with price justification

---

## 8. Rule Priority Hierarchy (When Rules Conflict)

When business rules conflict, apply this priority order:

### 1. **Awareness Level** (Highest Priority)
- Determines sequence START
- Non-negotiable
- Defines first 2-3 sections

**Example**: Problem-aware MUST start with problem validation, regardless of other factors.

---

### 2. **Startup Stage** (Hard Constraint)
- Determines proof types AVAILABLE
- Hard constraint—can't fake
- Overrides sections that require unavailable proof

**Example**: MVP CANNOT show results section, even if sophistication level suggests it.

---

### 3. **Asset Availability** (Strategic Constraint)
- Determines section FEASIBILITY
- Triggers intelligent substitution
- Maintains objection coverage

**Example**: No testimonials + need trust → substitute with founder note (MVP) or social proof (scaling).

**Critical Distinction**: Unlike startup stage (absolute constraint), asset availability allows creative substitution to maintain objection coverage.

---

### 4. **Market Sophistication** (Timing)
- Determines differentiation TIMING
- When to show unique mechanism
- Whether comparison makes sense

**Example**: Level-3 → unique mechanism early; Level-4 → lead with credibility first.

---

### 5. **Landing Goal** (Depth)
- Determines sequence DEPTH
- How many proof layers before CTA
- Section cap application

**Example**: Free trial → 7 sections max, lighter proof; Buy now → 8 sections, heavier proof.

---

### 6. **Category** (Filter)
- Filters out incompatible sections
- Mental model alignment

**Example**: Personal Productivity → exclude comparison table (wrong mental model).

---

## 9. Anti-Patterns to Avoid

### ❌ Generic Results for MVP Stage
**Problem**: MVP + Results section = AI generates vague "improve productivity" metrics
**Solution**: NEVER allow results section for MVP stage
**Hard constraint**: Remove results from available sections if stage is pre-MVP or MVP-development

---

### ❌ Comparison Table + Free Trial
**Problem**: Comparison table signals high-commitment decision
**Cognitive dissonance**: Message says "just try it" but structure says "make serious decision"
**Solution**: Exclude comparison table when landing goal is free-trial or signup

---

### ❌ Solution-First for Problem-Aware
**Problem**: Jumping to features/uniqueMechanism before validating prospect's pain
**Violation**: Problem-aware users need emotional validation first
**Solution**: Problem-aware awareness level MUST include problem section before any solution sections

---

### ❌ Comparison Table for Personal Categories
**Problem**: Personal Productivity, Health & Wellness use personal mental model, not analytical
**Wrong fit**: Comparison tables feel too corporate/analytical
**Solution**: Exclude comparison for Personal Productivity, Health & Wellness categories

---

### ❌ Over-Proof for Low-Friction Goals
**Problem**: Waitlist + 8 sections with heavy proof stack
**Decision paralysis**: Too much information for simple decision
**Solution**: Cap sections at 5-6 for waitlist/early-access goals

---

### ❌ Removing Sections Without Substitution
**Problem**: Need trust → select testimonials → no testimonials available → remove section → trust objection now unhandled
**Objection gap**: The mental journey has a missing step
**Solution**: Intelligent substitution - if testimonials unavailable, substitute with founder note (MVP stage) or social proof (if logos available)

**Example**:
- Flow needs: Trust handling
- Selected: Testimonials section
- Asset check: ❌ No testimonials
- Current approach: Remove testimonials (leaves gap)
- Better approach: Substitute with founder note if MVP, or social proof if established

---

## 10. Implementation Strategy

### Phase 1: Fix Critical Intersections
1. **Problem-Aware + Any Stage**: MUST start with problem section
2. **MVP Stage + Any Sophistication**: NEVER allow results section
3. **Free Trial + Any Sophistication**: EXCLUDE comparison table
4. **Personal Category + Any Sophistication**: EXCLUDE comparison table

### Phase 2: Refine Base Templates
Review OBJECTION_FLOWS templates in `objectionFlowEngine.ts`:
- "problem-aware + level-3" → Add problem section at start
- "problem-aware + level-4" → Already has problem section ✓
- All templates → Validate against awareness level mental journeys

### Phase 3: Implement Intersection Override Logic
Create intersection rules that override base templates:
```typescript
// Pseudo-code
if (awarenessLevel === 'problem-aware' && !sections.includes('problem')) {
  // Insert problem after hero
  insertAfter('hero', 'problem');
}

if (startupStage in ['pre-mvp', 'mvp-development'] && sections.includes('results')) {
  // Remove results, substitute with beforeAfter or mechanism
  remove('results');
  if (!sections.includes('beforeAfter')) add('beforeAfter');
}

if (landingGoal === 'free-trial' && sections.includes('comparisonTable')) {
  // Remove comparison
  remove('comparisonTable');
}
```

### Phase 4: Implement Asset-Aware Substitution
Map objections to sections, then handle asset availability intelligently:
```typescript
// Pseudo-code
function handleTrustObjection(sections, assetAvailability, startupStage) {
  // Determine if trust is needed based on flow
  const needsTrust = sections.some(s => ['testimonials', 'socialProof', 'results'].includes(s));

  if (!needsTrust) return sections;

  // Check asset availability for trust-building sections
  if (sections.includes('testimonials') && !assetAvailability.testimonials) {
    remove('testimonials');

    // Intelligent substitution
    if (startupStage in ['pre-mvp', 'mvp-development']) {
      // MVP stage: Use founder credibility
      if (assetAvailability.founderPhoto && !sections.includes('founderNote')) {
        substitute('testimonials', 'founderNote');
      }
    } else {
      // Later stage: Use alternative social proof
      if (assetAvailability.customerLogos && !sections.includes('socialProof')) {
        substitute('testimonials', 'socialProof');
      } else if (!sections.includes('beforeAfter')) {
        // Last resort: Vision-based trust
        substitute('testimonials', 'beforeAfter');
      }
    }
  }

  return sections;
}

// Apply for each objection type
sections = handleTrustObjection(sections, assetAvailability, startupStage);
sections = handleSocialValidation(sections, assetAvailability);
sections = handleIntegrationConcern(sections, assetAvailability);
// etc.
```

### Phase 5: Add Category Filters
Apply category-based exclusions:
- Personal Productivity → No comparison table
- Health & Wellness → No comparison table, no complex technical
- Developer Tools → Require integration/howItWorks

---

## 11. Success Metrics

### Before Implementation
- ❌ Problem-aware flows skip problem validation
- ❌ MVP stages generate generic "results" copy
- ❌ Free trials include comparison tables
- ❌ Sections removed due to missing assets leave objection gaps
- ❌ Copy quality rated "low" by users

### After Implementation
- ✅ All problem-aware flows validate pain before solution
- ✅ MVP stages use credible proof types (vision, mechanism, founder story)
- ✅ Free trial flows optimized for quick decision
- ✅ Asset-aware substitution maintains objection coverage (no gaps)
- ✅ Trust objections handled with available assets (founder note, social proof, etc.)
- ✅ Copy quality improvements measured by user feedback

---

## 12. UIBlock Layout Selection - The Missing Coherence Layer

**CRITICAL INSIGHT**: Section selection is only half the battle. If we pick the right section but the wrong UIBlock layout, copy effectiveness suffers.

**Current State**: UIBlock pickers make isolated decisions without understanding:
- Their role in the objection flow
- What previous sections established
- What tone/complexity was set
- Where they sit in the mental journey

---

### What's Working in Current Pickers ✅

#### 1. Consistent Structure
All pickers follow a solid pattern:
- High-priority hard rules (immediate returns for clear cases)
- Scoring system across multiple dimensions
- Asset-aware adjustments
- Safe fallback defaults

#### 2. Asset Awareness is Implemented
From `pickBeforeAfter.ts`:
```typescript
if (!assetAvailability.productImages) {
  scores.BeforeAfterSlider -= 100;  // Can't use image-dependent layout
  scores.VisualStoryline -= 100;
  scores.TextListTransformation += 50;  // Boost text alternative
}
```

**Good**: Intelligent substitution (boosting alternatives when assets missing)

#### 3. Some Stage Awareness
From `pickResultsLayout.ts`:
```typescript
if (startupStage === "idea" || startupStage === "mvp") {
  scores.OutcomeIcons += 4;        // Vision-based
  scores.EmojiOutcomeGrid += 4;    // Aspirational
  scores.StackedWinsList += 3;     // Qualitative
}
```

Tries to compensate for MVP's lack of real metrics by choosing softer layouts.

**But**: This treats a symptom, not the disease - results section shouldn't be selected for MVP at all (section selection bug).

---

### Critical Gaps in Picker Logic ❌

### Gap 1: Pickers Don't Understand Objection Flow Context

**Section selection asks**: "What objection are we solving in the user's mental journey?"

**Pickers ask**: "What's the best layout given these static attributes?"

**The Disconnect**:
- Problem section in "unaware" flow (position 2) needs to IDENTIFY the problem → `StackedPainBullets` (clarity)
- Problem section in "problem-aware" flow (position 2) needs to AGITATE pain → `EmotionalQuotes` (validation)
- But pickers don't know WHERE the section sits in the objection journey

**Example from `pickProblemLayout.ts`**:
```typescript
if (awarenessLevel === "unaware") {
  scores.StackedPainBullets += 4;
}
else if (awarenessLevel === "problem-aware") {
  scores.BeforeImageAfterText += 4;
}
```

This treats awareness level as a **static attribute**, not as "what mental state is the user in at THIS MOMENT in the flow?"

**Problem**: Problem-aware at section 2 needs different treatment than problem-aware after seeing features.
- Early: "Do they get my struggle?" → Emotional validation
- Later: "OK but does THIS solve my problem?" → Solution validation

---

### Gap 2: No Cross-Section Coherence

Pickers are **isolated** - each makes decisions without knowing what other sections chose.

**Missing Coordination**:
```
If Features chose IconGrid (simple, scannable)
  → Results should be equally digestible (OutcomeIcons)
  NOT QuoteWithMetric (detailed testimonials)

If Problem chose EmotionalQuotes (emotional tone)
  → Results should validate emotionally (testimonial-style)
  NOT BeforeAfterStats (cold metrics)

If UniqueMechanism has 3 highlights
  → Features should complement, not repeat
```

**Real-World Impact**: Tonal whiplash
```
Flow: Emotional problem → Technical feature list → Cold stats → Warm testimonial
Result: Inconsistent story arc, confused prospect
```

---

### Gap 3: Score Weights Lack Unified Philosophy

Each picker prioritizes different dimensions:
- `pickResultsLayout.ts`: **Startup stage = 4-5 points** (highest)
- `pickProblemLayout.ts`: **Copy intent = 5 points** (highest)
- `pickFeature.ts`: **Awareness level = 4-5 points** (highest)

**Question**: What SHOULD matter most?

**Answer Should Be Consistent**:
1. **Objection purpose** (what is this section trying to achieve in the flow?) - should be highest
2. **Asset availability** (hard constraint)
3. **Audience sophistication** (how they process information)
4. Everything else

**Current Problem**: Objection purpose isn't even a dimension pickers consider.

---

### Gap 4: Missing "What Did We Just Do?" Context

Pickers don't know:
- **Previous section**: Did we just agitate pain? → This section should offer relief
- **Next section**: Are we leading into CTA? → Make this section punchy and decisive
- **Position in flow**: Am I the 2nd section (set tone) or 6th section (close the deal)?

**Example Scenario**:
```
Flow: hero → problem → features → uniqueMechanism → results → cta

When we reach RESULTS section:
- Previous context: User just saw unique mechanism (differentiation)
- Next context: Leading into CTA (decision time)
- Optimal results layout: Validates the unique approach + creates urgency
  → BeforeAfterStats (tangible wins from unique mechanism)

But picker doesn't know this context. It might choose:
  → QuoteWithMetric (testimonial-heavy)

This is better for building initial trust, NOT validating differentiation.
```

**Wrong Layout for the Moment**: Good layout, wrong timing in journey.

---

### Gap 5: Asset Substitution is Layout-Level, Not Strategy-Level

**Current Approach** (from `pickBeforeAfter.ts`):
```typescript
if (!productImages) {
  scores.BeforeAfterSlider -= 100;  // Can't use this layout
  scores.TextListTransformation += 50;  // Use this instead
}
```

This is **layout substitution** - "I can't use this specific UIBlock, pick another."

**Missing**: **Strategy-level substitution** - "I need to show transformation, but have no product images. Should I even use Before/After section, or substitute with a different section entirely?"

**Example**:
```
Need: Show transformation (Before/After section)
Asset check: ❌ No product images
Current: Picks TextListTransformation (text-based before/after)
Better: Consider if BeforeAfter section is right choice
  - If MVP stage: Maybe UniqueMechanism section shows "how it will work" better
  - If established: Maybe use Results section with different proof type
```

This should tie back to section-level asset substitution logic (Section 6).

---

### Gap 6: Hard Rules Missing Key Non-Negotiables

Current hard rules are good:
```typescript
if (
  problemType === "burnout-or-overload" &&
  copyIntent === "pain-led" &&
  targetAudience === "founders"
) {
  return "EmotionalQuotes";  // Perfect for emotional connection
}
```

**Missing Hard Rules**:

```typescript
// MVP Stage Protection
if (
  startupStage in ['pre-mvp', 'mvp-development'] &&
  sectionType === 'results'
) {
  // NEVER use metric-heavy layouts
  return "OutcomeIcons";  // Vision-based only
}

// Problem-Aware Flow Rule
if (
  awarenessLevel === 'problem-aware' &&
  sectionType === 'problem' &&
  positionInFlow <= 3  // Early in flow
) {
  // MUST agitate, not just identify
  return "EmotionalQuotes";  // Emotional validation
}

// Free Trial Scannability Rule
if (
  landingGoal === 'free-trial' &&
  sectionType === 'features'
) {
  // MUST be scannable, not detailed
  return "IconGrid";  // Quick comprehension
}
```

These are **non-negotiables** that should bypass the scoring system entirely.

---

## Bridging the Gap: Flow-Aware Picker Architecture

### Solution 1: Add Objection Context to Picker Input

**Current Input**:
```typescript
interface LayoutPickerInput {
  awarenessLevel: string;
  targetAudience: string;
  startupStage: string;
  // ... static attributes
}
```

**Enhanced Input**:
```typescript
interface LayoutPickerInput {
  // ... existing fields

  // NEW: Flow context
  sectionPurpose: 'identify-problem' | 'agitate-pain' | 'show-solution'
                 | 'differentiate' | 'prove' | 'close';
  positionInFlow: number;           // e.g., 2 out of 8 sections
  totalSectionsInFlow: number;      // e.g., 8 total
  previousSection?: {
    type: string;                   // e.g., "problem"
    layout: string;                 // e.g., "EmotionalQuotes"
    tone: 'emotional' | 'analytical' | 'balanced';
  };
  nextSection?: {
    type: string;                   // e.g., "cta"
    purpose: string;                // e.g., "close"
  };
  flowTone: 'emotional' | 'analytical' | 'balanced';  // Set by earlier sections
}
```

This allows pickers to ask: **"What am I trying to achieve in THIS moment of the journey?"**

---

### Solution 2: Implement Flow-Aware Hard Rules

**Instead of**:
```typescript
if (awarenessLevel === "problem-aware") {
  scores.EmotionalQuotes += 5;
}
```

**Do**:
```typescript
// Purpose-driven rule
if (
  sectionPurpose === 'agitate-pain' &&      // This section's job in flow
  awarenessLevel === "problem-aware" &&     // They already know problem exists
  positionInFlow <= 3                        // Early in journey
) {
  return "EmotionalQuotes";  // Hard rule: emotional validation needed NOW
}

// Position-aware rule
if (
  sectionPurpose === 'prove' &&
  nextSection?.type === 'cta' &&            // Leading into close
  positionInFlow >= totalSectionsInFlow - 2  // Near end of flow
) {
  // Need punchy, decisive proof - not lengthy case studies
  if (startupStage === 'mvp') {
    return "StackedWinsList";  // Quick, credible wins
  } else {
    return "BeforeAfterStats";  // Tangible transformation
  }
}
```

---

### Solution 3: Cross-Section Tone Consistency

Track "flow tone" as sections are selected:

```typescript
let flowTone: 'emotional' | 'analytical' | 'balanced' = 'balanced';
let flowComplexity: 'simple' | 'moderate' | 'detailed' = 'moderate';

// After problem section selection
if (problemLayout === 'EmotionalQuotes') {
  flowTone = 'emotional';
  flowComplexity = 'simple';  // Emotional flows stay accessible
}

// Pass to features picker
const featuresLayout = pickFeatureLayout({
  ...input,
  flowTone,
  flowComplexity,
  previousSection: {
    type: 'problem',
    layout: problemLayout,
    tone: flowTone
  }
});

// Features picker adjusts based on established tone
if (flowTone === 'emotional') {
  scores.IconGrid += 5;           // Keep it relatable and accessible
  scores.SplitAlternating -= 3;   // Too technical for emotional flow
  scores.Carousel += 3;            // Friendly, engaging
}

if (flowComplexity === 'simple') {
  scores.IconGrid += 4;            // Maintain simplicity
  scores.MiniCards += 3;
  scores.SplitAlternating -= 2;    // Too detailed
}
```

**Result**: Tonal consistency across the entire page, not section-by-section whiplash.

---

### Solution 4: Unified Priority Hierarchy Across All Pickers

**All pickers should use the same weight system**:

1. **Purpose in objection flow** (5-6 points) - NEW
   - What job does this section need to do RIGHT NOW?
   - Most important factor

2. **Asset availability** (hard constraint: -100 for impossible)
   - Can't fake what we don't have
   - Forces alternatives

3. **Audience sophistication + Awareness** (3-4 points)
   - How do they process information?
   - What's their starting mental state?

4. **Stage/Goal/Category context** (2-3 points)
   - Business context modifiers
   - Secondary considerations

5. **Tone/Style preferences** (1-2 points)
   - Fine-tuning, not primary driver

**Example Implementation**:
```typescript
// Objection purpose scoring (NEW - highest priority)
if (sectionPurpose === 'agitate-pain') {
  scores.EmotionalQuotes += 6;       // Perfect for agitation
  scores.StackedPainBullets += 5;    // Also good for pain focus
  scores.CollapsedCards += 2;        // Too analytical for agitation
} else if (sectionPurpose === 'identify-problem') {
  scores.StackedPainBullets += 6;    // Clarity for identification
  scores.PersonaPanels += 5;         // Good for multiple problem types
  scores.EmotionalQuotes += 2;       // Too emotional for identification
}

// Asset availability (hard constraint)
if (!assetAvailability.productImages) {
  scores.BeforeImageAfterText -= 100;  // Impossible
}

// Audience sophistication (high weight)
if (marketSophisticationLevel >= 'level-4') {
  scores.CollapsedCards += 4;
}

// Stage context (medium weight)
if (startupStage === 'mvp') {
  scores.EmotionalQuotes += 2;
}

// Tone preference (low weight)
if (toneProfile === 'friendly-helpful') {
  scores.EmotionalQuotes += 1;
}
```

---

### Solution 5: Add Sequential Context Awareness

**Example: Results Section Picker**

```typescript
export function pickResultsLayout(input: LayoutPickerInput): ResultsLayout {
  const {
    previousSection,
    nextSection,
    sectionPurpose,
    positionInFlow,
    // ... other inputs
  } = input;

  // Context-aware hard rules

  // Rule 1: If previous section was uniqueMechanism, validate it
  if (previousSection?.type === 'uniqueMechanism') {
    // User just saw "why we're different"
    // Results should prove the unique approach works
    if (startupStage === 'mvp') {
      return "StackedWinsList";  // Qualitative validation
    } else {
      return "BeforeAfterStats";  // Quantitative validation of mechanism
    }
  }

  // Rule 2: If next section is CTA, create urgency
  if (nextSection?.type === 'cta') {
    // Last proof before close - make it decisive
    if (copyIntent === 'desire-led') {
      return "TimelineResults";  // Show progression, momentum
    } else {
      return "StatBlocks";  // Punchy, clear wins
    }
  }

  // Rule 3: If following emotional problem section, maintain tone
  if (previousSection?.tone === 'emotional') {
    return "EmojiOutcomeGrid";  // Keep emotional, relatable
  }

  // Continue with scoring if no hard rule matches...
}
```

---

### Solution 6: Strategy-Level Asset Substitution

Link picker asset substitution back to section-level strategy:

```typescript
function pickBeforeAfterLayout(input: LayoutPickerInput): BeforeAfterLayout | null {
  const { assetAvailability, startupStage, sectionPurpose } = input;

  // Check if Before/After section itself is viable
  if (!assetAvailability.productImages && startupStage === 'mvp') {
    // Strategy-level decision: Before/After may not be right section at all
    // Signal to section selector to consider alternative section
    return null;  // Or throw SectionSubstitutionNeeded
  }

  // If viable, proceed with layout selection...
  if (!assetAvailability.productImages) {
    // Layout-level substitution within Before/After section
    return "TextListTransformation";  // Text-based alternative
  }

  // Standard scoring...
}
```

Then section selector handles strategy-level substitution:
```typescript
if (beforeAfterLayout === null) {
  // Before/After not viable, substitute entire section
  if (startupStage === 'mvp') {
    substitute('beforeAfter', 'uniqueMechanism');  // Show vision via mechanism
  }
}
```

---

## Implementation Phases for Flow-Aware Pickers

### Phase 1: Add Flow Context to Picker Input (Week 1)
1. Extend `LayoutPickerInput` interface with flow context fields
2. Update section selector to track and pass flow context
3. Track flowTone and flowComplexity as sections are selected

### Phase 2: Implement Purpose-Based Hard Rules (Week 2)
1. Define section purposes for each section type
2. Add purpose-driven hard rules to each picker
3. Add position-aware rules (early vs late in flow)

### Phase 3: Add Cross-Section Coherence (Week 3)
1. Pass previousSection context to pickers
2. Implement tone consistency rules
3. Add complexity consistency rules

### Phase 4: Unified Priority System (Week 4)
1. Standardize weight values across all pickers
2. Purpose = 5-6 points (highest)
3. Sophistication/Awareness = 3-4 points
4. Stage/Goal/Category = 2-3 points

### Phase 5: Sequential Context Rules (Week 5)
1. Add "what comes next" awareness
2. Implement "validate previous section" rules
3. Add "prepare for next section" rules

---

## Success Metrics for Flow-Aware Pickers

### Before Implementation
- ❌ Pickers make isolated decisions without flow context
- ❌ Tonal whiplash between sections (emotional → analytical → emotional)
- ❌ Wrong layouts for section purpose (agitation gets identification layout)
- ❌ No coordination between adjacent sections
- ❌ MVP results sections use metric-heavy layouts

### After Implementation
- ✅ Pickers understand their role in objection flow
- ✅ Consistent tone across entire page
- ✅ Layouts match section purpose in the journey
- ✅ Adjacent sections complement each other
- ✅ MVP stages never get metric-heavy layouts for any section
- ✅ Flow-aware hard rules prevent fundamental mismatches

---

## The Complete Picture: Section + Layout Coherence

**Section Selection Philosophy** → Objection flow → Mental journey → Section sequence

**UIBlock Layout Selection** → Purpose in journey → Flow context → Layout choice

**Together**:
```
1. Awareness: problem-aware
2. Objection: "Do they understand my pain?"
3. Section: problem
4. Purpose: agitate-pain
5. Position: 2 of 8 (early)
6. Previous: hero (set stage)
7. Flow tone: Start emotional
8. Layout: EmotionalQuotes ✅

vs Current:
1. Awareness: problem-aware
2. Section: problem
3. Layout: StackedPainBullets (identification, not agitation) ❌
```

**Key Insight**: The best section with the wrong layout is still a conversion killer.

---

## 13. Future Enhancements

### Dynamic Section Ordering
Beyond inclusion/exclusion, optimize **exact order** based on:
- Attention span modeling (front-load critical sections)
- Conversion funnel data (which sequences convert better)
- A/B test learnings

### Persona-Specific Flows
Refine flows based on detailed persona attributes:
- Risk tolerance
- Decision authority
- Technical sophistication
- Budget constraints

### AI-Driven Rule Learning
- Track which section combinations convert best
- Learn from user "regenerate" patterns
- Auto-adjust rules based on performance data

---

## 14. Conclusion

The objection flow engine is fundamentally sound in concept. The issue is **execution of business rules**.

**Key Principle**: Sections aren't components—they're **steps in a mental journey** where each section answers a specific objection at a specific moment.

**Implementation Focus**:
1. Map awareness levels to mental journeys
2. Enforce hard constraints (stage-based proof availability)
3. Implement intersection override logic
4. Filter incompatible sections by category/goal

**The Question to Always Ask**: "What is this person thinking RIGHT NOW, and what section moves them to the next thought?"
