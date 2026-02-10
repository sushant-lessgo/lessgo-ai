Issue 1 — Step 12 references non-existent files:                                                                                                                               - useBackgroundSelector.ts — does NOT exist                                                                                                                                    - backgroundCompatibility.ts — does NOT exist                                                                                                                                

  Dev likely guessed these. Step 12 needs replacement: grep all imports from archived files to find ACTUAL remaining consumers. There may be other files importing from        
  primaryBackgrounds.ts, backgroundSelection.ts, categoryMapping.ts, or themes.ts that aren't covered in Steps 6-11.

  Issue 2 — Step 6 minor naming inaccuracies:
  Plan says "Remove: dividerColorMap, calculateOtherBackgrounds." Neither exists by those names. BACKGROUND_MAP (line 29) is the divider mapping. The other logic is inline in 
  assignSectionBackgrounds. Won't affect implementation but shows dev didn't fully read the current file.