✅ The publish path is still importing editor/client code

Your server-side publish renderer is still pulling in files that use React hooks (useState/useEffect/useRef/createContext) and browser-only code. Next.js treats the publish renderer as a Server Component, so the moment it imports any hook-using module, you get:

“needs useState… but none of its parents are marked with ‘use client’ (server by default)”

The smoking gun is here:

Your LandingPagePublishedRenderer.tsx is importing the normal registry:
import { getComponent, extractSectionType } from './componentRegistry';
That means it drags in the entire editable component graph (which includes hook-based stuff).

And the errors you see are exactly those hook-based modules:

EditableContent.tsx uses useState/useCallback/useMemo

HeaderLogo.tsx uses useState/useRef

LogoEditableComponent.tsx uses useState/useRef

useEditStoreLegacy.ts uses createContext

useLayoutComponent.ts uses useEffect

CTAWithFormField.tsx uses useState/useEffect and imports EditableContent

So yes: the publish renderer is still wired to the editable world.

What Claude should do next (very конкрет steps)
Step 1 — Fix the wrong registry import (this alone may drop most errors)

In:
src/modules/generatedLanding/LandingPagePublishedRenderer.tsx

Change:

import { getComponent, extractSectionType } from './componentRegistry';


To:

import { getComponent, extractSectionType } from './componentRegistry.published';


Because right now it’s still using the editable registry.

Step 2 — Ensure componentRegistry.published.ts imports ONLY server-safe components

This is the part props cannot solve:

Even if you pass different props, the import itself pulls in the module, and Next will statically analyze it.

So in componentRegistry.published.ts, make sure it does not import any of these:

EditableContent.tsx

HeaderLogo.tsx

LogoEditableComponent.tsx

CTAWithFormField.tsx (your current one imports hooks + EditableContent)

Any UIBlock that imports useLayoutComponent, useEditStoreLegacy, etc.

Instead it must import files like:

CTAWithFormField.published.tsx (new)

HeaderLogo.published.tsx (new) or just inline <img/>

etc.

Step 3 — Create “published-only” entry files for the remaining offenders (only where needed)

You do not need to duplicate every UIBlock. Only the ones that currently import hooks/editing stuff at module top-level.

For your remaining errors, the minimum “published” files are likely:

src/modules/UIBlocks/PrimaryCTA/CTAWithFormField.published.tsx
A pure component: no hooks, no edit store, no EditableContent imports.

Replace HeaderLogo usage in published components with either:

a simple <img src=... />, or

src/components/ui/HeaderLogo.published.tsx (no hooks)

Same for logo:

LogoEditableComponent should never be imported in publish path; use a Logo.published.tsx or plain <img>.

Important: don’t “branch inside the same file” (like if (published) return <Published/>) if the file still imports hooks at the top — because the server build fails before runtime.