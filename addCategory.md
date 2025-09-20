# Adding New Categories to Lessgo Landing Page Builder

## Overview
This playbook covers all system touchpoints when adding new market categories to the copywriting-first landing page builder. Each category addition requires updates across 7 core systems to ensure proper AI inference, section selection, design generation, and copy optimization.

## 🎯 Core Systems That Need Updates

1. **Taxonomy & AI Inference** - Category recognition and embedding matching
2. **Section Selection** - Which sections appear for this category
3. **Background & Theme** - Visual design scoring and theme selection
4. **Copy Generation** - Tone, language, and messaging adaptation
5. **Color & Visual** - Icon libraries, color preferences, visual language
6. **Layout Logic** - Component variants and layout preferences
7. **Testing & Validation** - Ensuring proper category recognition

---

## 📋 Pre-Implementation Checklist

Before adding a new category, gather this information:

- [ ] **Category Name**: Clear, descriptive name (e.g., "Education & Learning")
- [ ] **Subcategories**: 5-8 specific subcategories (e.g., "Study Tools", "Language Learning")
- [ ] **Target Audiences**: Who uses apps in this category (e.g., "Students", "Teachers")
- [ ] **Common Problems**: What issues this category solves
- [ ] **Visual Style**: What design language fits (professional, playful, trustworthy)
- [ ] **Competitor Examples**: 3-5 landing pages from this category for reference

---

## 🔧 Step-by-Step Implementation

### Step 1: Update Core Taxonomy
**File: `src/modules/inference/taxonomy.ts`**

#### 1.1 Add to Market Categories
```typescript
export const marketCategories = [
  // ... existing categories ...
  'Education & Learning',  // Add your new category
] as const;
```

#### 1.2 Add Subcategories
```typescript
export const marketSubcategories: Record<MarketCategory, readonly string[]> = {
  // ... existing subcategories ...
  'Education & Learning': [
    'Study Tools & Planners',
    'Language Learning Platforms',
    'Test Prep & Certification',
    'Online Course Platforms',
    'Skill Development Apps',
    'Academic Writing Tools',
    'Research & Reference Tools',
  ],
};
```

#### 1.3 Add Target Audiences (if needed)
```typescript
// Add to existing audience groups or create new group
{
  id: 'education',
  label: 'Education & Learning',
  audiences: [
    { id: 'students', label: 'Students', tags: ['B2C', 'Low Budget'] },
    { id: 'teachers', label: 'Teachers & Educators', tags: ['B2C', 'Professional'] },
    { id: 'parents', label: 'Parents', tags: ['B2C', 'Family'] },
    { id: 'lifelong-learners', label: 'Lifelong Learners', tags: ['B2C'] },
  ]
}
```

### Step 2: Update AI Inference & Embeddings
**File: `src/modules/inference/inferFields.ts`**

#### 2.1 Add Few-Shot Example
```typescript
// Add to buildSystemPrompt() examples section
Input: "AI-powered study planner that adapts to your learning style"
Output: {"marketCategory": "Education & Learning", "marketSubcategory": "Study Tools & Planners", "keyProblem": "Students struggle to create effective study plans that work with their learning style", "targetAudience": "Students", "startupStage": "MVP", "pricingModel": "Freemium", "landingPageGoals": "Start Free Trial"}
```

#### 2.2 Regenerate Embeddings
```bash
# Run the embedding population script
npm run populate-embeddings
# OR if no script exists:
npx tsx src/scripts/populateEmbeddings.ts
```

### Step 3: Configure Section Selection Logic
**File: `src/modules/sections/objectionFlowEngine.ts`**

#### 3.1 Add Category-Specific Modifiers
```typescript
// Find the generateCategoryModifiers function and add:
case 'Education & Learning':
  return {
    adjustments: {
      [SECTION_IDS.results]: 0.3,        // Learning outcomes are important
      [SECTION_IDS.testimonials]: 0.2,   // Student success stories
      [SECTION_IDS.howItWorks]: 0.2,     // Clear learning process
      [SECTION_IDS.pricing]: -0.1,       // Price sensitivity
      [SECTION_IDS.security]: -0.2,      // Less relevant for education
      [SECTION_IDS.integrations]: -0.2,  // Less technical focus
    },
    reasoning: "Education users need clear learning outcomes and simple processes"
  };
```

#### 3.2 Add Audience-Specific Logic
```typescript
// In generateAudienceModifiers function:
case 'students':
  return {
    adjustments: {
      [SECTION_IDS.pricing]: -0.2,       // Price sensitive
      [SECTION_IDS.socialProof]: 0.2,    // Peer validation important
      [SECTION_IDS.howItWorks]: 0.1,     // Need clear instructions
    },
    reasoning: "Students need simple, affordable solutions with peer validation"
  };
```

