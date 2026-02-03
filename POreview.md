 Questions/Gaps

  1. iconSearchIndex.ts - Missing from plan

  We said "verify before archive". What's the verdict? Does IconPicker depend on it?

  2. Step 6: ".published.tsx" files

  Priority list shows .published.tsx but "Other UIBlocks" list doesn't. Confirm all ~46 includes both editor AND published variants?

  3. Step 6: "~46 files" seems high

  UIBlocks list shows ~20 components. With .published.tsx = ~40. Where's the other 6? Just want accuracy.



  ---
  Suggested Addition

  Step 2.5: Remove dead imports

  After updating IconEditableText/IconPublished, grep for remaining iconStorage imports and remove them. Otherwise build will fail when archived.

  ---
  Verdict

  Approve with clarifications above.

  Fix the gaps, then execute.