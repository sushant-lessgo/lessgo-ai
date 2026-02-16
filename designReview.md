The Core Problem

  User lands in the editor after generation and thinks "now what?" There's no guided path from "AI made me a page" → "I'm confident enough to publish."

  ---
  Recommended: Editor Checklist Sidebar / Drawer

  A persistent, collapsible checklist that lives in the editor (either in the left panel or as a floating drawer). It tracks progress toward a publishable page.

  The Checklist (ordered by priority)

  ┌─────┬─────────────────────────────┬─────────────┬──────────────────────────────────────────────────────────┐
  │  #  │            Task             │    Type     │                           Why                            │
  ├─────┼─────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────┤
  │ 1   │ Review & edit hero headline │ Required    │ First impression, AI copy rarely nails it                │
  ├─────┼─────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────┤
  │ 2   │ Configure primary CTA       │ Required    │ Publish is literally blocked without this                │
  ├─────┼─────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────┤
  │ 3   │ Upload logo                 │ Recommended │ Brand credibility signal                                 │
  ├─────┼─────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────┤
  │ 4   │ Review AI-inferred fields   │ Recommended │ Bad inputs = bad copy everywhere                         │
  ├─────┼─────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────┤
  │ 5   │ Replace placeholder images  │ Recommended │ Stock photos kill trust                                  │
  ├─────┼─────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────┤
  │ 6   │ Review all section copy     │ Recommended │ Scan for hallucinations/off-brand tone                   │
  ├─────┼─────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────┤
  │ 7   │ Pick your theme             │ Optional    │ Default is fine, but personalization increases ownership │
  ├─────┼─────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────┤
  │ 8   │ Preview on mobile           │ Optional    │ Catches layout issues                                    │
  ├─────┼─────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────┤
  │ 9   │ Preview & Publish           │ Final       │ The finish line                                          │
  └─────┴─────────────────────────────┴─────────────┴──────────────────────────────────────────────────────────┘

  How Each Item Works

  1. Review hero headline — User clicks → auto-scrolls to hero, highlights the headline element. Marked complete when user has clicked into the text at least once (even if   
  they keep it).

  2. Configure CTA — Click → opens button config modal for the primary CTA. Shows "Link URL" vs "Open Form" choice. Marked complete when a URL or form is connected. This is  
  the big one — right now users discover the publish block only at the end. Surface it early.

  3. Upload logo — Click → scrolls to header/nav, opens image replace flow. Marked complete on upload.

  4. Review AI fields — Click → expands "Your Inputs" accordion in left panel, highlights the override-able fields. Each field gets a mini "confirm" checkmark. Marked        
  complete when user has viewed/confirmed all fields (or clicked "looks good").

  5. Replace images — Shows count: "3 of 7 images replaced." Click → cycles through image elements one by one with the image toolbar open. Not blocking, but shows progress.  

  6. Review copy — Section-by-section mini progress. Click → scrolls to next unreviewed section. User can mark each section as "reviewed" (checkmark on section toolbar).     
  Think of it as a proofreading pass.

  7. Theme — Click → opens ThemePopover. Marked complete on any theme change OR explicit "keep default."

  8. Mobile preview — Click → toggles device to mobile. Marked complete after 5 seconds in mobile view.

  9. Preview & Publish — Only unlockable when #1 and #2 are complete. Click → opens preview page.

  ---
  UX Patterns

  Checklist Placement

  Option A: Left panel tab — Add a "Checklist" tab next to the existing section outline. Pro: always visible. Con: competes with outline.

  Option B: Floating pill/drawer — Small floating badge at bottom-right showing "3/9 complete" that expands into a drawer. Pro: non-intrusive, always accessible. Con: might  
  get ignored.

  I'd recommend Option A — it's discoverable and the left panel already has "Your Inputs" which is related context. Add a tab switcher: Sections | Checklist.

  Progress Indicator

  - Show completion as a progress ring in the header: ●●●○○○○○○ 3/9
  - Color coding: green (done), yellow (recommended), gray (optional)
  - Celebrate completion with confetti (you already have canvas-confetti)

  First-Time Experience

  When user first enters editor after generation:
  1. Left panel auto-opens to Checklist tab (not sections)
  2. Brief toast or banner: "Your page is ready! Complete these steps to publish."
  3. Item #1 (hero headline) is pre-highlighted as "Start here"
  4. No modal, no blocking overlay — just gentle guidance

  Smart Detection (Auto-Complete Items)

  - If user uploaded logo during onboarding (assetAvailability) → #3 pre-checked
  - If user already edited hero text during generation review → #1 pre-checked
  - If CTA was configured with a URL during generation → #2 pre-checked
  - Theme change detected → #7 pre-checked

  "I Know What I'm Doing" Escape Hatch

  - "Skip checklist" link at the bottom → hides it permanently for this project
  - Individual items can be dismissed: "Not needed" button
  - Power users shouldn't feel patronized

  ---
  What NOT to Do

  - Don't block the editor — No forced linear flow. User should be able to do things in any order.
  - Don't use modals for the checklist — It's ambient guidance, not a wizard.
  - Don't make all items required — Only CTA config is truly required (publish validation). Everything else is "strongly recommended" or "nice to have."
  - Don't show tooltips on every element — Overwhelming. The checklist gives structure; the user explores from there.
  - Don't persist checklist after publish — Once published, switch to a "post-publish" view (share links, analytics, form submissions).

  ---
  Post-Publish Guidance (Bonus)

  After first publish, replace checklist with:
  1. Share your page — Copy link, social share buttons
  2. Set up form notifications — If using form CTA
  3. Check analytics — Link to dashboard analytics
  4. Iterate — "Edit & republish" flow

  ---
  Unresolved Questions

  - Checklist per-project or global first-time only?
  - Store checklist state in editStore or separate?
  - Should "Review copy" be per-section granular or one big checkbox?
  - Want the floating progress ring in header, or too cluttered?
  - Should incomplete required items show warning on "Preview" click (before they hit publish)?