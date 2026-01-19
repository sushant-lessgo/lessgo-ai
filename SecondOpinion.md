It passes because your current checks are **structure-only**, not **language-likeness**:

* “2 words” ✅ (because there’s a space)
* “10+ chars” ✅
* “no single char repeated 6+ times” ✅ (it alternates characters, so it dodges the repetition rule)

So consonant-heavy keyboard mash looks “valid” even though it’s not meaningful.

## Vowel ratio check: good, but tune it to avoid false positives

I agree with the direction (cheap, no deps). Just be careful about false negatives like:

* Acronyms / product-y strings: `CRM API SDK`, `B2B SaaS`, `GPT-4 agent`
* Non-English inputs (Dutch, Hindi transliteration, etc.)
* Short inputs (vowel ratio is noisy on short strings)

### Practical implementation rules

Use vowel ratio **only when input is long enough** and **mostly letters**:

* Apply only if `lettersOnlyLength >= 20` (or 25)
* Compute ratio on letters only (ignore spaces, digits, punctuation)
* Threshold: start with `ratio < 0.12` (not 0.15) to reduce false rejects
* Add exemptions:

  * if it contains common tokens like `AI`, `API`, `CRM`, `SaaS`, `B2B`, `IoT`, etc.
  * if it contains at least one “normal-ish” word (length ≥ 3) with a vowel

That catches `fgrgrggffgdfg fgdfgdfgfgf` (0 vowels) reliably, without blocking real SaaS-ish descriptions.

## Even better: combine 2 cheap heuristics (still no deps)

Vowel ratio + “has at least one word with a vowel”:

* Fail if **both**:

  * vowel ratio is low **and**
  * no word contains a vowel

This reduces the chance you reject something like `CRM tool for SMBs` (has vowels in “tool”, “for”).

## Zod can do this cleanly

You’re correct: Zod doesn’t have built-in gibberish detection, but `.refine()` is exactly the right place to plug your `isMeaningfulText()` function (client + server).

**My recommendation:** implement vowel ratio (with the safeguards above) as a `.refine()` and keep “manual fallback” only if validation rejects a user who insists the text is valid.
