# Shared Components (`src/components/`)

App-wide React components. Editor-only components live under the route dir
(`src/app/edit/[token]/components/`), **not** here — this tree is for cross-route and
published/dashboard/marketing UI.

## Subdirectories

| Dir | Purpose |
|-----|---------|
| `ui/` | Base UI primitives (Radix-backed): `button`, `card`, `dialog`, `dropdown-menu`, `checkbox`, `badge`, `tooltip`, plus app widgets (`HeaderLogo`, `AvatarEditableComponent`, `ColorPicker/`). |
| `forms/` | Native form builder + renderer (see `forms/README.md`). |
| `layout/` | Cross-route layout/edit glue: `GlobalButtonConfigModal`, `GlobalFormBuilder`, `SmartTextSection`. |
| `dashboard/` | Dashboard UI. **App shell:** `AppSidebar`, `DashboardTopBar`. **Projects grid:** `ProjectGridCard`, `ProjectCardMenu`, `ProjectFilters` (⚠️ file name ≠ default export — it exports the stateful board `ProjectsBoard` *and* the controlled `ProjectFilters` row), `DashboardEmptyState`, `NewSiteButton`. **Per-site workspace** (`/dashboard/[token]/*`): `WorkspaceHeader`, `WorkspaceTabs`. **Shared:** `continueRouting.ts` (⚠️ load-bearing state-aware "open project" router — 4 branches + 2 fallbacks; the SINGLE `project_edit_clicked` PostHog call site, never hard-code `/edit/{token}` at a call site), `FormSubmissionsTable`, `PersonaUpdatedBanner`, `testimonials/`. |
| `published/` | **Published-renderer** server-safe components (no hooks): `*Published.tsx` (CTA, Image, Icon, Avatar…), `FormIsland`, `FormMarkupPublished`. Keep in lockstep with their editor twins (dual-renderer pitfall). |
| `onboarding/` | `PersonaPrompt` (settings-only persona editor — used by `/dashboard/settings`; no longer an onboarding gate since scale-02) + `shared/` onboarding UI. |
| `domain/` | Custom-domain wizard steps: `AddDomainForm`, `OwnershipStep`, `DnsStep`, `DnsRecordRow`, `LiveStep`, `FailedStep`. |
| `billing/` | `CreditBadge`, `OutOfCreditsModal`. |
| `admin/` | `TransferOwnershipControl`. |
| `editor/` | Standalone editors reused outside the main edit route: `PrivacyPolicyEditor`, `PrivacyPolicyLink`. |
| `toolbars/` | `ButtonConfigurationModal` (button-config toolbar shared with forms). |
| `navigation/` | `NavigationEditor`, `NavItemToolbar`. |
| `social/` | `SocialMediaEditor`. |
| `theme/` | `ThemeCustomizer`, `predefinedThemes.ts`. |
| `shared/` | Generic building blocks: `Header`, `Footer`, `Logo`, `PageIntro`, `LoadingButtonBar`. |
| `t/` | `CollectFormClient` — public testimonial collect form (`/t/[collectToken]`). |
| `mdx/` | `MDXComponents` for the marketing blog. |
| `debug/` | Dev overlays: `ModalDebugPanel`. |

## Top-level files

`EditProvider.tsx` (token-scoped store provider for the editor), `EditErrorBoundary.tsx`,
`CSSVariableErrorBoundary.tsx`, `CustomDomainModal.tsx`, `SlugModal.tsx` (publish flow on
`/preview/[token]`), `CSRFInitializer.tsx`, `StableAnchorProvider.tsx`,
`StorageMonitor.tsx`, `GiscusComments.tsx`, `DebugPanel.tsx`.

## Notes

- **Dual-renderer rule:** any block/component with a published twin must stay
  layout/CSS-identical to its editor version (see repo `CLAUDE.md`). Never import from a
  `'use client'` module into a `published/` component.
