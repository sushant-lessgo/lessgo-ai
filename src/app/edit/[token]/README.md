# Edit/[token] Flow Documentation

## Overview

The `/edit/[token]` route is the main visual editor for landing pages in Lessgo. It provides a sophisticated WYSIWYG editing interface with:
- Real-time visual editing
- Context-aware toolbars
- Advanced text formatting
- Design system integration
- Auto-save capabilities

## Architecture

### Layout Structure

The editor uses a sophisticated multi-layer layout architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     GlobalAppHeader                          │
│  • Logo & Breadcrumb  • Help Menu  • User Profile           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                       EditHeader                             │
│  • Design Controls    • Undo/Redo  • Preview/Publish        │
│    (Background, Color, Typography)                           │
└─────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────────────────────────┐
│              │                                               │
│              │                                               │
│   LeftPanel  │            MainContent                        │
│              │         (Editing Canvas)                      │
│  • Fields    │         • Sections                            │
│  • Settings  │         • Elements                            │
│  • Regenerate│         • Floating Toolbars                   │
│              │                                               │
│              │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

#### 1. GlobalAppHeader
**Location**: `components/layout/GlobalAppHeader.tsx`
**Purpose**: Application-level navigation and user controls
**Features**:
- **Left Section**:
  - Lessgo logo (clickable, returns to dashboard)
  - Breadcrumb navigation showing: `/Editor/[tokenId]`
- **Right Section**:
  - Help menu dropdown with:
    - Editor Guide
    - Video Tutorials
    - Live Chat Support
    - Keyboard Shortcuts (⌘K)
  - User profile with Clerk integration
  - Mobile hamburger menu (toggles LeftPanel on mobile)

#### 2. EditHeader
**Location**: `components/layout/EditHeader.tsx`
**Purpose**: Design system controls and document actions
**Features**:
- **Left Section (Design Controls)**:
  - Background selector button (opens VariableBackgroundModal)
  - Color system button (opens ColorSystemModalMVP)
  - Typography controls dropdown
- **Right Section (EditHeaderRightPanel)**:
  - Undo/Redo buttons
  - Reset button (with confirmation modal)
  - Preview button (opens preview in new tab)
  - Publish button (coming soon)

#### 3. LeftPanel
**Location**: `components/layout/LeftPanel.tsx`
**Purpose**: Project metadata and field management
**Features**:
- **Collapsible**: Can be toggled with arrow button
- **Resizable**: Drag handle for width adjustment (250px - 500px)
- **Content**:
  - Product description display
  - Confirmed fields list with edit capability
  - Hidden inferred fields (expandable)
  - Regenerate content button with options
- **Field Tiles**: Shows all confirmed fields with confidence indicators

#### 4. MainContent
**Location**: `components/layout/MainContent.tsx`
**Purpose**: Primary editing canvas
**Features**:
- **Section Rendering**: All page sections with their layouts
- **Selection System**: Visual selection indicators
- **Floating Toolbars**: Context-aware toolbars that appear on selection
- **Add Section Button**: Bottom floating button to add new sections
- **Element Picker**: Modal for adding new elements to sections

### State Management

#### EditProvider Context
Wraps the entire edit interface and provides:
- Token-scoped store instances via `storeManager`
- Loading and error boundary handling
- Store initialization and cleanup

#### useEditStoreLegacy
Primary state store managing:
```typescript
{
  // Page structure
  sections: string[];
  content: Record<string, any>;
  sectionLayouts: Record<string, string>;
  
  // Selection state
  selectedSection: string | null;
  selectedElement: ElementSelection | null;
  multiSelection: string[];
  
  // UI state
  mode: 'edit' | 'preview';
  leftPanel: { collapsed: boolean; width: number };
  
  // Design system
  theme: ThemeState;
  globalSettings: GlobalSettings;
  
  // Draft persistence
  autoSave: AutoSaveState;
}
```

## Selection System

