# Header & Footer Implementation Documentation

## Overview

This document captures the learnings and patterns from implementing the header and footer components system in the Lessgo AI landing page editor. The implementation provides 4 header variants and 4 footer variants with a unified architecture that integrates seamlessly with the existing state management and editing systems.

## Architecture Overview

### Component Organization
```
src/modules/UIBlocks/
├── Header/
│   ├── CenteredLogoHeader.tsx
│   ├── FullNavHeader.tsx
│   ├── MinimalNavHeader.tsx
│   └── NavWithCTAHeader.tsx
└── Footer/
    ├── SimpleFooter.tsx
    ├── LinksAndSocialFooter.tsx
    ├── MultiColumnFooter.tsx
    └── ContactFooter.tsx

src/components/ui/
└── HeaderLogo.tsx  # Shared logo component
```

### Core Design Principles

1. **Content Schema First**: Each component defines its content structure with defaults
2. **Progressive Enhancement**: Components range from simple to complex
3. **Unified Hook Pattern**: All components use `useLayoutComponent` for consistency
4. **Edit/Preview Modes**: Full support for both editing and preview states
5. **Global State Integration**: Logo management through Zustand store

## Header Components

### 1. CenteredLogoHeader
- **Layout**: Logo centered with navigation items split on both sides
- **Use Case**: Balanced, symmetrical designs
- **Key Features**:
  - 6 navigation items (3 left, 3 right)
  - Smooth scroll anchor navigation
  - Sticky positioning with backdrop blur

### 2. FullNavHeader
- **Layout**: Logo left, navigation center, dual CTAs right
- **Use Case**: Feature-rich applications with conversion focus
- **Key Features**:
  - 5 navigation items
  - Primary and secondary CTA buttons
  - Integrated CTA click handler

### 3. MinimalNavHeader
- **Layout**: Logo left, navigation right
- **Use Case**: Clean, minimalist designs
- **Key Features**:
  - 4 navigation items
  - Simple, distraction-free layout
  - Optimal for content-focused sites

### 4. NavWithCTAHeader
- **Layout**: Logo left, navigation center, single CTA right
- **Use Case**: Balanced design with clear call-to-action
- **Key Features**:
  - 4 navigation items
  - Single prominent CTA button
  - Middle ground between minimal and full

## Footer Components

### 1. SimpleFooter
- **Layout**: Copyright left, links right
- **Use Case**: Minimal footer requirements
- **Key Features**:
  - Copyright text
  - 3 customizable links
  - Clean horizontal layout

### 2. LinksAndSocialFooter
- **Layout**: Logo/tagline, links, social media icons
- **Use Case**: Brand-focused with social presence
- **Key Features**:
  - Company tagline support
  - 4 navigation links
  - Social media icons (Twitter, LinkedIn, GitHub, Facebook)
  - Dark theme styling

### 3. MultiColumnFooter
- **Layout**: Logo/description + 3 link columns
- **Use Case**: Information-rich footers
- **Key Features**:
  - Company description
  - 3 customizable columns with titles
  - 4 links per column
  - Organized information architecture

### 4. ContactFooter
- **Layout**: Contact info, links, newsletter signup
- **Use Case**: Engagement and lead generation
- **Key Features**:
  - Contact information with icons
  - Newsletter subscription form
  - Quick links section
  - Dark theme with high contrast

## Key Implementation Patterns

### Content Schema Pattern
```typescript
const CONTENT_SCHEMA = {
  nav_item_1: { type: 'string' as const, default: 'Products' },
  nav_link_1: { type: 'string' as const, default: '#products' },
  // ... more fields
};
```
**Learning**: Defining schemas with defaults ensures components always have sensible content even when AI generation fails.

### useLayoutComponent Hook
```typescript
const {
  sectionId,
  mode,
  blockContent,
  colorTokens,
  sectionBackground,
  backgroundType,
  handleContentUpdate
} = useLayoutComponent<ContentType>({
  ...props,
  contentSchema: CONTENT_SCHEMA
});
```
**Learning**: This hook provides a consistent interface for all layout components, handling content management, editing states, and theme integration.

### Navigation Link Handling
```typescript
const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
  if (link.startsWith('#')) {
    e.preventDefault();
    const element = document.querySelector(link);
    element?.scrollIntoView({ behavior: 'smooth' });
  }
};
```
**Learning**: Supporting both anchor links and external URLs with smooth scrolling enhances user experience.

### EditableAdaptiveText Integration
```typescript
<EditableAdaptiveText
  mode={mode}
  value={item.text || ''}
  onEdit={(value) => handleContentUpdate(`nav_item_${index + 1}`, value)}
  backgroundType={backgroundType}
  colorTokens={colorTokens}
  variant="body"
  className="inline-block text-sm font-medium"
  placeholder={`Nav Item ${index + 1}`}
  sectionId={sectionId}
  elementKey={`nav_item_${index + 1}`}
  sectionBackground={sectionBackground}
/>
```
**Learning**: Wrapping text in EditableAdaptiveText provides inline editing capabilities while maintaining proper text contrast.

