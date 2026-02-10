 The Insight: Show Previews During Generation
                                                                                                                                                                                 Your AI generation takes 10-20 seconds. Right now that's a loading spinner. Dead time.                                                                                       

  Instead: show the 4 palette previews while AI generates copy. User browses, picks one. By the time they decide, content is ready. Apply their chosen palette. Reveal the     
  page.

  Current flow:
    Onboarding → [spinner 15s] → Page

  New flow:
    Onboarding → [4 palette previews] → User picks → Page
                      ↑                        ↑
                instant (client-side)     AI finishes in background

  You've turned dead wait time into a meaningful decision. Generation feels faster even though it takes the same time.

  ---
  Dummy vs Real

  Dummy previews (generic template). 100%.

  - Show a fixed skeleton: hero section + one content section + CTA button. Same placeholder text for all 4. Only colors/backgrounds change.
  - Renders instantly — it's just 4 CSS variations of a static component.
  - User judges the vibe, not the content. That's exactly what you want at this stage.
  - No dependency on AI completion.

  Real previews (with generated content) would mean waiting for AI then showing options. Defeats the purpose. The whole point is filling the wait.

  ---
  What the 4 Should Be

  Not random 4. Not top 4 by score (could be too similar). Diverse top picks.

  The funnel scores all 30 palettes. Then pick 4 that maximize both score AND variety:

  function pickFourPreviews(scored: ScoredPalette[]): Palette[] {
    // Sort by score
    const ranked = scored.sort((a, b) => b.score - a.score);

    const picks: Palette[] = [ranked[0].palette]; // #1 always included
    const usedModes = new Set([ranked[0].palette.mode]);
    const usedTemps = new Set([ranked[0].palette.temperature]);

    // Fill remaining 3 slots, preferring diversity
    for (const candidate of ranked.slice(1)) {
      if (picks.length >= 4) break;

      const p = candidate.palette;
      const isNewMode = !usedModes.has(p.mode);
      const isNewTemp = !usedTemps.has(p.temperature);

      // Prioritize different mode/temp combos
      if (isNewMode || isNewTemp) {
        picks.push(p);
        usedModes.add(p.mode);
        usedTemps.add(p.temperature);
      }
    }

    // If still < 4, fill with next best scores
    for (const candidate of ranked) {
      if (picks.length >= 4) break;
      if (!picks.includes(candidate.palette)) {
        picks.push(candidate.palette);
      }
    }

    return picks;
  }

  For a dev tools AI product, user might see:
  ┌─────────────┬────────────────┬────────────────┬───────────────┐
  │  Preview 1  │   Preview 2    │   Preview 3    │   Preview 4   │
  ├─────────────┼────────────────┼────────────────┼───────────────┤
  │ Deep Indigo │ Midnight Slate │ Ice Blue       │ Soft Lavender │
  ├─────────────┼────────────────┼────────────────┼───────────────┤
  │ dark + cool │ dark + neutral │ light + cool   │ light + cool  │
  ├─────────────┼────────────────┼────────────────┼───────────────┤
  │ AI/ML feel  │ serious infra  │ safe SaaS blue │ creative AI   │
  └─────────────┴────────────────┴────────────────┴───────────────┘
  All 4 are good for this product. But visually distinct enough that the choice is meaningful.

  ---
  The Preview Component

  Dead simple. One reusable component, 4 instances with different CSS vars:

  ┌──────────────────────┐
  │  ██████████████████  │  ← primary bg
  │  Headline Here       │
  │  Subtitle text       │
  │  [CTA Button]        │  ← accent color
  │                      │
  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← secondary bg
  │  ■ Feature  ■ Feature│  ← card surface
  │  ■ Feature  ■ Feature│
  │                      │
  │  ░░░░░░░░░░░░░░░░░░  │  ← neutral bg
  │  [CTA Button]        │
  └──────────────────────┘
     "Deep Indigo"           ← label

  Same layout, same placeholder text, just different --bg-primary, --bg-secondary, --bg-neutral, --accent CSS vars. Renders in milliseconds.

  ---
  What This Eliminates

  - ~~AI visual direction in prompt~~ — not needed, user picks directly
  - ~~Complex scoring for #1 pick~~ — just need top ~8-10, diversity filter picks 4
  - ~~Regenerate anxiety~~ — user already saw alternatives and chose
  - ~~Post-generation palette regret~~ — they picked it, they own it
  - ~~"Why did it pick this?" debugging~~ — it didn't, user did

  ---
  What This Simplifies the Architecture To

  Onboarding signals
    → Funnel scores 30 palettes (fast, algorithmic)
    → Diversity filter picks top 4
    → Show 4 dummy previews
    → User clicks one
    → Goal-based accent selection (automatic)
    → Mode-based texture default (automatic)
    → Done

  AI is fully removed from the palette decision. Funnel is simpler because it just needs "top ~8 good ones" not "the single best one." User handles the final call. Everyone   
  wins.

  ---
  One Edge to Handle

  What if the user doesn't pick and generation finishes first?

  Two options:
  - Auto-select #1 (the top-scored) and show the page. User can change later in editor.
  - Keep showing the previews, just with a "Your page is ready! Pick a style to see it" nudge.

  I'd go with the second. The pick is valuable. Don't skip it.

  ---
  Questions:
  - Show accent color in the preview (CTA button color), or just the 3 backgrounds? I'd show it — the CTA button color is often what users react to most.
  - Allow "none of these, show me more"? Or 4 is final? I'd say 4 is final for v1. Editor has all 30 if they really want to browse.
  - Mobile onboarding — 4 side-by-side won't fit. 2×2 grid? Horizontal scroll?