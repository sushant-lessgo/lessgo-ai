# Publish Flow Fix Plan

## Problem Analysis

### Current Issue
When clicking "Preview" button from dashboard, published pages appear blank due to data corruption in the `PublishedPage` table.

### Root Cause
The `/api/publish` endpoint is saving HTML content in both `content` and `themeValues` fields instead of proper JSON structures:

```
Expected:
- content: Editor format JSON (layout/sections/content structure)
- themeValues: {primary: "#...", background: "#...", muted: "#..."}
- htmlContent: Rendered HTML

Actual (broken):
- content: HTML string (should be JSON)
- themeValues: HTML string (should be object)  
- htmlContent: HTML string (correct)
```

### Why This Happens
Data serialization bug in the publish endpoint - HTML is being saved in fields that should contain structured JSON data. The published page renderer (`PublishedPageRenderer`) expects different data format than what the editor uses (`LandingPageRenderer`).

## Current Architecture Analysis

### What Works Well ✅
- **Two-table approach**: Separate `Project` (drafts) and `PublishedPage` (published) tables
- **Preview in editor**: Draft preview functionality exists
- **Dashboard preview**: Published page preview architecture is correct
- **Basic version control**: Draft/published separation is solid for MVP
- **Data flow separation**: Clear distinction between editing and serving

### Critical Gaps ❌
1. **Data serialization bug**: Wrong data types being saved during publish
2. **Missing project linkage**: `projectId` is null in PublishedPage 
3. **Renderer inconsistency**: Using different renderers for draft vs published pages
4. **Broken preview**: `PublishedPageRenderer` can't parse the editor format data

## Technical Context

### Key Files
- `src/app/api/publish/route.ts` - Publish endpoint (line 24: accepts content/themeValues)
- `src/app/p/[slug]/page.tsx` - Published page route (line 23: passes data to renderer)
- `src/modules/generatedLanding/PublishedPageRenderer.tsx` - Current published page renderer (to be replaced)
- `src/modules/generatedLanding/LandingPageRenderer.tsx` - Universal renderer (to be used everywhere)
- `src/components/dashboard/ProjectCard.tsx` - Dashboard preview button (line 61-62)

### Current (Broken) Data Flow
```
Dashboard → Preview Click → /p/{slug} → PublishedPageRenderer (expects GPTOutput)
                              ↑
                      Loads from PublishedPage table
                              ↑
                    Contains corrupted HTML data
```

### Target (Fixed) Data Flow
```
Dashboard → Preview Click → /p/{slug} → LandingPageRenderer (same as editor)
                              ↑
                      Loads from PublishedPage table
                              ↑
                    Contains proper editor format JSON
```

### Database Schema
```sql
-- Project (Draft state)
Project {
  content: Json? -- Editor format
  themeValues: Json?
  tokenId: String @unique
}

-- PublishedPage (Published state)  
PublishedPage {
  content: Json? -- Should be editor format (same as Project.content)
  themeValues: Json? -- Should be theme object
  htmlContent: String -- Pre-rendered HTML
  projectId: String? -- Currently null (broken link)
}
```

## Fix Plan

### Phase 1: Critical Fixes (Must Have)

#### 1.1 Fix Data Serialization in Publish Endpoint
**File**: `src/app/api/publish/route.ts`
**Issue**: Line 24 - `content` and `themeValues` receiving wrong data types
**Fix**: Ensure correct JSON structures are passed and saved

**Current problem**: 
```javascript
const { slug, htmlContent, title, content, themeValues, tokenId, inputText } = body;
// content and themeValues are HTML strings instead of proper structures
```

**Solution**: Transform editor format to proper structures before saving

#### 1.2 Fix Project-Published Relationship
**File**: `src/app/api/publish/route.ts`
**Issue**: `projectId` is null, no way to trace back to source project
**Fix**: Set `projectId` to link published page back to source project

