# UIBlock Upgrade Template

## MVP-Level Upgrade Checklist

### 1. **Import Updates**
```typescript
// ✅ REPLACE these imports:
import { useEditStore } from '@/hooks/useEditStore';
import { generateColorTokens } from '../Design/ColorSystem/colorTokens';
import { EditableHeadline, EditableText } from '@/components/layout/EditableContent';

// ✅ WITH these imports:
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
```

### 2. **Component Hook Migration**
```typescript
// ❌ OLD WAY:
const { getTextStyle } = useTypography();
const { content, mode, theme, updateElementContent } = useEditStore();
const colorTokens = generateColorTokens({...});

// ✅ NEW WAY:
const {
  sectionId,
  mode,
  blockContent,
  colorTokens,
  dynamicTextColors,
  getTextStyle,
  sectionBackground,
  backgroundType,
  handleContentUpdate
} = useLayoutComponent<ComponentContent>({
  ...props,
  contentSchema: CONTENT_SCHEMA
});
```

### 3. **Component Wrapper**
```typescript
// ❌ OLD WAY:
<section className={`py-16 px-4 ${getSectionBackground()} ${className}`}>

// ✅ NEW WAY:
<LayoutSection
  sectionId={sectionId}
  sectionType="ComponentName"
  backgroundType={props.backgroundType || 'neutral'}
  sectionBackground={sectionBackground}
  mode={mode}
  className={props.className}
>
```

### 4. **Text Components**
```typescript
// ❌ OLD WAY:
<EditableHeadline
  mode={mode}
  value={blockContent.headline}
  onEdit={(value) => handleContentUpdate('headline', value)}
  colorClass={colorTokens.textPrimary}
  textStyle={getTextStyle('h2')}
/>

// ✅ NEW WAY:
<EditableAdaptiveHeadline
  mode={mode}
  value={blockContent.headline}
  onEdit={(value) => handleContentUpdate('headline', value)}
  level="h2"
  backgroundType={props.backgroundType || 'neutral'}
  colorTokens={colorTokens}
  textStyle={getTextStyle('h2')}
  sectionId={sectionId}
  elementKey="headline"
  sectionBackground={sectionBackground}
/>
```

### 5. **Component Metadata Export**
```typescript
export const componentMeta = {
  name: 'ComponentName',
  category: 'Category',
  description: 'Brief description with background adaptation mention',
  tags: ['tag1', 'tag2', 'adaptive-colors'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'simple|medium|complex',
  estimatedBuildTime: 'X minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    // ... other fields
  ],
  
  features: [
    'Automatic text color adaptation based on background type',
    'Responsive design',
    // ... other features
  ],
  
  useCases: [
    'Use case 1',
    'Use case 2',
    // ... other use cases
  ]
};
```

## Priority Order for Upgrades:

### **BATCH 1: Hero/CTA Sections (High Impact)**
1. `CenteredHeadlineCTA.tsx` - Simple upgrade
2. `MockupWithCTA.tsx` - Simple upgrade

### **BATCH 2: Feature Sections (Medium Impact)**  
3. `BasicFeatureGrid.tsx` - Simple upgrade
4. `AccordionFAQ.tsx` - Simple upgrade
5. `ObjectionAccordion.tsx` - Simple upgrade

### **BATCH 3: Content/Social Proof (Medium Impact)**
6. `FounderCardWithQuote.tsx` - Simple upgrade
7. `QuoteGrid.tsx` - Simple upgrade
8. `PersonaGrid.tsx` - Simple upgrade

### **BATCH 4: Logo/Brand Sections (Low Impact)**
9. `LogoGrid.tsx` - Simple upgrade
10. `LogoWall.tsx` - Simple upgrade

### **BATCH 5: Legacy Architecture (High Effort)**
11. `SecurityChecklist.tsx` - Full rebuild
12. `StackedHighlights.tsx` - Full rebuild  
13. `StackedPainBullets.tsx` - Full rebuild
14. `StackedTextVisual.tsx` - Full rebuild
15. `StatBlocks.tsx` - Full rebuild
16. `ThreeStepHorizontal.tsx` - Full rebuild
17. `TierCards.tsx` - Full rebuild