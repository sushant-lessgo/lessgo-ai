All implementation complete and the build is green. Let me mark the final task done.

● Phase 11b implemented. Build passes clean (exit 0), my files are lint-clean, firewall verified (zero static template imports in gated dirs).

  What shipped

  W1 — Variant infrastructure
  - TemplateModule contract gained variants + defaultVariantId; injectors/SSRTokens now take variantId.
  - serializeVariantOverrides() in both hearth/tokens.ts and lex/tokens.ts — emits [data-variant="x"] blocks (on the wrapper div, not html[...], per gap #8), appended
  after palette overrides so they win on the cascade.
  - Lex variant fonts lazy-load via lex/fonts.ts (Lora for clinical, EB Garamond for civic); Hearth needs none.
  - variantId threaded through edit renderer, published renderer, and /p/[slug] (added variantId to the page select + props).

  W2 — Gap-#10 palette scoping (done first)
  - palettesForTemplate() + templateLabels/templateBlurbs in types/service.ts.
  - Strategy route paletteId relaxed z.enum(hearthPalettes) → bounded slug (route can't see templateId — firewall — so the picker + saveDraft enforce pairing).

  W3 — Onboarding picker
  - Store must-fix: widened setPaletteId to string, added setTemplateId/setVariantId (template switch resets both ids).
  - StyleStep now has template cards (Hearth + Lex) + variant picker + template-scoped palettes via a new onboarding-local templateCatalog.ts. PaletteSwatch made
  template-agnostic.

  W4 — Editor picker
  - New ServiceThemePopover (service-only, mirrors the LayoutSelector hiding pattern), reads the active template via getLoadedTemplate and swatch colors via the injected
  [data-palette]{--accent} vars — no static template import. Confirm-before-switch; preloads the target then resets both ids to its defaults; persists via existing
  autosave (updateMeta + triggerAutoSave).

  W5 — PostHog: template_changed/variant_changed + register() super-props.

  One divergence to flag for QA (logged in phase11aArchitectureGaps.md #11)

  The designer HTML variant blocks retune layout via class selectors (.hero h1, drop-caps, civic watermark) that don't exist in our React DOM — so only the CSS-variable
  overrides port (font/paper/spacing/radii). That's the "pure token rescale" scope, but variants read subtler than the HTML demo. If QA finds a variant too weak, blocks
  need to expose those knobs as vars (post-launch, block-level work).

  Not yet verified (needs a running app — your call)

  The plan's runtime checks: onboarding E2E for Lex, editor switch live re-render, variant=zero-copy diff, publish round-trip. I can drive these with the /run or /verify
  skill if you want, or you can spot-check with ?templateId=lex on a dev project.

  Unresolved: none blocking — the deferred section/text toolbars (Q1→A) and thumbnail gallery (Q3→A) are intentionally out of this phase.