#### 1.3 Unify Renderers
**Solution**: Replace `PublishedPageRenderer` with `LandingPageRenderer`
- **File**: `src/app/p/[slug]/page.tsx`
- **Change**: Import and use `LandingPageRenderer` instead of `PublishedPageRenderer`
- **Benefit**: Same renderer used everywhere (generate, edit, preview, published)
- **Data**: Store editor format consistently across all states

### Phase 2: Renderer Unification

#### 2.1 Update Published Page Component
**File**: `src/app/p/[slug]/page.tsx`
- Replace `PublishedPageRenderer` import with `LandingPageRenderer`
- Remove GPTOutput type dependency
- Ensure data is passed in editor format

#### 2.2 Update EditProvider for Published Pages
**Consideration**: Published pages may need EditProvider context to work with `LandingPageRenderer`
- Add EditProvider wrapper if needed
- Ensure theme and store context are available

### Phase 3: Validation & Testing

#### 3.1 Add Data Validation
- Validate data structures at API boundaries
- Add runtime checks for expected formats
- Log data transformations for debugging

#### 3.2 Fix Existing Data
- Migration script to fix corrupted PublishedPage records
- Or mark as needing republication

## Implementation Priority

### Priority 1 (Critical - Breaks functionality)
1. Fix publish endpoint data serialization
2. Ensure correct data types in PublishedPage.content
3. Set projectId relationship
4. Test preview functionality works

### Priority 2 (Important - UX issues)  
1. Add data validation
2. Handle format transformation cleanly
3. Error handling for malformed data

### Priority 3 (Nice to have)
1. Data migration for existing records
2. Enhanced error logging
3. Performance optimizations

## Success Criteria

### Functional Requirements
- ✅ Dashboard preview button opens published page correctly
- ✅ Published page renders all sections properly  
- ✅ Theme colors apply correctly
- ✅ Published pages can be traced back to source projects
- ✅ Publishing doesn't corrupt data

### Technical Requirements
- ✅ `PublishedPage.content` contains proper editor format JSON
- ✅ `PublishedPage.themeValues` contains theme object
- ✅ `PublishedPage.projectId` links to source project
- ✅ Same renderer (`LandingPageRenderer`) used for all states
- ✅ Data validation prevents corruption

## Testing Strategy

### Manual Testing
1. Create/edit a landing page
2. Publish the page
3. Verify database contains correct data types
4. Click preview from dashboard
5. Confirm page renders correctly with all sections

### Data Verification
```sql
-- Verify data structure
SELECT 
  id, 
  slug,
  typeof(content) as content_type,
  typeof(themeValues) as theme_type,
  projectId IS NOT NULL as has_project_link
FROM PublishedPage 
WHERE slug = 'test-page';
```

## Rollback Plan
Not required. I will simply reset commit.

## Future Considerations (Post-MVP)

### Performance Optimizations
- Pre-render HTML on publish
- CDN asset delivery
- Image optimization pipeline

### Enhanced Version Control
- Revision history
- Multiple draft versions
- Named checkpoints

### Developer Experience
- Better TypeScript types
- Data transformation utilities
- Debugging tools for data flow

---

## Implementation Steps

### Step 1: Fix Publish Endpoint Data Serialization
1. Debug current publish request in `/preview/[token]` (line 218-233)
2. Ensure `content` field contains editor format JSON (not HTML)
3. Ensure `themeValues` contains proper color object (not HTML)
4. Set `projectId` to link back to source project

### Step 2: Replace PublishedPageRenderer
1. Update `src/app/p/[slug]/page.tsx` to use `LandingPageRenderer`
2. Add `EditProvider` wrapper if needed for context
3. Ensure published page data works with unified renderer

### Step 3: Testing & Validation
1. Test full flow: Edit → Preview → Publish → Dashboard Preview
2. Verify published pages render correctly
3. Confirm theme styling consistency across all modes
4. Add data validation to prevent future corruption

### Step 4: Cleanup (Optional)
1. Remove unused `PublishedPageRenderer` component
2. Remove `GPTOutput` type dependencies related to publishing
3. Update documentation to reflect unified architecture