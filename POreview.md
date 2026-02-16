. "detectedTheme computation was dead code — never called with userContext" — Misleadingly stated

  The plan says the detectedTheme computation in colorTokens.ts is dead code because "never called with userContext by any caller." This is functionally true (no caller      
  passes userContext), but the plan then says to "hardcode 'neutral' for businessContext.industry".

  The actual bug is more interesting: detectedTheme returns 'warm'|'cool'|'neutral', which gets passed as businessContext.industry. But INDUSTRY_COLOR_PREFERENCES in
  colorHarmony.ts has keys like finance, healthcare, technology — not warm/cool/neutral. So even if userContext WERE passed, the industry preference scoring would be skipped 
  because the key never matches. This is a pre-existing bug that makes the entire chain doubly dead.

  Plan's fix (hardcode 'neutral') is fine — it was already effectively 'neutral' since no caller provides userContext. But the plan should note that removing the userContext 
  param also kills the (already broken) industry→accent scoring path.

  2. "~86 UIBlock files" — actual count is 79 unique files

  Minor. Plan says ~86, actual is 79. Close enough for estimation but dev should grep to get the real list.

  3. Two different patterns in UIBlocks, not one

  Plan shows only the useMemo pattern. Actually:
  - ~14 files use React.useMemo(() => { ... }) pattern
  - ~65 files use direct assignment: const uiTheme: UIBlockTheme = props.manualThemeOverride || (props.userContext ? selectUIBlockTheme(props.userContext) : 'neutral');      

  Both need the same replacement, but a dev doing find-and-replace needs to know there are 2 patterns.

  4. "Check if EditablePageRenderer.tsx exists" — Plan shouldn't have unknowns

  This should have been verified before writing the plan. (It doesn't exist — LandingPageRenderer handles both edit and preview modes via isEditable prop, as we established  
  earlier.)

  Risk assessment:

  Medium risk due to volume — 79 files is a lot of mechanical changes. Each is trivial but the blast radius is wide. A single missed file = build error (which is good — TS   
  will catch it).

  The approach of relying on build errors to discover the full list (noted under "Unresolved") is actually the right strategy for 79 files.