Short version: your first click is being eaten by a section-selection + full re-render that fires right after you click into the editable “Enterprise” field.

Evidence from the logs:

* You click the editable Tier Name and the PricingCard container logs `MouseDown/Focus/Click` on that `DIV` (contentEditable=true). Immediately after, the editor reports a section transition lock “section selected: pricing-…”, mounts/unmounts the SectionToolbar, and then runs `extractLayoutContent` across other sections (header/footer), i.e., a page-wide regeneration. That unmount/remount cycle steals focus, so the initial click feels “lost.”  &#x20;

Why this happens in this component:

* In `ToggleableMonthlyYearly`, the PricingCard **container** has `onMouseDown`, `onClick`, `onFocusCapture`, and `onBlurCapture` at the card level. Your contentEditable Tier Name sits inside this, so the click bubbles up and participates in the section selection machinery in the parent `LayoutSection`, triggering that regeneration. The handlers are visible on the card container; the Tier Name itself is a raw `div[contentEditable]`. &#x20;
* In contrast, `TierCards` relies on a lightweight wrapper and simple `onBlur` updates on the inline contentEditable without extra container-level capture handlers, so the first click isn’t disrupted by a section-level transition.&#x20;

So the issue isn’t your typing; it’s that the **first click into “Enterprise” triggers a section select + full content regeneration**, which re-renders the pricing card and drops focus before you can edit. The repeating “LeftPanel Store Methods Available” and the long `extractLayoutContent` burst right after each click confirm the full re-render that swallows your initial click. &#x20;
=================

Updatd opinion

Short answer: **No — the “fix” isn’t in effect, and the issue still reproduces.**

Why I’m sure:

* Your updated logs still show the **PricingCard container** receiving the click after you click a contentEditable field: e.g., `🎯 PricingCard Container - Click … eventPhase: 3, bubbles: true`, followed immediately by the LeftPanel store method dump and a full `extractLayoutContent` pass — the exact re-render sequence that steals focus. &#x20;

* The container also logs **FocusCapture** during that first interaction (`🔍 PricingCard Container - FocusCapture …`), which means the section-selection machinery is still being triggered on the initial click path.&#x20;

* In the actual component code, the contentEditable handlers in **toggleableMonthlyYearly.tsx** (Tier Name, Description, Monthly/Yearly Price, Features, CTA text) **do not call** `e.stopPropagation()` in `onMouseDown` (or `onClick`) — they only `logger.debug(...)`. So the click continues to bubble to the card container.    &#x20;

* By contrast, the only place I see `e.stopPropagation()` is on the **“remove tier”** button inside the card (which is unrelated to the inline text fields) — confirming the “fix” wasn’t applied where the problem occurs.&#x20;

* Also, the container still has `onClick` and `onFocusCapture` at the card level, and your logs prove they’re firing on first click — meaning the re-render-triggering path is still active. &#x20;

Net: the behavior in the logs contradicts the fix summary. The click is still bubbling to the card container and kicking off the section selection + full regeneration; so the focus loss persists.

Solution proposed:

Here’s how I’d fix it—surgically, with minimal churn.

### 1) Gate the **container** handlers (root cause)

Your card container still runs `onFocusCapture` and `onClick` when you click inside a contentEditable, which kicks off section-selection → full `extractLayoutContent` → remount → focus loss. The logs prove the container is still seeing those events coming from the editable DIVs, e.g. “PricingCard Container – FocusCapture/Click … isContentEditable: true” right before the regeneration burst.  &#x20;

In `toggleableMonthlyYearly.tsx`, add a guard in the **container** handlers to **return early** when the event originates from an editable field:

```tsx
const isFromEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (
    el.closest('[contenteditable="true"]') ||
    el.closest('[data-editable="true"]')
  );

<div
  /* ...existing props... */
  onFocusCapture={(e) => {
    if (isFromEditable(e.target)) return; // ❗ don't trigger section selection
    // existing selection logic (if any)…
  }}
  onMouseDown={(e) => {
    if (isFromEditable(e.target)) return; // ❗ shield the container
    // existing logic…
  }}
  onClick={(e) => {
    if (isFromEditable(e.target)) return; // ❗ shield the container
    // existing logic…
  }}
>
```

Why this is the linchpin: `onFocusCapture` runs **before** child focus handlers (capturing phase), so stopping propagation on the child won’t help; the parent must simply **not act** when the target is inside editable content. Your current code logs these container callbacks but doesn’t gate them. &#x20;

### 2) Mark editables explicitly and stop early

