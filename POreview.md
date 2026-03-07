  PO Review: ticklish-swinging-clock.md                                                                                                                                                                           
  Verdict: Mostly sound, 4 issues to resolve before execution.                                                                                                                                                    
  ---                                                                                                    
  Issue 1: activeTab union mismatch (BLOCKER)

  The plan says add 'review' to leftPanel.activeTab in state.ts and flattenedState.ts. But these files   
  have different unions:

  - state.ts:205: 'addSections' | 'pageStructure' | 'inputVariables' | 'aiControls' | 'guidance' |       
  'insights'
  - flattenedState.ts:93: 'pageStructure' | 'styles' | 'settings'

  Plan treats them as "same union update" — they're not. Dev needs to know which union is authoritative, 
  and whether flattenedState.ts even governs the left panel activeTab that LeftPanel.tsx reads. The      
  setLeftPanelTab action in uiActions.ts:272 uses UISlice['leftPanel']['activeTab'] from state.ts, so    
  that's the real one. The flattenedState.ts union looks stale/divergent — adding 'review' there without 
  reconciling could cause type errors elsewhere.

  Question: Is flattenedState.ts:93 actually consumed anywhere, or is it dead?

  ---
  Issue 2: stock_image status not mapped in SelectionSystem (plan claim is wrong)

  Plan step 5 says: "Map stock_image status → .element-manual-preferred class"

  But looking at SelectionSystem.tsx:88-94, the current code only maps needs_review and manual_preferred.
   stock_image is already silently dropped — no class gets added for it. The plan correctly identifies   
  this gap but the fix description is vague. The dev needs to know: add an else if (status ===
  'stock_image') branch mapping to which class? The plan says .element-manual-preferred but should       
  confirm this is intentional (same amber styling for both medium severities).

  ---
  Issue 3: getElementReviewStatus behavior change is underspecified

  Plan says: "getElementReviewStatus() stays — returns status regardless of confirmed state (badges      
  always visible)"

  But current implementation at useReviewState.ts:237-243 searches reviewItems — and markReviewed filters
   items out of reviewItems (line 225-227). So currently, once reviewed, getElementReviewStatus returns  
  null.

  The plan wants badges to persist after confirmation, but the rewrite must store ALL items (not just    
  unconfirmed) and have getElementReviewStatus search the full list. The plan doesn't explicitly say this
   — a dev could miss it and break badge persistence.

  Needs explicit instruction: "Store all items in a separate allItems array (or don't filter
  reviewItems). getElementReviewStatus searches all items regardless of confirmed state."

  ---
  Issue 4: No setLeftPanelTab call exists on LeftPanel — plan assumes it does

  LeftPanel.tsx currently reads leftPanel state but never calls setLeftPanelTab. The plan says ReviewPill
   will call setLeftPanelTab('review'), which is fine — that action exists in uiActions.ts:272. But      
  LeftPanel itself doesn't import or use this action. The plan's step 7 needs to also import
  setLeftPanelTab (or access it via store) to implement the back arrow that sets tab to 'pageStructure'. 

  ---
  What's correct

  - Auto-clear deletion in EditProvider.tsx — lines 202-237 confirmed, safe to remove
  - initFromContent call at lines 177-186 — confirmed, keep it
  - ReviewPill rewrite approach — current pill is simple cycling, rewrite to progress fraction makes     
  sense
  - LeftPanel conditional rendering approach — clean, no structural issues
  - Severity classification (high=ai_generated_needs_review, medium=manual_preferred+stock_image) —      
  sensible
  - Execution order — correct dependency chain
  - CSS badge changes — straightforward

  ---
  Unresolved questions from plan + my additions

  1. Is flattenedState.ts:93 activeTab union actually consumed, or dead?
  2. Should stock_image get .element-manual-preferred class (same amber) or its own class?
  3. Should getElementReviewStatus search a separate allItems array, or should reviewItems stop being    
  filtered on confirm?
  4. Persist confirmed state across reloads — do we want this for v1?
  5. Reset on regen — should confirming be blocked during regen, or just silently reset after?