 Two big findings — one good, one is a real break the plan undersells:

  ✅ Finding A (good): The plan's commit-state is fine. P5 is committed (f2176e1 "Meridian P5: archive… + fix /create refs") — product-meridian is 4 clean commits + 6
  uncommitted source files, which Step 1 captures. And that commit claims it fixed the /create refs (contradicting the plan's "known-open" note — likely stale).

  🔴 Finding B (real break, not "verify"): Meridian's resolveMeridianBlock is keyed by layout name ('terminalhero', lowercased), and index.ts passes blockType into the
  layoutName slot. But phase-11 dispatches resolveBlock(**sectionType**, mode). After the merge takes phase-11's section-type dispatch, the registry will hand Meridian
  'hero' → no match in a layout-name-keyed map → placeholder → Meridian renders nothing. The plan says "verify" — it actually needs a fix. Let me confirm exactly how main
  calls it and whether the /create refs really got fixed.

● Bash(echo "=== MAIN: how does componentRegistry call tmpl.resolveBlock? (first arg) ==="; grep -nE "resolveBlock\(" "C:/Users/susha/lessgo-ai/src/modules/generatedLa…)
  ⎿  === MAIN: how does componentRegistry call tmpl.resolveBlock? (first arg) ===
     C:/Users/susha/lessgo-ai/src/modules/generatedLanding/componentRegistry.ts:452:    return tmpl ? tmpl.resolveBlock(sectionType, 'edit') : null;
     C:/Users/susha/lessgo-ai/src/modules/generatedLanding/componentRegistry.published.ts:340:    return tmpl ? tmpl.resolveBlock(normalizedType, 'published') : null
     … +7 lines (ctrl+o to expand)
  ⎿  Shell cwd was reset to C:\Users\susha\lessgo-ai

● Both findings confirmed against the actual code:

  🔴 The one that will break Meridian — must be a FIX, not "verify"

  - main dispatches by section type: componentRegistry.ts:452 → tmpl.resolveBlock(sectionType, 'edit'); .published.ts:340 → resolveBlock(normalizedType, …). And main's
  Hearth resolver is now section-type-keyed (resolveServiceBlock.ts:53 key = sectionType.toLowerCase()).
  - Meridian is layout-name-keyed: MERIDIAN_BLOCK_REGISTRY keys are 'terminalhero', 'hairlinefeaturegrid', …; index.ts passes blockType into the layoutName slot.

  So post-merge the registry hands Meridian 'hero' → no match → MeridianPlaceholderBlock. Every Meridian section renders as a placeholder. Step 4's "verify Meridian's
  resolveBlock is keyed by section type" is wrong — it isn't. The plan must include the fix: re-key MERIDIAN_BLOCK_REGISTRY to section types and fix the index.ts adapter:

  header→MeridianNavHeader · hero→TerminalHero · features→HairlineFeatureGrid ·
  testimonials→ProofWithLogoRail · pricing→ThreeTierPricing · cta→ArcCTA · footer→HairlineFooter

  (Meridian is 1-block-per-section, so it's a clean re-key — mirror exactly what main's Hearth resolver did.) This is the make-or-break item.

  ✅ Otherwise the plan is sound

  - Commit state is correct. P5 is committed (f2176e1), product-meridian = 4 clean commits + 6 uncommitted source files that Step 1 captures. No archive loss.
  - Reconciliation (Step 4) matches my POreview — drop surfaceAttr, templateIds=['hearth','lex','meridian'], all-three defaultVariantForTemplate, keep usesTemplateModule
  (covers Lex via the service arm), generic data-surface, loosened validation.ts, hooks-fix carried into the merged renderer. Good.
  - Sequencing (commit both → FF service → hand-merge product) is right, and the verification gate (render Hearth + Lex + Meridian) is the correct backstop — note that
  the Meridian render in that gate is exactly what catches the dispatch break if the fix above is skipped.

  Two corrections to the plan's notes

  1. Stale: the "4 live /create refs known-open" is out of date — f2176e1 fixed them (I confirmed the three editor/onboarding refs are gone; InjectLandingTheme.tsx was
  relocated). Drop it from "known-open," but still run the service regression to confirm onboarding/service/layout.tsx:47 no longer 404s under the now-archived /create.
  2. Contract variants/defaultVariantId: Step 4 rightly says reconcile required-vs-optional so all three loaders compile — concretely, Meridian's loader must expose
  whatever phase-11 made required (e.g. a variants: TemplateVariant[] array for the theme picker). Meridian has meridianVariants in types/product.ts but may not export it
  in the contract shape Lex established. Check this at merge or the registry won't type-check.

  Verdict

  Approve the merge sequence + reconciliation — with one required addition: elevate the componentRegistry item to a concrete fix (re-key Meridian's resolver to section
  type). Without it, the build passes but Meridian renders all-placeholders. Everything else (drop surfaceAttr, loosened validation, hooks-fix, generic data-surface) is
  correct, and the 3-template render gate must be run green before calling the merge done.