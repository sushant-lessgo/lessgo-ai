# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lessgo** is a Next.js 14 application for AI-powered copywriting focused landing page generation, editing, publishing and managing for SaaS founders. The app uses a token-based authentication system, Prisma with PostgreSQL, and a complex state management architecture.

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
- **State Management**: Zustand with Immer for complex editor state
- **Authentication**: Clerk for user management
- **AI Integration**: OpenAI API for content generation

### Key Directories
- `src/app/` - Next.js app router pages and API routes
- `src/components/` - Reusable React components
- `src/hooks/` - Custom hooks, especially `useEditStore.ts` (main state management) and 'useOnboardingStore.ts
- `src/modules/` - Business logic modules (Design, UIBlocks, generatedLanding, etc.)
- `src/types/` - Comprehensive TypeScript type definitions
- `prisma/` - Database schema and migrations

### Database Schema
- **User**: Clerk-based user management
- **Project**: User projects with token-based access
- **Token**: Unique access tokens for projects
- **PublishedPage**: Published landing pages with slugs
- **TaxonomyEmbedding**: AI embeddings for content classification

### State Management (useEditStore)
The app uses a complex Zustand store (`src/hooks/useEditStore.ts`) with multiple slices:
- **Layout**: Page sections, layouts, themes, global settings
- **Content**: Section content data and elements  
- **UI**: Edit modes, selections, toolbars, auto-save state
- **Meta**: Project metadata, onboarding data, publishing state
- **Persistence**: Draft saving, loading, conflict resolution

### Type System
Comprehensive type definitions in `src/types/core/index.ts` covering:
- Content types (sections, elements, themes)
- AI generation types  
- Forms and images systems
- UI state management
- API request/response types

### Key Features
1. **AI-Powered Generation**: Landing page creation from user input
2. **Visual Editor**: Drag-drop interface with real-time editing
3. **Theme System**: Color, typography, and background customization
4. **Token-Based Sharing**: Projects accessible via unique tokens
5. **Auto-Save**: Automatic draft persistence with conflict resolution

## Development Notes

### Working with the Editor
- Main editor state is in `useEditStore` - always check this for current selection/mode
- Sections are stored as arrays of IDs with separate content mapping
- Theme changes trigger background regeneration automatically
- All UI actions should update the store state appropriately

### Database Operations
- Use `prisma/schema.prisma` for schema changes
- Run `npx prisma migrate dev` for local development migrations
- Token-based project access pattern is core to the architecture

### API Routes
- Most API routes are in `src/app/api/` following Next.js 14 conventions
- Key endpoints: `/generate-landing`, `/saveDraft`, `/loadDraft`, `/publish`
- OpenAI integration for content generation and field inference

### Component Patterns
- Extensive use of Radix UI components for accessibility
- TailwindCSS for styling with custom design system
- Components are organized by feature area (dashboard, generatedLanding, etc.)

### Testing
- No specific test runner configured - check with team for testing approach
- Consider the complexity of the state management when adding tests