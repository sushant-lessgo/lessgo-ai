# Logo Editable Implementation Guide

## Overview
This document provides a step-by-step guide to implement editable logo functionality in UIBlocks. The approach treats logos as specialized editable components (closer to icons than full images) with a simplified editing experience focused on upload/replace/remove operations.

## Context & Problem
- UIBlocks contained hardcoded logo placeholders (colored gradient boxes with initials)
- Users couldn't replace placeholder logos with their actual brand assets
- This prevented users from going live with production-ready landing pages
- Initial consideration was to use the full ImageToolbar, but logos need simpler interaction patterns

## Solution Architecture

### Core Components
1. **`LogoEditableComponent.tsx`** - Basic logo editing component
2. **Content Schema Updates** - Add logo URL fields to UIBlock schemas
3. **Conditional Rendering** - Replace specific logos with editable versions
4. **Hover Isolation** - Prevent CSS conflicts with section containers

## Step-by-Step Implementation Guide

### Step 1: Create LogoEditableComponent

**File:** `src/components/ui/LogoEditableComponent.tsx`

```tsx
// components/ui/LogoEditableComponent.tsx
// Basic logo editing component for MVP

import React, { useState, useRef } from 'react';

interface LogoEditableComponentProps {
  mode: 'edit' | 'preview';
  logoUrl?: string;
  onLogoChange: (url: string) => void;
  companyName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LogoEditableComponent: React.FC<LogoEditableComponentProps> = ({
  mode,
  logoUrl,
  onLogoChange,
  companyName,
  size = 'md',
  className = ''
}) => {
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size classes
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20'
  };

  // Generate placeholder logo with company initials
  const generatePlaceholder = (name: string) => {
    const words = name.split(' ');
    const initials = words.length === 1 
      ? name.substring(0, 2).toUpperCase()
      : words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
    
    const colors = [
      'from-blue-600 to-blue-700',
      'from-gray-700 to-gray-800', 
      'from-green-600 to-green-700',
      'from-purple-600 to-purple-700'
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorClass = colors[hash % colors.length];
    
    return { initials, colorClass };
  };

  const { initials, colorClass } = generatePlaceholder(companyName);

  // File upload handler with validation
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file must be smaller than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      onLogoChange(previewUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  // Preview mode - simple display
  if (mode === 'preview') {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-xl overflow-hidden`}>
        {logoUrl ? (
          <img 
            src={logoUrl}
            alt={`${companyName} logo`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shadow-lg`}>
            {initials}
          </div>
        )}
      </div>
    );
  }

  // Edit mode - with upload functionality
  return (
    <div 
      className={`${sizeClasses[size]} ${className} relative`}
      onMouseEnter={() => setShowUploadButton(true)}
      onMouseLeave={() => setShowUploadButton(false)}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Logo display with click to upload */}
      <div 
        className="w-full h-full flex items-center justify-center rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-300 transition-all duration-200 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {logoUrl ? (
          <img 
            src={logoUrl}
            alt={`${companyName} logo`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shadow-lg`}>
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              initials
            )}
          </div>
        )}
        
        {/* Upload overlay - shows on hover in edit mode */}
        {mode === 'edit' && showUploadButton && (
          <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-200 flex items-center justify-center">
            <div className="text-white text-center">
              <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">Upload Logo</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Action buttons - show when logo exists and on hover */}
      {logoUrl && showUploadButton && (
        <div className="absolute -top-2 -right-2 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            title="Replace logo"
          >
            ↻
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Remove this logo?')) {
                onLogoChange('');
              }
            }}
            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            title="Remove logo"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default LogoEditableComponent;
```

### Step 2: Update UIBlock Content Schema

Add logo URL fields to the UIBlock's content interface and schema:

```tsx
// Update content interface
interface LogoWallContent {
  headline: string;
  subheadline?: string;
  company_names: string;
  microsoft_logo?: string; // Add logo fields for each company
}

// Update content schema
const CONTENT_SCHEMA = {
  // ... existing fields
  microsoft_logo: { 
    type: 'string' as const, 
    default: '' 
  }
};
```

### Step 3: Import LogoEditableComponent

Add import to the UIBlock file:

```tsx
import LogoEditableComponent from '@/components/ui/LogoEditableComponent';
```

### Step 4: Implement Conditional Rendering

**CRITICAL:** Avoid hover zone conflicts by isolating the editable logo:

```tsx
{/* Company Logos Grid */}
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
  {companyLogos.map((company) => (
    company.name === 'Microsoft' ? (
      // Special Microsoft logo with isolated hover
      <div key={company.id} className="p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center min-h-[120px]">
        <LogoEditableComponent
          mode={mode}
          logoUrl={blockContent.microsoft_logo}
          onLogoChange={(url) => handleContentUpdate('microsoft_logo', url)}
          companyName={company.name}
          size="md"
        />
        
        {/* Company Name */}
        <div className="text-center mt-3">
          {mode === 'edit' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleNameEdit(company.index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-medium text-gray-700 text-sm text-center"
            >
              {company.name}
            </div>
          ) : (
            <span className="font-medium text-gray-700 text-sm">
              {company.name}
            </span>
          )}
        </div>
      </div>
    ) : (
      // Regular company logos with existing placeholder
      <CompanyLogoPlaceholder
        key={company.id}
        company={company}
        mode={mode}
        getTextStyle={getTextStyle}
        onNameEdit={handleNameEdit}
      />
    )
  ))}
</div>
```

## Key Implementation Points

### 1. Hover Zone Isolation
- **DO NOT** use `group` classes on containers with editable logos
- Create separate containers for editable vs non-editable logos
- Use state-controlled hover (`onMouseEnter`/`onMouseLeave`) instead of CSS hover classes

### 2. File Validation
- Check file type (`file.type.startsWith('image/')`)
- Validate file size (recommended 5MB limit)
- Handle upload errors gracefully with user feedback

### 3. State Management
- Use `URL.createObjectURL()` for preview URLs
- Call `handleContentUpdate()` to persist logo URLs
- Reset file input after upload to allow re-selection

### 4. UX Considerations
- Show upload overlay only in edit mode and on hover
- Provide replace/remove buttons for existing logos
- Use loading spinner during upload
- Generate consistent placeholder colors using name hash

## Testing Checklist

- [ ] Component compiles without TypeScript errors
- [ ] Dev server starts successfully
- [ ] Only target logo shows hover effects (not entire section)
- [ ] File upload works with validation
- [ ] Replace/remove buttons function correctly
- [ ] Placeholder fallback displays when no logo uploaded
- [ ] Preview mode shows logos without edit UI
- [ ] Responsive sizing works across devices

## Rollout Strategy

### Phase 1: Single Logo MVP
- Implement for one logo per section (e.g., Microsoft in LogoWall)
- Test thoroughly before expanding
- Gather feedback on user experience

### Phase 2: Selective Expansion
- Add 2-3 more logos per section based on priority
- Focus on commonly customized companies (Google, Amazon, Apple)

### Phase 3: Full Implementation
- Extend to all logos in a section
- Consider batch operations (upload multiple logos)
- Add logo library/templates feature

## Common Pitfalls to Avoid

1. **Hover Zone Conflicts** - Always isolate editable logo hover from parent containers
2. **Memory Leaks** - Revoke object URLs when component unmounts
3. **File Size** - Implement proper validation to prevent large uploads
4. **State Persistence** - Ensure logo URLs are saved to the content schema
5. **CSS Specificity** - Avoid conflicting hover states between components

## Troubleshooting

### Issue: Entire section responds to hover
- **Solution:** Remove `group` classes, isolate hover handlers per logo

### Issue: Upload not working
- **Solution:** Check file input `accept` attribute and validation logic

### Issue: Logo not persisting
- **Solution:** Verify `handleContentUpdate()` is called with correct field names

### Issue: Preview mode shows edit UI
- **Solution:** Check `mode` prop is correctly passed through component tree

## Future Enhancements

- **Logo Library** - Predefined logo templates
- **Batch Upload** - Multiple logos at once  
- **SVG Support** - Better handling of vector logos
- **Brand Guidelines** - Suggest logo sizes/formats
- **Auto-Recognition** - Detect company from name and suggest logos