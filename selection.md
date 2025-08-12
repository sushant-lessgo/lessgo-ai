Got it. From these updated logs, the issue matches your observation and looks like a timing/priority conflict between stale **image** toolbar state and a later **element** selection update — plus some event/DOM side-effects:

* The image click path fires and **explicitly requests the image toolbar**:
  `showToolbar … {type: 'image', targetId: 'hero-hero-image'}` and the selection is set to `{sectionId: 'hero', elementKey: 'hero_image'}`.&#x20;

* The selection system **resolves the active toolbar to `image`** and even **locks** that transition for \~350ms:
  `Final getActiveToolbar result: image` → `useSelectionPriority … toolbarType: 'image'` → `useTransitionLock … {toolbarType: 'image', … duration: 350}`.&#x20;

* Meanwhile there are long stretches where the app reports **“No active selection”** and `shouldShowToolbar … image: false` (toolbar suppressed), so the UI doesn’t actually render what the state says should be visible.&#x20;

* Two side-effects show up exactly around your headline interactions:

  1. **Direct DOM manipulation**: `FORCED HEADLINE TO CENTER via direct DOM targeting`.
  2. **Event handling quirks**: `Image onClick - prevented bubbling` (then a separate handler says it detected the image click).
     These indicate competing pathways mutating selection/DOM outside the normal flow, which can defer or reorder toolbar updates.&#x20;

**What this explains:** the image click schedules/locks an **image** toolbar display, but because selection is repeatedly cleared and there’s direct DOM + event bubbling interference, that update doesn’t surface immediately. When you later click the **headline**, the pending image toolbar state briefly flushes (so you **see the image toolbar for a second**) before the new **element** selection re-evaluates and the **element** toolbar takes over. In short: a **race between a stale “image” lock/update and a new “element” selection**, amplified by selection being null and by direct DOM/event interference.&#x20;