### Step 4: Update Background & Theme System
**File: `src/modules/Design/background/themeScoreMap.ts`**

#### 4.1 Add Scoring Rules for Each Theme
```typescript
// For each theme variant, add education scoring:
"soft-gradient-blur::modern-blue": {
  "market": {
    // ... existing scores ...
    "Education & Learning": 3,  // 0-3 scale, 3 = best fit
  },
  // ... other scoring dimensions
},

// Recommended scores for Education:
// - Friendly, approachable themes: 3
// - Professional but not cold: 2
// - Technical/dark themes: 0-1
// - Playful, creative themes: 2-3
```

#### 4.2 Consider New Theme Archetypes
If existing themes don't fit, add new archetype in `src/modules/Design/background/themes.ts`:
```typescript
{
  id: "academic-clean",
  label: "Academic Clean",
  themes: [
    { id: "study-blue", label: "Study Blue" },
    { id: "notebook-white", label: "Notebook White" },
    { id: "academic-green", label: "Academic Green" }
  ]
}
```

### Step 5: Update Copy Generation
**File: `src/modules/prompt/buildPrompt.ts` (and related prompt files)**

#### 5.1 Add Category-Specific Copy Rules
```typescript
// Add to category copy guidelines:
case 'Education & Learning':
  return {
    tone: 'encouraging, clear, supportive',
    language: 'simple, jargon-free, motivational',
    focus: 'learning outcomes, progress, achievement',
    avoid: 'complex technical terms, overwhelming features',
    cta: 'Start Learning, Begin Your Journey, Try Free',
    benefits: 'personal growth, skill development, achievement'
  };
```

#### 5.2 Update Prompt Templates
```typescript
// In copy generation prompts, add education context:
const categoryContext = {
  'Education & Learning': `
    Focus on learning outcomes and personal growth.
    Use encouraging, supportive language.
    Emphasize progress tracking and achievement.
    Keep technical complexity hidden.
    Students and learners value: simplicity, progress, community, affordability.
  `
};
```

### Step 6: Visual Design & Icons
**File: `src/modules/Design/ColorSystem/` (various files)**

#### 6.1 Add Icon Preferences
```typescript
// Create or update icon mapping:
const CATEGORY_ICONS = {
  // ... existing mappings ...
  'Education & Learning': {
    primary: ['book', 'graduation-cap', 'brain', 'lightbulb'],
    secondary: ['pencil', 'notebook', 'star', 'trophy'],
    avoid: ['server', 'database', 'api', 'shield']
  }
};
```

#### 6.2 Add Color Preferences
```typescript
// Update color scoring for education:
const CATEGORY_COLOR_PREFERENCES = {
  'Education & Learning': {
    preferred: ['blue', 'green', 'purple', 'orange'],
    accent: ['yellow', 'light-blue'],
    avoid: ['red', 'black', 'dark-gray'],
    mood: 'encouraging, trustworthy, energetic'
  }
};
```

### Step 7: Layout & Component Preferences
**File: `src/modules/sections/generateSectionLayouts.ts`**

#### 7.1 Add Category Layout Preferences
```typescript
// Add to layout selection logic:
case 'Education & Learning':
  return {
    heroStyle: 'benefit-focused',      // Clear value proposition
    featuresLayout: 'icon-cards',      // Visual, easy to scan
    testimonialStyle: 'student-stories', // Peer validation
    pricingStyle: 'simple-tiers',      // Not overwhelming
    ctaStyle: 'encouraging-action'      // Motivational language
  };
```

### Step 8: Update Mock Data (Optional)
**File: `src/modules/mock/mockDataGenerators.ts`**

#### 8.1 Add Category Examples
```typescript
// Add to mock data examples:
const CATEGORY_MOCK_EXAMPLES = {
  'Education & Learning': [
    'AI-powered study planner for students',
    'Language learning app with native speakers',
    'Test prep platform for professional certifications',
    'Interactive coding bootcamp for beginners'
  ]
};
```

---

## 🧪 Testing & Validation

### Test Checklist
After implementing all changes:

- [ ] **AI Inference Test**: Input education app descriptions, verify correct category detection
- [ ] **Embedding Test**: Check that semantic matching works for new subcategories
- [ ] **Section Selection**: Verify appropriate sections are chosen for education apps
- [ ] **Background Selection**: Confirm appropriate themes are selected
- [ ] **Copy Generation**: Check tone and language match educational context
- [ ] **Visual Elements**: Verify appropriate icons and colors are used
- [ ] **End-to-End**: Generate complete landing page for education app

### Test Commands
```bash
# Test AI inference
curl -X POST http://localhost:3000/api/infer-fields \
  -H "Content-Type: application/json" \
  -d '{"input": "AI study planner for college students"}'

# Check embeddings
npm run test-embeddings  # If test script exists

# Generate sample page
# Use your app's UI to create a test education landing page
```

