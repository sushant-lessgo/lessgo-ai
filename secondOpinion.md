The root cause is that the code path that actually renders your social-proof rows still uses **peer/peer-hover**, not the named **group/group-hover** you thought you swapped to.

* In the current file, `customer_count` is wrapped in a `span.peer`, and the delete button relies on `peer-hover:opacity-100`. That means the X only appears when the element with the `peer` class is hovered — not when the whole row is hovered. Worse, because `EditableAdaptiveText` renders its own internal DOM (and may not live inside that `span` the way you expect), the `.peer:hover` state often never fires, so the button stays `opacity-0` (invisible) even though it’s present and clickable — exactly what you’re seeing.&#x20;

* The same “peer” pattern still exists in the rating block (peer wrapper on `rating_count` + `peer-hover:opacity-100` on the button), so hover over the row won’t reveal the X there either.&#x20;

* Separately, the file now contains **both** implementations: some chunks use the corrected **named group** pattern (`group/customer-item` + `group-hover/customer-item:opacity-100`), while other chunks still use the old **peer** pattern — that inconsistency is why the change didn’t take effect where you’re looking.&#x20;

If you want a fix: remove the `peer` wrappers and use the named group consistently on the container rows only (`group/customer-item` and `group/rating-item`), then reveal the X with `group-hover/<name>:opacity-100` on the buttons. That makes the button appear when hovering anywhere over the entire row (avatars + text / stars + text), and avoids the fragility of relying on `EditableAdaptiveText`’s internal markup.
