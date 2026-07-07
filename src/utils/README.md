# `src/utils/` — Utilities (grouped)

Standalone helpers used across editor, renderers, and generation. Grouped by area;
not exhaustive.

> **Color / contrast / brand system:** see
> [`README-COLOR-SYSTEM.md`](./README-COLOR-SYSTEM.md). Related files:
> `colorUtils.ts`, `colorHarmony.ts`, `contrastValidator.ts`,
> `textContrastUtils.ts`, `improvedTextColors.ts`, `brandColorSystem.ts`,
> `backgroundAnalysis.ts`, `backgroundUtils.ts`.

## Editor selection & toolbars
`selectionPriority.ts`, `selectionSnapshot.ts`, `selectionStability.ts`,
`domNodeSelectionManager.ts`, `singletonAnchorRegistry.ts`, `sectionAnchors.ts`,
`toolbarPositioning.ts`, `toolbarSingleton.ts`, `toolbarWatchdog.ts`,
`modalEmergencyReset.ts`, `bodyScrollLock.ts`, `tabManager.ts`.

## Editor lifecycle / state
`editorActivityState.ts`, `readinessDetection.ts`, `hydrationDetection.ts`,
`strictModeSafeListeners.ts`, `trackEdit.ts`, `unifiedModeSelector.ts`,
`versionManager.ts`.

## Persistence & storage
`storage.ts` (per-token storage keys, project access tracking),
`storageManager.ts` (maintenance/quota cleanup), `statePersistence.ts`,
`autoSaveDraft.ts`.

## Content / text / formatting
`contentSerialization.ts`, `textFormatting.ts`, `formatUtils.ts`,
`formatRegistry.ts`, `htmlSanitization.ts`, `dataParsingUtils.ts`,
`smartTitleGenerator.ts`, `typeGuards.ts`.

## Sections & layout
`sectionValidation.ts`, `sectionHelpers.ts`, `sectionScanner.ts`,
`layoutMigration.ts`, `layoutSectionTypeMapping.ts`, `dynamicCardLayout.ts`,
`elementRestrictions.ts`.

## Forms & CTAs
`formPlacement.ts`, `emailFormDetector.ts`, `ctaHandler.ts`,
`resolveCtaHref.ts`, `pageLinks.ts`.

## Taxonomy & fields
`taxonomyMappingUtils.ts`, `taxonomyDisplayUtils.ts`, `getOptionsForField.ts`.

## CSS variables & performance
`cssVariableValidation.ts`, `cssVariablePerformance.ts`, `bulletproofSuppression.ts`.

## Routing / URLs
`urlHelpers.ts`, `reservedPaths.ts` (+ `reservedPaths.test.ts`).

## Misc / infra
`featureFlags.ts`, `tailwind-seed.js`, `test-restrictions.js`.
