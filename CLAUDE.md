# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lessgo** is a Next.js 14 application for AI-powered copywriting focused landing page generation, editing, publishing and managing for SaaS founders. The app uses Clerk authentication, Prisma with PostgreSQL, and a dual state management architecture with both an onboarding store and legacy edit store.

## Development Commands

```bash
# Development server
npm run dev

# Build for production  
npm run build

# Start production server
npm start

# Linting
npm run lint

# Database operations (run automatically on install)
npm run postinstall  # Runs: prisma generate && prisma migrate deploy
```

## Architecture Overview

### Core Structure
- **Frontend**: Next.js 14 with App Router, TypeScript, TailwindCSS
- **Database**: PostgreSQL with Prisma ORM  
- **State Management**: Dual Zustand stores (useOnboardingStore + useEditStoreLegacy) with Immer
- **Authentication**: Clerk for user management
- **AI Integration**: OpenAI API for content generation
- **Analytics**: PostHog for tracking and feature flags
- **UI Libraries**: Radix UI, @dnd-kit for drag-and-drop, canvas-confetti

### Key Directories
- `src/app/` - Next.js app router pages and API routes
- `src/components/` - Reusable React components
- `src/hooks/` - Custom hooks including state management stores
- `src/modules/` - Business logic modules (Design, UIBlocks, generatedLanding, etc.)
- `src/types/` - Comprehensive TypeScript type definitions
- `src/providers/` - Context providers (PostHog, Token context)
- `src/stores/` - Alternative store locations
- `prisma/` - Database schema and migrations

### Database Schema
- **User**: Clerk-based user management
- **Project**: User projects with token-based access
- **Token**: Unique access tokens for projects
- **PublishedPage**: Published landing pages with slugs
- **TaxonomyEmbedding**: AI embeddings for content classification

### State Management Architecture

#### useOnboardingStore (`src/hooks/useOnboardingStore.ts`)
Manages the onboarding flow and field confirmation:
- **Field Management**: Confirmed fields, validated fields, hidden inferred fields
- **Type-safe Fields**: Uses canonical field names with display name mappings
- **Field Dependencies**: Handles cascading field updates (e.g., category → subcategory)
- **Features**: AI-generated features management
- **Force Manual**: Tracks fields requiring manual input

#### useEditStoreLegacy (`src/hooks/useEditStoreLegacy.ts`)
Legacy editor store still in active use:
- **Layout**: Page sections, layouts, themes, global settings
- **Content**: Section content data and elements  
- **UI**: Edit modes, selections, toolbars, auto-save state
- **Meta**: Project metadata, publishing state
- **Persistence**: Draft saving, loading, conflict resolution

#### useModalManager (`src/hooks/useModalManager.ts`)
Orchestrates modal states and field editing:
- **Modal Queue**: Sequential modal processing
- **Field Updates**: Integrates with onboarding store
- **Auto-save Triggers**: Coordinates with edit store

### Type System
Comprehensive type definitions in `src/types/core/index.ts` covering:
- Content types (sections, elements, themes)
- AI generation types  
- Forms and images systems
- UI state management
- API request/response types

### Key Features
1. **AI-Powered Generation**: Landing page creation from user input with field inference
2. **Visual Editor**: 
   3 prone architecture. Edit header, left panel and right panel
   - Inline text editing with contenteditable
   - Section toolbar
   - element toolbar
   - Text formatting toolbar (size, color, alignment, styles)
   - Image editing toolbar
   - Form builder with placement system
3. **Theme System**: 
   - Variable color system with migration support
   - Background archetype scoring
   - Typography management with font themes
   - Device-responsive preview
4. **Publishing**: 
   - Token-based project access
   - Published pages at `/p/[slug]`
   - Preview mode at `/preview/[token]`
5. **Auto-Save**: Automatic draft persistence with conflict resolution
6. **Blog System**: MDX-based blog with Giscus comments
7. **Analytics**: PostHog integration for tracking and feature flags

## Development Notes

### Working with the Editor

#### State Management Best Practices
- **Onboarding Flow**: Use `useOnboardingStore` for field confirmation and validation
- **Editor State**: Use `useEditStoreLegacy` for layout, content, and UI state
- **Modal Management**: Use `useModalManager` for field editing modals
- **Text Editing**: Inline editor uses contenteditable with toolbar integration
- **Sections**: Stored as arrays of IDs with separate content mapping
- **Theme Changes**: Trigger automatic background regeneration

#### UI Components
- **Text Toolbar**: Provides formatting options (size, color, alignment)
- **Element Toolbar**: Context-aware actions for selected elements
- **Section Toolbar**: Section-level operations
- **Form Toolbar**: Form configuration and management
- **Device Toggle**: Switch between desktop/tablet/mobile views

### Database Operations
- Use `prisma/schema.prisma` for schema changes
- Run `npx prisma migrate dev` for local development migrations
- Token-based project access pattern is core to the architecture

### API Routes
- Most API routes are in `src/app/api/` following Next.js 14 conventions
- **Generation**: `/generate-landing`, `/infer-fields`, `/validate-fields`
- **Content**: `/regenerate-content`, `/regenerate-element`
- **Persistence**: `/saveDraft`, `/loadDraft`
- **Publishing**: `/publish`, `/checkSlug`
- **Analytics**: `/market-insights`
- **Forms**: `/forms/submit`
- **Misc**: `/subscribe`, `/start`

### Component Patterns
- **UI Framework**: Radix UI components for accessibility
- **Styling**: TailwindCSS with custom design tokens
- **Drag & Drop**: @dnd-kit for sortable sections and elements
- **Components Organization**:
  - `/components/ui/` - Base UI components
  - `/components/forms/` - Form builder system
  - `/components/layout/` - Layout components
  - `/components/dashboard/` - Dashboard specific
  - `/modules/UIBlocks/` - Pre-built section templates
  - `/modules/Design/` - Design system utilities

### Additional Systems

#### Design System
- **Color System**: Variable-based with theme migration support
- **Backgrounds**: Archetype-based scoring for auto-selection
- **Typography**: Font themes with market category matching
- **Button Shapes**: Configurable rounded corners

#### Forms System
- **Form Builder**: Visual form creation interface
- **Form Placement**: Strategic positioning in sections
- **Form Connection**: Buttons can trigger form modals
- **Submission Handling**: API endpoint for form data

#### Publishing Flow
1. Edit at `/edit/[token]`
2. Preview at `/preview/[token]`
3. Publish to `/p/[slug]`
4. Form submissions tracked at `/dashboard/forms/[slug]`

### Testing & Quality
- No specific test runner configured - check with team for testing approach
- PostHog for analytics and feature flag testing
- Consider the complexity of dual state management when adding tests