### Validation Examples
Test with these education app descriptions:
- "Personalized study planner that adapts to how you learn best"
- "Language exchange platform connecting learners with native speakers"
- "Interactive coding tutorials for complete beginners"
- "Professional certification exam prep with AI-powered practice tests"
- "Collaborative study groups for online students"

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Embedding Mismatches
**Problem**: New category gets matched to wrong existing category
**Solution**:
- Ensure consistent naming between taxonomy and embeddings
- Re-run embedding population script after taxonomy changes
- Check for typos in category names

### Pitfall 2: Theme Scoring Conflicts
**Problem**: Education apps get enterprise/technical themes
**Solution**:
- Review all theme scoring for new category
- Set appropriate scores (3=perfect, 0=bad fit)
- Test with different audience combinations

### Pitfall 3: Section Logic Issues
**Problem**: Wrong sections appear for education apps
**Solution**:
- Check objection flow engine logic
- Verify category-specific modifiers are applied
- Test with different awareness levels and stages

### Pitfall 4: Copy Tone Mismatch
**Problem**: Copy sounds too technical or business-focused
**Solution**:
- Update copy generation prompts with education context
- Add category-specific language guidelines
- Test copy generation with education examples

---

## 📊 Performance Monitoring

After deploying new category:

### Metrics to Watch
- **AI Inference Accuracy**: % of education apps correctly categorized
- **User Satisfaction**: Feedback on generated landing pages
- **Confidence Scores**: Average confidence for new category
- **Section Selection**: Most common section combinations
- **Theme Usage**: Which themes are selected most often

### Success Criteria
- AI inference accuracy > 80% for new category
- User satisfaction ratings maintained or improved
- No significant performance degradation
- Consistent section selection patterns

---

## 🔄 Rollback Procedures

If issues arise after deployment:

### Quick Rollback
1. **Revert Taxonomy**: Remove new category from `taxonomy.ts`
2. **Regenerate Embeddings**: Run embedding script without new category
3. **Redeploy**: Push changes to remove new category

### Partial Rollback
1. **Keep Taxonomy**: Leave category in place
2. **Disable Inference**: Route new category to fallback behavior
3. **Fix Issues**: Address specific problems while category remains available

### Recovery Steps
1. Identify specific issue (inference, design, copy, etc.)
2. Fix individual component without removing entire category
3. Test fix with education examples
4. Monitor metrics to confirm resolution

---

## 📝 Documentation Updates

After successful category addition:

### Update Internal Docs
- [ ] Add category to design system documentation
- [ ] Update AI model training notes
- [ ] Record section selection patterns
- [ ] Document theme preferences

### Update User-Facing Docs
- [ ] Add category to marketing materials
- [ ] Update feature descriptions
- [ ] Create education-specific help content
- [ ] Add customer success examples

---

## 🎯 Category-Specific Examples

### Education & Learning Implementation
Using "Education & Learning" as example throughout this playbook. Here's the complete implementation:

**Taxonomy Addition:**
```typescript
// Added to marketCategories
'Education & Learning'

// Added subcategories
'Education & Learning': [
  'Study Tools & Planners',
  'Language Learning Platforms',
  'Test Prep & Certification',
  'Online Course Platforms',
  'Skill Development Apps',
  'Academic Writing Tools',
  'Research & Reference Tools',
]
```

**Design Characteristics:**
- **Visual Style**: Clean, encouraging, progress-focused
- **Colors**: Blues, greens, friendly oranges
- **Icons**: Books, graduation caps, lightbulbs, stars
- **Tone**: Supportive, clear, motivational
- **Sections**: Results/outcomes focused, clear how-it-works, student testimonials

**Target Results:**
- Education apps get appropriate friendly/encouraging themes
- Copy focuses on learning outcomes and progress
- Sections emphasize student success and clear process
- Pricing appears less prominently (price sensitivity)
- Social proof emphasizes peer validation

---

## ✅ Final Checklist

Before marking category addition complete:

- [ ] All 7 core systems updated
- [ ] Embeddings regenerated successfully
- [ ] AI inference tested with 5+ examples
- [ ] Theme selection tested and appropriate
- [ ] Copy generation matches expected tone
- [ ] Section selection patterns reviewed
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Rollback plan confirmed
- [ ] Success metrics defined
- [ ] Monitoring alerts configured

**Category addition is complete when:**
1. ✅ AI correctly identifies apps in new category (>80% accuracy)
2. ✅ Appropriate themes/designs are selected
3. ✅ Copy tone matches category expectations
4. ✅ Section combinations make sense for category
5. ✅ No performance degradation observed
6. ✅ User satisfaction maintained or improved

---

*This playbook should be updated as the system evolves. Each category addition provides learnings that can improve the process for future categories.*