### Element Selection
- **Section Selection**: Click on section backgrounds or headers
- **Element Selection**: Click on text, images, or other content elements
- **Multi-Selection**: Ctrl/Cmd+click for multiple sections
- **Visual Indicators**: Blue outlines and selection styles

### Selection Attributes
All editable elements receive data attributes:
```html
<div data-section-id="hero" data-element-key="headline">
  <!-- Content -->
</div>
```

### Keyboard Navigation
- Tab/Shift+Tab: Navigate between elements
- Enter/Space: Select focused element
- Escape: Clear selection

## Toolbar System

### Text Toolbar (MVP)
**Location**: `components/toolbars/TextToolbarMVP.tsx`
**Triggers**: When text elements are selected
**Features**:
- Bold, italic, underline formatting
- Font size selection (S, M, L, XL, 2XL, 3XL)
- Color picker with accent colors
- Text alignment (left, center, right)
- Partial text selection support

### Element Toolbar
**Location**: `components/toolbars/ElementToolbar.tsx`
**Triggers**: When non-text elements are selected
**Features**:
- Element-specific actions
- Delete/duplicate options
- Advanced formatting

### Section Toolbar
**Location**: `components/toolbars/SectionToolbar.tsx`
**Triggers**: When sections are selected
**Features**:
- Layout switching
- Background customization
- Section reordering
- Add/remove sections

### Image Toolbar
**Location**: `components/toolbars/ImageToolbar.tsx`
**Triggers**: When image elements are selected
**Features**:
- Image replacement
- Alt text editing
- Sizing controls

### Form Toolbar
**Location**: `components/toolbars/FormToolbar.tsx`
**Triggers**: When form elements are selected
**Features**:
- Form field configuration
- Validation rules
- Submission settings

## Editing Features

### Inline Text Editing
**Implementation**: `components/editor/InlineTextEditor.tsx`
**Technology**: Contenteditable with custom selection handling
**Features**:
- Rich text formatting
- Undo/redo support
- Auto-save on blur
- Selection preservation
- XSS protection

### Text Formatting
```typescript
interface MVPFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
  fontSize: string;
  color: string;
}
```

### Visual Selection
- **Selected Elements**: Blue outline with corner indicators
- **Hover States**: Light blue outline on hover
- **Multi-Selection**: Purple outline for multiple sections
- **Focus Management**: Automatic focus on selection

## Component Architecture

### Core Components

#### EditablePageRenderer
**Purpose**: Renders sections with edit capabilities
**Features**:
- Component registry integration
- Selection attribute injection
- Layout fallback handling
- Error boundary integration

#### SelectionSystem
**Purpose**: Manages selection state and accessibility
**Features**:
- ARIA attributes
- Focus management
- Visual indicators
- Keyboard support

#### FloatingToolbars
**Purpose**: Positions and manages context toolbars
**Features**:
- Smart positioning
- Collision detection
- Responsive behavior
- Animation transitions

### UI Components

#### Modal System
**Location**: `components/modals/`
**Components**:
- TaxonomyModalManager: Field editing modals
- TextInputModal: Text input dialogs
- BaseModal: Reusable modal wrapper

#### Color System
**Location**: `components/ui/ColorPicker/`
**Features**:
- Solid color picker
- Variable color system
- Gradient support
- Accessibility validation

#### Typography
**Location**: `components/ui/typography/`
**Features**:
- Font theme selection
- Size controls
- Line height adjustment
- Letter spacing

## Design System Integration

### Variable Theme System
**Implementation**: `VariableThemeInjector`
**Features**:
- CSS custom properties
- Real-time theme updates
- Background archetype scoring
- Color token generation

### Background System
```typescript
interface BackgroundSystem {
  primary: string;    // Hero, CTA sections
  secondary: string;  // Features, benefits
  neutral: string;    // General content
  divider: string;    // FAQ, separators
  baseColor: string;
  accentColor: string;
  accentCSS: string;
}
```

### Color Tokens
Dynamic CSS variables for:
- Text colors with contrast validation
- Background colors
- Accent colors
- Border colors

