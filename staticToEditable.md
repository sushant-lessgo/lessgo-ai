# Static to Editable Elements - Implementation Guide

This document provides comprehensive patterns and examples for converting static UI elements into editable components within UIBlocks. Based on successful implementations in Hero, Testimonial, and PrimaryCTA sections.

## Table of Contents
1. [Core Patterns](#core-patterns)
2. [Star Rating Implementation](#star-rating-implementation) 
3. [Trust Indicators](#trust-indicators)
4. [Social Proof Elements](#social-proof-elements)
5. [Platform Rating Displays](#platform-rating-displays)
6. [Removal & Add Functionality](#removal--add-functionality)
7. [Helper Components](#helper-components)
8. [Best Practices](#best-practices)
9. [Implementation Checklist](#implementation-checklist)

## Core Patterns

### 1. Conditional Rendering Based on Mode

All editable elements should render differently based on the `mode` prop:

```tsx
// Basic pattern
{mode === 'edit' ? (
  <EditableComponent 
    value={content.field}
    onEdit={(value) => handleContentUpdate('field', value)}
  />
) : (
  <StaticComponent value={content.field} />
)}

// With conditional visibility
{(content.field || mode === 'edit') && (
  <EditableComponent mode={mode} value={content.field} />
)}
```

### 2. Individual Field Storage Pattern

Break compound elements into individual fields for better editing control:

```tsx
// Content Schema - Individual fields instead of arrays
trust_item_1: { type: 'string' as const, default: 'Free 14-day trial' },
trust_item_2: { type: 'string' as const, default: 'No credit card required' },
trust_item_3: { type: 'string' as const, default: 'Cancel anytime' },
trust_item_4: { type: 'string' as const, default: '' },
trust_item_5: { type: 'string' as const, default: '' },

// Helper function to aggregate items
const getTrustItems = (): string[] => {
  const individualItems = [
    blockContent.trust_item_1,
    blockContent.trust_item_2, 
    blockContent.trust_item_3,
    blockContent.trust_item_4,
    blockContent.trust_item_5
  ].filter((item): item is string => Boolean(item && item.trim() !== ''));
  
  // Legacy format fallback
  if (individualItems.length > 0) {
    return individualItems;
  }
  
  return blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : ['Free trial', 'No credit card'];
};
```

### 3. Removal Markers

Use `___REMOVED___` as a special marker for deleted items:

```tsx
// Filtering out removed items
const validItems = items.filter(item => 
  item != null && 
  item.trim() !== '' && 
  item !== '___REMOVED___'
);

// Marking item as removed
handleContentUpdate('field', '___REMOVED___');

// Conditional rendering with removal check
{content.field && content.field !== '___REMOVED___' && (
  <Component />
)}
```

## Star Rating Implementation

### Static Star Rating Function

```tsx
const parseRating = (rating: string) => {
  const match = rating?.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
};

const renderStars = (rating: string) => {
  const ratingNum = parseRating(rating);
  const fullStars = Math.floor(ratingNum);
  const hasHalfStar = (ratingNum % 1) >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <>
      {/* Full stars */}
      {Array.from({ length: fullStars }, (_, i) => (
        <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e5e7eb" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      
      {/* Empty stars */}
      {Array.from({ length: emptyStars }, (_, i) => (
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </>
  );
};
```

### Editable Rating Display

```tsx
{blockContent.rating_value && blockContent.rating_value !== '___REMOVED___' && (
  <div className="relative group/rating-item flex items-center space-x-1">
    {renderStars(blockContent.rating_value)}
    <div className="flex items-center space-x-1 ml-2">
      <EditableAdaptiveText
        mode={mode}
        value={blockContent.rating_value || ''}
        onEdit={(value) => handleContentUpdate('rating_value', value)}
        backgroundType={backgroundType}
        colorTokens={colorTokens}
        variant="body"
        className="text-sm"
        placeholder="4.9/5"
        sectionBackground={sectionBackground}
        data-section-id={sectionId}
        data-element-key="rating_value"
      />
      <EditableAdaptiveText
        mode={mode}
        value={blockContent.rating_count || ''}
        onEdit={(value) => handleContentUpdate('rating_count', value)}
        backgroundType={backgroundType}
        colorTokens={colorTokens}
        variant="body"
        className="text-sm"
        placeholder="from 127 reviews"
        sectionBackground={sectionBackground}
        data-section-id={sectionId}
        data-element-key="rating_count"
      />
    </div>
    
    {/* Remove button */}
    {mode === 'edit' && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleContentUpdate('rating_value', '___REMOVED___');
          handleContentUpdate('rating_count', '___REMOVED___');
        }}
        className="opacity-0 group-hover/rating-item:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
        title="Remove rating section"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
)}
```

## Trust Indicators

### Content Schema for Trust Items

```tsx
// Individual trust item fields (preferred)
trust_item_1: { type: 'string' as const, default: 'Free 14-day trial' },
trust_item_2: { type: 'string' as const, default: 'No credit card required' },
trust_item_3: { type: 'string' as const, default: 'Cancel anytime' },
trust_item_4: { type: 'string' as const, default: '' },
trust_item_5: { type: 'string' as const, default: '' },

// Legacy field (for backward compatibility)
trust_items: { type: 'string' as const, default: 'Free 14-day trial|No credit card required|Cancel anytime' }
```

### Editable Trust Indicators Implementation

```tsx
{mode === 'edit' ? (
  <EditableTrustIndicators
    mode={mode}
    trustItems={[
      blockContent.trust_item_1 || '',
      blockContent.trust_item_2 || '',
      blockContent.trust_item_3 || '',
      blockContent.trust_item_4 || '',
      blockContent.trust_item_5 || ''
    ]}
    onTrustItemChange={(index, value) => {
      const fieldKey = `trust_item_${index + 1}` as keyof ContentInterface;
      handleContentUpdate(fieldKey, value);
    }}
    onAddTrustItem={() => {
      const emptyIndex = [
        blockContent.trust_item_1,
        blockContent.trust_item_2,
        blockContent.trust_item_3,
        blockContent.trust_item_4,
        blockContent.trust_item_5
      ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
      
      if (emptyIndex !== -1) {
        const fieldKey = `trust_item_${emptyIndex + 1}` as keyof ContentInterface;
        handleContentUpdate(fieldKey, 'New trust item');
      }
    }}
    onRemoveTrustItem={(index) => {
      const fieldKey = `trust_item_${index + 1}` as keyof ContentInterface;
      handleContentUpdate(fieldKey, '___REMOVED___');
    }}
    colorTokens={colorTokens}
    sectionBackground={sectionBackground}
    sectionId={sectionId}
    backgroundType={backgroundType}
    iconColor="text-green-500"
    colorClass={mutedTextColor}
  />
) : (
  <TrustIndicators 
    items={trustItems}
    colorClass={mutedTextColor}
    iconColor="text-green-500"
  />
)}
```

## Social Proof Elements

### Customer Avatars Pattern

```tsx
// Content Schema
show_customer_avatars: { type: 'boolean' as const, default: true },
avatar_count: { type: 'number' as const, default: 4 },
customer_count: { type: 'string' as const, default: '500+ happy customers' },

// Implementation
{blockContent.customer_count && blockContent.customer_count !== '___REMOVED___' && (
  <div className="flex items-center space-x-2 relative group/customer-item">
    {blockContent.show_customer_avatars !== false && (
      <div className="flex -space-x-2">
        {Array.from({ length: blockContent.avatar_count || 4 }, (_, i) => (
          <div 
            key={i}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
    )}
    <EditableAdaptiveText
      mode={mode}
      value={blockContent.customer_count || ''}
      onEdit={(value) => handleContentUpdate('customer_count', value)}
      backgroundType={backgroundType}
      colorTokens={colorTokens}
      variant="body"
      className="text-sm"
      placeholder="500+ happy customers"
      sectionBackground={sectionBackground}
      data-section-id={sectionId}
      data-element-key="customer_count"
    />
    
    {/* Remove button */}
    {mode === 'edit' && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleContentUpdate('customer_count', '___REMOVED___');
        }}
        className="opacity-0 group-hover/customer-item:opacity-100 ml-1 text-red-500 hover:text-red-700 transition-opacity duration-200"
        title="Remove customer count"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
)}
```

## Platform Rating Displays

### Multiple Platform Ratings

```tsx
// Content Schema
platforms_title: { type: 'string' as const, default: 'Consistently High Ratings Across Platforms' },
g2_rating: { type: 'string' as const, default: '4.8' },
g2_label: { type: 'string' as const, default: 'G2 Score' },
capterra_rating: { type: 'string' as const, default: '4.9' },
capterra_label: { type: 'string' as const, default: 'Capterra Rating' },
trustpilot_rating: { type: 'string' as const, default: '4.7' },
trustpilot_label: { type: 'string' as const, default: 'Trustpilot Score' },

// Implementation
const platformData = [
  { rating: blockContent.g2_rating, label: blockContent.g2_label, platform: 'G2' },
  { rating: blockContent.capterra_rating, label: blockContent.capterra_label, platform: 'Capterra' },
  { rating: blockContent.trustpilot_rating, label: blockContent.trustpilot_label, platform: 'Trustpilot' }
].filter(item => item.rating && item.rating !== '___REMOVED___' && item.rating.trim() !== '');

{platformData.length > 0 && (
  <div className="mt-8">
    <EditableAdaptiveText
      mode={mode}
      value={blockContent.platforms_title || ''}
      onEdit={(value) => handleContentUpdate('platforms_title', value)}
      backgroundType={backgroundType}
      colorTokens={colorTokens}
      variant="body"
      className="text-center text-lg font-semibold mb-6"
      placeholder="Platform Ratings Title"
      sectionBackground={sectionBackground}
      data-section-id={sectionId}
      data-element-key="platforms_title"
    />
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {platformData.map((platform, index) => (
        <div key={index} className="text-center">
          <StarRating rating={parseFloat(platform.rating)} size="large" />
          <div className="mt-2">
            <div className="text-2xl font-bold">{platform.rating}/5</div>
            <div className="text-sm text-gray-600">{platform.label}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

## Removal & Add Functionality

### Hover-Based Remove Buttons

```tsx
// Group hover pattern for remove buttons
<div className="relative group/item-name">
  {/* Main content */}
  <EditableComponent />
  
  {/* Remove button - appears on hover */}
  {mode === 'edit' && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleContentUpdate('field_name', '___REMOVED___');
      }}
      className="opacity-0 group-hover/item-name:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
      title="Remove this item"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )}
</div>
```

### Add New Item Functionality

```tsx
// Add button pattern
{mode === 'edit' && validItems.length < maxItems && (
  <button
    onClick={handleAddItem}
    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-2 self-start"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
    <span>Add item</span>
  </button>
)}

// Add handler function
const handleAddItem = () => {
  const emptyIndex = items.findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
  
  if (emptyIndex !== -1) {
    const fieldKey = `item_${emptyIndex + 1}` as keyof ContentInterface;
    handleContentUpdate(fieldKey, 'New item');
  }
};
```

## Helper Components

### EditableTrustIndicators Component

Located at: `src/components/layout/EditableTrustIndicators.tsx`

Key features:
- Handles both edit and view modes
- Supports adding/removing items
- Filters out removed and empty items
- Provides hover-based edit controls
- Configurable maximum items and styling

Usage:
```tsx
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';

<EditableTrustIndicators
  mode={mode}
  trustItems={trustItemsArray}
  onTrustItemChange={(index, value) => handleUpdate(index, value)}
  onAddTrustItem={handleAdd}
  onRemoveTrustItem={(index) => handleRemove(index)}
  colorTokens={colorTokens}
  sectionBackground={sectionBackground}
  sectionId={sectionId}
  backgroundType={backgroundType}
  maxItems={5}
  showAddButton={true}
/>
```

### StarRating Component

Available in ComponentRegistry or as inline component:

```tsx
const StarRating = React.memo(({ rating, size = 'small' }: { rating: number; size?: 'small' | 'large' }) => {
  const sizeClasses = size === 'large' ? 'w-6 h-6' : 'w-4 h-4';
  
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClasses} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
});
```

## Best Practices

### 1. Consistent Naming Conventions
- Use `show_[element]` for boolean visibility toggles
- Use `[element]_count` for quantity controls
- Use `[element]_[index]` for individual items in collections
- Use clear, descriptive field names

### 2. Content Schema Patterns
```tsx
// Boolean controls for visibility
show_social_proof: { type: 'boolean' as const, default: true },
show_customer_avatars: { type: 'boolean' as const, default: true },

// Individual items with empty defaults for optional items
trust_item_1: { type: 'string' as const, default: 'Free 14-day trial' },
trust_item_2: { type: 'string' as const, default: 'No credit card required' },
trust_item_3: { type: 'string' as const, default: '' }, // Optional

// Numeric controls with sensible defaults
avatar_count: { type: 'number' as const, default: 4 },
```

### 3. Conditional Rendering Rules
```tsx
// Show in edit mode even if empty (for editing)
{(content.field || mode === 'edit') && <Component />}

// Hide removed items in all modes
{content.field && content.field !== '___REMOVED___' && <Component />}

// Show optional features based on boolean flags
{content.show_feature !== false && <Component />}
```

### 4. Event Handling Best Practices
```tsx
// Always stop propagation for edit buttons
onClick={(e) => {
  e.stopPropagation();
  handleAction();
}}

// Prevent image/avatar clicks from triggering parent events
onClick={(e) => e.stopPropagation()}
```

### 5. Accessibility Considerations
```tsx
// Provide meaningful titles for buttons
title="Remove customer count"
title="Add trust item"

// Include aria-labels when necessary
aria-label="Edit rating value"

// Use semantic HTML elements
<button> instead of <div> for interactive elements
```

## Implementation Checklist

### For Each New Editable Element:

1. **Content Schema** ✅
   - [ ] Add individual fields to content interface
   - [ ] Define CONTENT_SCHEMA with defaults
   - [ ] Include boolean toggles for visibility if needed
   - [ ] Add numeric controls for quantities if applicable

2. **Helper Functions** ✅
   - [ ] Create aggregation function (like `getTrustItems()`)
   - [ ] Add parsing functions for complex data (like `parseRating()`)
   - [ ] Implement rendering functions (like `renderStars()`)

3. **Edit Mode Implementation** ✅
   - [ ] Use EditableAdaptiveText for text fields
   - [ ] Add remove buttons with group hover states
   - [ ] Implement add functionality for collections
   - [ ] Handle `___REMOVED___` markers properly

4. **View Mode Implementation** ✅
   - [ ] Create static rendering version
   - [ ] Filter out empty and removed items
   - [ ] Apply proper styling and colors

5. **Component Integration** ✅
   - [ ] Import necessary editable components
   - [ ] Set up proper event handlers
   - [ ] Add data attributes for section/element tracking
   - [ ] Test both edit and view modes

6. **Testing** ✅
   - [ ] Test adding new items
   - [ ] Test removing items
   - [ ] Test empty states
   - [ ] Test with both individual and legacy data formats
   - [ ] Verify proper styling across different backgrounds

### Example Implementation Template

```tsx
// 1. Add to content interface
interface YourBlockContent {
  // ... existing fields
  your_element_1: string;
  your_element_2: string;
  your_element_3: string;
  show_your_element?: boolean;
}

// 2. Add to content schema
const CONTENT_SCHEMA = {
  // ... existing schema
  your_element_1: { type: 'string' as const, default: 'Default value 1' },
  your_element_2: { type: 'string' as const, default: 'Default value 2' },
  your_element_3: { type: 'string' as const, default: '' },
  show_your_element: { type: 'boolean' as const, default: true },
};

// 3. Create helper function
const getYourElements = (): string[] => {
  const items = [
    blockContent.your_element_1,
    blockContent.your_element_2,
    blockContent.your_element_3
  ].filter((item): item is string => 
    Boolean(item && item.trim() !== '' && item !== '___REMOVED___')
  );
  
  return items;
};

// 4. Implement in component
{blockContent.show_your_element !== false && (
  <div className="your-element-container">
    {mode === 'edit' ? (
      <div className="space-y-2">
        {getYourElements().map((item, index) => (
          <div key={index} className="group/your-element-item flex items-center space-x-2">
            <EditableAdaptiveText
              mode={mode}
              value={item}
              onEdit={(value) => handleContentUpdate(`your_element_${index + 1}`, value)}
              backgroundType={backgroundType}
              colorTokens={colorTokens}
              variant="body"
              placeholder={`Your element ${index + 1}`}
              sectionBackground={sectionBackground}
              data-section-id={sectionId}
              data-element-key={`your_element_${index + 1}`}
            />
            
            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContentUpdate(`your_element_${index + 1}`, '___REMOVED___');
              }}
              className="opacity-0 group-hover/your-element-item:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
              title="Remove this element"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        
        {/* Add button */}
        {getYourElements().length < 3 && (
          <button
            onClick={() => {
              const emptyIndex = [
                blockContent.your_element_1,
                blockContent.your_element_2,
                blockContent.your_element_3
              ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
              
              if (emptyIndex !== -1) {
                handleContentUpdate(`your_element_${emptyIndex + 1}`, 'New element');
              }
            }}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add element</span>
          </button>
        )}
      </div>
    ) : (
      <div className="your-element-display">
        {getYourElements().map((item, index) => (
          <div key={index} className="your-element-item">
            {item}
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

## Conclusion

This guide provides the patterns and components needed to make any static element editable within UIBlocks. The key principles are:

1. **Separation of Edit and View modes** - Different UX for different contexts
2. **Individual field storage** - Better control and flexibility
3. **Consistent removal patterns** - Using `___REMOVED___` markers
4. **Reusable components** - EditableTrustIndicators, StarRating, etc.
5. **Hover-based controls** - Clean UI with contextual editing
6. **Backwards compatibility** - Supporting legacy data formats

Follow the implementation checklist and use the provided examples to convert any remaining static elements into fully editable components.