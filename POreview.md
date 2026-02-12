
  Genuine gaps in the spec

  1. Button Settings is homeless. Currently when you click a CTA/button element → ElementToolbar appears → "Button Settings" (link URL, open in new tab, etc.). Spec kills      
  ElementToolbar and says "Text toolbar appears directly." But buttons have non-text properties. Where does button configuration go? Options:
  - Add a "link" icon to TextToolbar when selected element is a button
  - Show a lightweight ButtonToolbar instead of TextToolbar for button elements
  - Move Button Settings to the element toggle modal

  This needs a decision.

  2. Element Duplicate is killed without replacement. ElementToolbar currently has "Duplicate element." Spec's toggle modal handles add/remove via toggles, but duplicating an  
  element (e.g., a second CTA button) has no home. Is this intentional? If so, state it explicitly.

  3. Which modals exactly get killed? Spec names VariableBackgroundModal and ColorSystemModalMVP. But the codebase also has BackgroundSystemModal, ColorSystemModal (full), and 
  ResponsiveBackgroundModal. Are ALL five killed? The full ColorSystemModal has tier-based controls, semantic colors, expert token editing, WCAG accessibility preview — some of
   this is genuinely useful. Spec should enumerate all 5 and confirm fate.

  4. TextToolbar "Get Variations" already exists in the advanced menu (⋯). Spec adds ✨ as a prominent top-level button. Good — but spec should note this is a PROMOTION of an  
  existing feature, not a new feature. Dev shouldn't build new variations logic, just surface the existing one.

  5. FloatingToolbars orchestrator needs updating. Currently routes clicks through priority: Text → Image → Form → Element → Section. Removing ElementToolbar from flow means   
  updating the priority chain so text click goes directly to TextToolbar. Spec should mention FloatingToolbars.tsx as a modified file.