On each inline editable in `toggleableMonthlyYearly.tsx`, add a marker attribute and keep local stopPropagation (helps with `onClick`/`onMouseDown` paths, but the parent guard above is the real fix):

```tsx
<div
  contentEditable
  data-editable="true"
  suppressContentEditableWarning
  onMouseDown={(e) => { e.stopPropagation(); /* ... */ }}
  onClick={(e) => { e.stopPropagation(); /* ... */ }}
  /* existing focus/blur handlers */
>
  {tier.name}
</div>
```

Right now your editables only **log** the events; they don’t stop them, and the container continues to see them.&#x20;

### 3) Don’t use focus to drive section selection

If your section selection currently ties to focus, move that to pointer/click **but keep the same guard** as above. Focus events happen as part of editing; using them for “select section” is why this keeps firing as you enter fields. Your logs show the selection/regeneration cascade immediately after focus/click on the card. &#x20;

### 4) Optional hardening (nice-to-haves)

* Memoize the pricing card (`React.memo`) so unrelated LeftPanel state changes don’t remount the card while typing. The repeated LeftPanel method dumps + `extractLayoutContent` suggest wide updates that can still jostle focus.&#x20;
* Add an `isEditingInline` flag (set on editable focus, clear on blur) and have any “regenerate/section-select” code **early-return** while `isEditingInline` is true.

---

Why this will work in your codebase:

* The problem path is **container FocusCapture/Click → store method dump → extractLayoutContent → remount** (confirmed multiple times). Gating the container on editable targets prevents that path from running during inline edits. &#x20;
* `TierCards.tsx` doesn’t attach these container-level capture/click handlers around the contentEditables and therefore doesn’t lose focus — a good reference for the desired behavior. &#x20;

That’s the plan I’d implement.

====

updated

Short answer: **still not fixed.** Your card-level guard is working, but the **re-render is now being triggered upstream before your container even gets a chance to block it.**

What the logs show:

* You click the contentEditable:
  `🖱️ Tier Name - MouseDown` → `🛡️ PricingCard Container - FocusCapture BLOCKED (from editable)` → `🎯 Tier Name - Focus` → `👆 Tier Name - Click`. So the **container** correctly recognizes the editable target and blocks its own FocusCapture path.&#x20;

* **Immediately after that**, the global editor pipeline kicks off anyway: repeated `🔍 LeftPanel Store Methods Available …` followed by a full **`extractLayoutContent`** sweep across multiple layouts (MinimalNavHeader, centerStacked, CollapsedCards, ThreeStepHorizontal, StackedStats, LogoGrid, SecurityChecklist, ToggleableMonthlyYearly, IconWithAnswers, etc.). That’s the same heavy regeneration that steals focus.&#x20;

What that means:

* The re-render isn’t coming from the **PricingCard container** anymore; it’s coming from a **higher ancestor (LayoutSection / Editor root) or a non-React global listener** running in the **capture phase** (or via a focus/selection side effect). Because capture is **top-down**, that ancestor fires **before** your container’s FocusCapture “BLOCKED,” so by the time the container logs “BLOCKED,” the ancestor has already triggered the store/regeneration path. The immediate store dump + `extractLayoutContent` right after the editable’s click/focus is your proof.&#x20;

Net: your change **blocks the container**, but the **earliest capture listener that does section selection / regenerateAllContent** is still active higher up, so first click is still eaten.

====

Updated

You fixed the **global click** and **container** paths (they now log “BLOCKED (from editable)”), but focus is still being stolen by the **blur → update pipeline**:

* When you click the next field (e.g., Yearly Price), the previous field (Monthly Price) fires **Blur**, which immediately calls `updateElementContent` (even though value didn’t change: oldValue=newValue) and marks `isDirty: true`. Right after that, the editor kicks off a **full `extractLayoutContent` sweep** across many layouts. This heavy regeneration happens **mid-interaction**, so the first click on the new field gets lost. You then succeed on the second/third click once the sweep finishes.&#x20;

* You can see the exact chain in your log:
  `Yearly Price - MouseDown` → `PricingCard Container - BlurCapture BLOCKED` → `Monthly Price - Blur` → **`updateElementContent CALLED/COMPLETED`** → **LeftPanel store dump** → long **`extractLayoutContent`** pass… and then another pass again (duplicated). The duplicated full sweeps imply the blur/update event is triggering the regeneration **twice**, compounding the chance that your initial click is swallowed.&#x20;

So: the **remaining issue** is the **blur of the previously focused editable** triggering an immediate page-wide recompute (often twice), which **remounts** parts of the UI right as you’re clicking the next field—hence “works on 2nd/3rd click.”&#x20;