## Auto-Save System

### Draft Persistence
**Hook**: `useAutoSave`
**Features**:
- Debounced auto-save (2 seconds)
- Conflict resolution
- Version tracking
- Error recovery

### Save Status Indicators
- **Saved**: Green checkmark
- **Saving**: Loading spinner
- **Error**: Red warning with retry

## Development Patterns

### Adding New Toolbars
1. Create component in `components/toolbars/`
2. Register in toolbar visibility system
3. Add positioning logic
4. Implement context-aware actions

### Custom Element Types
1. Define element interface in types
2. Add to component registry
3. Implement renderer
4. Add toolbar actions

### Selection Handling
```typescript
const handleElementClick = useCallback((
  sectionId: string, 
  elementKey: string, 
  event: React.MouseEvent
) => {
  event.stopPropagation();
  
  if (event.ctrlKey || event.metaKey) {
    // Multi-selection
    toggleMultiSelection(sectionId);
  } else {
    // Single selection
    selectElement({ sectionId, elementKey });
  }
}, [selectElement, toggleMultiSelection]);
```

## Accessibility Features

### ARIA Attributes
- `role="button"` on interactive elements
- `aria-selected` for selection state
- `aria-label` for screen readers
- `tabindex="0"` for keyboard navigation

### Keyboard Support
- Tab navigation between elements
- Enter/Space for selection
- Escape to clear selection
- Arrow keys for toolbar navigation

### Screen Reader Support
- Live region announcements
- Descriptive labels
- State changes announced
- Focus management

## Error Handling

### Error Boundaries
**Component**: `EditLayoutErrorBoundary`
**Features**:
- Component error catching
- Graceful fallbacks
- Error reporting
- Recovery options

### Validation
- Content validation on save
- Image size/format validation
- Form field validation
- Link validation

## Performance Optimizations

### Memoization
- Component memoization with React.memo
- Selector-based state updates
- Debounced operations

### Lazy Loading
- Component registry lazy loading
- Image lazy loading
- Toolbar lazy initialization

### Bundle Splitting
- Route-based code splitting
- Component-based splitting
- Vendor bundle optimization

## Debugging Guide

### Common Issues

1. **Selection Not Working**
   - Check data attributes are present
   - Verify event propagation
   - Check selection store state

2. **Toolbar Not Appearing**
   - Verify toolbar visibility conditions
   - Check positioning calculations
   - Validate selection type

3. **Auto-save Failing**
   - Check network requests
   - Verify token validity
   - Check draft format

4. **Text Formatting Issues**
   - Check contenteditable behavior
   - Verify selection preservation
   - Check formatting utilities

### Debug Tools

#### Console Commands
```javascript
// Check store state
window.__EDIT_STORE__?.getState()

// Check selection
window.__EDIT_STORE__?.getState().selectedElement

// Emergency modal reset
modalEmergencyReset.resetAllModals()
```

#### Debug Panels
- ModalDebugPanel: Modal state debugging
- Store debug panel: State inspection
- Selection indicators: Visual selection debugging

### Performance Monitoring
- Render count tracking
- Selection timing
- Auto-save performance
- Bundle size analysis

## Testing Checklist

### Basic Functionality
- [ ] Page loads without errors
- [ ] Section selection works
- [ ] Element selection works
- [ ] Text editing functions
- [ ] Toolbars appear correctly
- [ ] Auto-save works

### Text Formatting
- [ ] Bold/italic/underline toggles
- [ ] Font size changes
- [ ] Color picker works
- [ ] Text alignment changes
- [ ] Partial selection formatting

### Layout Features
- [ ] Section reordering
- [ ] Layout switching
- [ ] Background changes
- [ ] Add/remove sections

### Responsive Design
- [ ] Mobile toolbar behavior
- [ ] Left panel collapse
- [ ] Touch interactions
- [ ] Responsive layouts

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Focus management
- [ ] ARIA attributes