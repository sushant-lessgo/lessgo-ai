# Next.js 14 Zustand Multi-Project Store Implementation Requirements

## Project Overview
Implement a scalable, SSR-compatible Zustand store solution for a Next.js 14 (App Router) SaaS landing page builder where each project/token gets isolated state without cross-contamination.

## Current State
- Next.js 14 with App Router
- Zustand with `persist` middleware
- Global EditStore causing state contamination between projects
- Route structure: `/create/[tokenId]`, `/generate/[tokenId]`, `/edit/[tokenId]`, `/preview/[tokenId]`

## Core Requirements

### 1. Store Architecture
- **Dynamic storage keys per token**: `edit-store-${tokenId}`
- **Isolated state per project**: No cross-project state pollution
- **Automatic cleanup**: Limit stored projects to prevent localStorage bloat
- **SSR compatibility**: Client-only initialization with proper hydration

### 2. Technical Implementation

#### Store Structure
```typescript
interface EditState {
  sections: Section[];
  layouts: Record<string, Layout>;
  content: Record<string, Content>;
  // ... other state properties
}
```

#### Required Files/Components
1. **Storage utilities** (`utils/storage.ts`)
   - `getStorageKey(tokenId: string)`
   - `cleanupOldProjects(currentTokenId: string, force?: boolean)`
   - `switchToken(newTokenId: string)`
   - Constants for max stored projects

2. **Store manager** (`stores/storeManager.ts`)
   - Singleton pattern for store instances
   - `getEditStore(tokenId: string)`
   - `cleanupStore(tokenId: string)`
   - `switchToToken(newTokenId: string, oldTokenId?: string)`

3. **Store factory** (`stores/editStore.ts`)
   - `createEditStore(tokenId: string)` function
   - Zustand store with persist middleware
   - Proper partialize configuration
   - Error handling for corrupted storage

4. **React hooks** (`hooks/useEditStore.ts`)
   - SSR-safe store initialization
   - `useEditStore(tokenId: string)` hook

5. **Provider components** (`components/EditProvider.tsx`)
   - Context provider for store access
   - Loading states during hydration
   - Error boundaries

6. **Type definitions** (`types/store.ts`)
   - All TypeScript interfaces and types

### 3. SSR Compatibility Requirements
- **Client-only initialization**: Store creation only on client-side
- **Hydration safety**: Prevent hydration mismatches
- **Loading states**: Graceful handling during store initialization
- **Error boundaries**: Handle storage corruption/errors

### 4. Storage Management Requirements
- **Maximum stored projects**: 10 (configurable)
- **Metadata tracking**: Project access timestamps
- **Automatic cleanup**: On store creation and token switching
- **Orphaned key detection**: Clean up keys not in metadata
- **Storage error handling**: Fallback for corrupted data

### 5. Performance Requirements
- **Lazy loading**: Only load current project data
- **Memory efficiency**: Clean up unused store instances
- **Fast hydration**: Minimal data loading per project
- **Optimized cleanup**: Batch storage operations

### 6. Developer Experience Requirements
- **Type safety**: Full TypeScript support
- **Simple API**: Easy-to-use hooks and providers
- **Debugging support**: Clear error messages and logging
- **Documentation**: Inline code comments

## Implementation Details

### Storage Configuration
- **Storage limit**: 10 most recent projects
- **Metadata key**: `edit-store-metadata`
- **Project key format**: `edit-store-${tokenId}`
- **Cleanup triggers**: Store creation, token switching, forced cleanup

### Error Handling
- Storage corruption recovery
- Missing tokenId scenarios
- SSR/hydration mismatch handling
- localStorage unavailable fallbacks

### Route Integration
- Integration with `/create/[tokenId]` pages
- Provider placement in layout/page components
- Token parameter extraction and validation

## Acceptance Criteria

### Functional Requirements ✅
- [ ] Each token gets completely isolated state
- [ ] No state contamination between projects
- [ ] Automatic cleanup of old projects (keep 10 most recent)
- [ ] SSR-compatible with Next.js 14 App Router
- [ ] Proper loading states during hydration
- [ ] Error recovery for corrupted storage

### Performance Requirements ✅
- [ ] Fast route transitions between tokens
- [ ] Memory-efficient (unused projects cleaned up)
- [ ] Minimal localStorage usage
- [ ] Quick hydration times

### Developer Experience ✅
- [ ] Type-safe throughout
- [ ] Simple API for components to use
- [ ] Clear error messages
- [ ] Well-documented code
- [ ] Easy to extend for new state properties

### Production Readiness ✅
- [ ] Error boundaries and fallbacks
- [ ] Storage quota handling
- [ ] Cross-browser compatibility
- [ ] Performance monitoring hooks
- [ ] Debugging utilities

## Optional Enhancements
- Compression for large projects (using `lz-string`)
- IndexedDB fallback for large datasets
- Storage usage monitoring
- Project export/import functionality
- Background cleanup tasks