## HeaderLogo Component

### Architecture
The HeaderLogo component is a reusable logo management system with:
- **Edit Mode**: Upload, replace, remove functionality
- **Preview Mode**: Clean display without editing UI
- **Placeholder System**: Shows "LOGO" SVG when no logo is set

### Key Features
1. **File Upload**: Drag-and-drop or click to upload
2. **Validation**: File type and size checks (5MB limit)
3. **Preview Generation**: Uses URL.createObjectURL for instant preview
4. **Error Handling**: Graceful fallback on image load errors
5. **Visual Feedback**: Hover states, loading spinner, remove button

### State Management
```typescript
const { globalSettings, setLogoUrl } = useEditStore();
const logoUrl = globalSettings?.logoUrl || '';
```
**Learning**: Storing logo URL in global settings allows consistent branding across all headers and footers.

## Store Integration

### Layout Actions Updates
```typescript
// Logo Management Actions
setLogoUrl: (url: string) => void;
clearLogo: () => void;
```

### Global Settings Structure
```typescript
globalSettings: {
  maxWidth: string;
  containerPadding: string;
  sectionSpacing: string;
  deviceMode: 'desktop' | 'mobile';
  zoomLevel: number;
  logoUrl?: string; // Added for header/footer support
}
```

## Best Practices & Learnings

### 1. Content-First Approach
- Define content schemas before implementing UI
- Provide sensible defaults for all fields
- Make content easily editable inline

### 2. Progressive Complexity
- Start with simple components (SimpleFooter, MinimalNavHeader)
- Build up to complex ones (ContactFooter, FullNavHeader)
- Reuse patterns across complexity levels

### 3. Consistent Prop Interfaces
All header/footer components accept the same LayoutComponentProps:
- Ensures predictable behavior
- Simplifies component registration
- Enables easy swapping between variants

### 4. Responsive Design Considerations
- Use `sticky top-0 z-50` for headers to ensure proper layering
- Apply `backdrop-blur-sm` for modern glass morphism effect
- Implement responsive grid layouts for footers

### 5. Accessibility
- Proper semantic HTML (nav, ul, li elements)
- ARIA labels for social media icons
- Keyboard navigation support through standard links

### 6. Performance Optimizations
- Lazy filtering of empty navigation items
- Conditional rendering of optional elements
- Efficient re-renders through proper state management

## Common Patterns

### Dynamic Link Generation
```typescript
const navItems = [
  { text: blockContent.nav_item_1, link: blockContent.nav_link_1 || '#' },
  { text: blockContent.nav_item_2, link: blockContent.nav_link_2 || '#' },
  // ...
].filter(item => item.text);
```

### Social Media Integration
```typescript
const socialLinks = [
  { icon: FaTwitter, url: blockContent.social_twitter, label: 'Twitter' },
  { icon: FaLinkedin, url: blockContent.social_linkedin, label: 'LinkedIn' },
  // ...
].filter(social => social.url);
```

### Multi-Column Layout Management
```typescript
const getColumnLinks = (columnNum: number) => {
  const links = [];
  for (let i = 1; i <= 4; i++) {
    const text = blockContent[`column_${columnNum}_link_text_${i}`];
    const url = blockContent[`column_${columnNum}_link_${i}`];
    if (text) {
      links.push({ text, url: url || '#', id: `column_${columnNum}_link_text_${i}` });
    }
  }
  return links;
};
```

## Integration Points

### With AI Generation System
- Content schemas provide structure for AI to fill
- Default values ensure graceful degradation
- Field naming conventions guide AI content generation

### With Theme System
- Components receive colorTokens for adaptive styling
- Background types support theme variations
- Text contrast automatically adjusts based on backgrounds

### With Editor UI
- Inline editing through EditableAdaptiveText
- Section toolbar integration for header/footer management
- Preview/edit mode switching

## Future Enhancements

### Potential Improvements
1. **Mobile Navigation**: Hamburger menu for mobile devices
2. **Mega Menu Support**: Dropdown navigation for complex sites
3. **Animation Options**: Entrance/exit animations for headers
4. **Sticky Footer Options**: Alternative footer positioning
5. **Logo Variations**: Support for different logos in light/dark modes
6. **Navigation Highlighting**: Active page indication
7. **Search Integration**: Header search bar component
8. **Language Switcher**: Multi-language support in headers

### Extensibility Considerations
- Component registry pattern allows easy addition of new variants
- Content schema approach scales to more complex requirements
- Hook-based architecture enables feature composition

## Conclusion

The header and footer implementation demonstrates a well-architected approach to building reusable, editable components in a landing page builder. The combination of content schemas, unified hooks, and progressive enhancement creates a system that is both powerful for developers and intuitive for end users.

Key takeaways:
- **Consistency** through shared patterns and interfaces
- **Flexibility** through content schemas and variants
- **User Experience** through inline editing and immediate preview
- **Maintainability** through clear separation of concerns
- **Scalability** through extensible architecture

This implementation serves as a template for building additional layout components in the Lessgo AI platform.