Issue: the imagetoolbar is updating the **wrong key/section**. It parses and selects `sectionId: "beforeAfter"` with `elementKey: "1757310502405-persona_avatar"`, but the renderer extracts content for layout **PersonaJourney** and looks for a plain `"persona_avatar"` key. Because that key is absent, it’s treated as undefined and falls back to the default `/persona-placeholder.jpg`.&#x20;


================

Updated advice

Here’s the issue (no fixes, just what’s wrong):

* The ImageToolbar is targeting a **different section/id format** than what the renderer expects. Toolbar targetId is `beforeAfter.1757338395540-before-visual` (dot-delimited, section **beforeAfter**), while your content extraction runs on layout **SplitCard** and looks for the base key **`before_visual`**. Because that key isn’t present, it stays `undefined` and falls back to the default `"/Before default.jpg"`.
* There’s a **delimiter mismatch** for the same target: your parser log shows a hyphenated id (`beforeAfter-1757338395540-before-visual`), but the toolbar uses a dot before the timestamp (`beforeAfter.1757338395540-before-visual`). That inconsistency means the selected element and the looked-up element don’t align.
* In the SplitCard extraction logs, **`before_visual` and `after_visual` are marked `isInSchema: false`**, so the extractor treats them as missing and repeatedly applies defaults, ignoring whatever the toolbar selected.&#x20;

=========================

Short answer: your “universal fix” isn’t actually in play during updates.

* The toolbar still produces `targetId: "beforeAfter.1757338395540-before-visual"` and the update call still writes **sectionId `"beforeAfter"` + elementKey `"1757338395540-before-visual"`** (dot split), not the expected base key `before_visual`.
* The SplitCard extractor keeps reporting **`before_visual` / `after_visual` as undefined (`isInSchema: false`)** and therefore applies the defaults (`/Before default.jpg`, `/After default.jpg`). In other words, the key the toolbar updates is not the key the renderer reads.
* Separately, PersonaJourney still logs **`persona_avatar` undefined → default `/persona-placeholder.jpg`**, so image replacement isn’t landing there either.&#x20;
