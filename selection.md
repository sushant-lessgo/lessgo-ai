Short version: the app hangs because the “bold” action enters a formatting state that never exits, which then drives a runaway render/selection loop in the text toolbar.

Why I’m confident:

Right before the click, the text toolbar is already thrashing: dozens of renders with hasValidPosition: false and “no anchor registered,” e.g. RENDER #1…#58 and repeated “locked visible” messages. That’s a render loop waiting to explode. 

When you click Bold, the flow logs format:start and flips isInProgress to true twice, but there is no corresponding “format:end” or a reset to false afterwards. The last lines show applyFormatInternal STARTED → “Applying format to selected text” → Applied partial text formatting, and then the logs stop—no cleanup/finish. That leaves the UI stuck in “formatting in progress,” which blocks interactions and keeps the toolbar/state churning. 

Combined, the missing completion of the formatting transaction plus the toolbar’s missing anchor/invalid position causes continuous re-renders and event suppression/restoration cycles until the page feels unresponsive. 

So the root cause is an unbalanced formatting lifecycle (start without finish) triggered by the Bold toggle, on top of a toolbar that’s already re-rendering without a valid anchor/position.