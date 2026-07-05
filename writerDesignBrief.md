# Design Brief — Personal Website for a Hindi Author

## What we are building

A one-page personal website for a senior Hindi-language author or poet. It sits between a "link in bio" page and a full website: one beautifully composed page that says *who this writer is*, shows their books and writing, and points readers to follow them or buy their books. No shop, no booking, no forms.

This is a **design system, not a single page**: the same design will be reused for many different writers, each with their own photo, books, and personality. So it must be designed to survive content and color changes gracefully (details in "Design as a system" below).

## Who it's for

**The writer (the client):** a respected Hindi literary figure — poet, novelist, essayist. Often 50+, established, dignified. They have published books, won awards, been reviewed in literary magazines. They are not influencers and must never look like one. Their currency is गरिमा (gravitas) and literary reputation.

**The visitor:** readers, admirers, literary community members, journalists, event organizers. They arrive from social media or word of mouth. They want to: know the writer, browse their books, read a sample of their writing, and follow them.

## Mood

**Aim for:** literary, editorial, bookish, quiet confidence. Think: a beautifully set book jacket, a literary magazine spread, an independent publisher's catalog, a well-designed poetry collection. Generous whitespace, typography doing the heavy lifting, restraint.

**Avoid at all costs:**
- SaaS/startup landing page aesthetics (gradients, glassmorphism, floating cards, emoji, "trusted by" strips)
- Linktree-style stacked-buttons look
- Anything loud, salesy, or trend-driven
- Stock-photo genericness

The page should feel like it was designed by someone who reads.

## Page content (top to bottom)

Use the sample content below verbatim — it is realistic placeholder content for a fictional senior Hindi poet. Design for THIS text, not lorem ipsum.

### 1. Identity (hero)
- Name: **केशव नारायण 'अरण्य'**
- One-line identity: *कवि · निबंधकार · साहित्य अकादेमी पुरस्कार से सम्मानित*
- A short evocative line (the writer's own words): *"शब्द वह दीपक है जो अँधेरे को नहीं, अँधेरे के भय को मिटाता है।"*
- Portrait photo (use a dignified elderly-Indian-writer placeholder; assume a decent but amateur photo — the design should elevate an ordinary photograph)
- Primary actions: **Follow** (social icons) and **पुस्तकें देखें** (scroll to books)

### 2. About / परिचय
Short bio, 2 paragraphs:

> केशव नारायण 'अरण्य' हिंदी कविता की उस परंपरा के कवि हैं जो छायावाद से आधुनिकता तक की यात्रा को अपने भीतर समेटे हुए है। पाँच दशकों के लेखन में उन्होंने बारह कविता-संग्रह, चार निबंध-संग्रह और अनगिनत पत्रिकाओं में प्रकाशित रचनाएँ हिंदी साहित्य को दी हैं।
>
> उत्तर प्रदेश के एक छोटे से क़स्बे से निकलकर उन्होंने भारतीय साहित्य के शिखर तक की यात्रा की। उनकी कविताएँ प्रकृति, स्मृति और मनुष्य के भीतर के एकांत की पड़ताल करती हैं।

Optional small facts row: जन्म 1948 · 16 पुस्तकें · साहित्य अकादेमी पुरस्कार 2011

### 3. Books / पुस्तकें
4 books, each with: cover image, title, one-line description, year, and a **"Amazon पर ख़रीदें"** link (external). Covers will be photographed/scanned book covers of varying quality — design must tolerate imperfect cover images.

- **वन में एकांत** (कविता-संग्रह, 2021) — *प्रकृति और स्मृति की कविताएँ*
- **नदी का दूसरा किनारा** (कविता-संग्रह, 2016) — *साहित्य अकादेमी से सम्मानित कृति*
- **शब्दों के पार** (निबंध-संग्रह, 2012) — *भाषा और साहित्य पर चिंतन*
- **पहला अक्षर** (कविता-संग्रह, 2005) — *आरंभिक दौर की प्रतिनिधि कविताएँ*

### 4. A sample of the writing / एक रचना
One short poem, beautifully typeset — this is the soul of the page. Treat it like a spread in a poetry collection:

> **सुबह**
>
> ओस की एक बूँद में
> समूचा आकाश उतर आया है —
> मैं झुककर देखता हूँ
> और सोचता हूँ,
> इतने बड़े होने का
> क्या अर्थ है।

### 5. Recognition / सम्मान और चर्चा
2–3 short praise quotes / press mentions:

> "अरण्य की कविता में वह ठहराव है जो आज की हिंदी कविता में दुर्लभ है।" — *हंस पत्रिका*

> "प्रकृति के कवि, पर मनुष्य की आँख से।" — *डॉ. विजया सिंह, आलोचक*

Plus a simple awards line: साहित्य अकादेमी पुरस्कार · व्यास सम्मान (नामांकित) · उ.प्र. हिंदी संस्थान सम्मान

### 6. Follow / जुड़िए (footer)
- Social links: Facebook, YouTube, Instagram, X — for this audience **Facebook and YouTube come first**
- Short closing line, e.g. *नई रचनाओं की सूचना के लिए जुड़िए*
- Minimal footer (name, © year)

Sections 4 and 5 are optional per writer — the page must still compose well if a writer has no poem or no press quotes. Show the full version; keep sections self-contained so any one can be dropped.

## Typography — the heart of this brief

**The page is Devanagari-first.** All display and body text is Hindi. This is the single most important design decision: most fonts and type systems are designed around Latin, and Hindi set in an afterthought font instantly looks cheap. The typography must make Devanagari look *luxurious*.

- Choose Devanagari faces deliberately. Good candidates (Google Fonts, all free): **Tiro Devanagari Hindi** (literary, bookish), **Noto Serif Devanagari** (robust, many weights), **Mukta / Hind** (clean sans for UI/captions), **Martel** (editorial serif). You may propose others.
- Mind Devanagari's metrics: the शिरोरेखा (headline stroke), taller conjuncts and matras need more line-height than Latin; display sizes behave differently. Set real sizes with the sample text above and tune, don't assume Latin defaults.
- Small English will appear (e.g., "Amazon", social labels): pick a Latin companion that harmonizes; keep English subordinate.
- Establish a clear type scale (display / heading / body / caption) and name it — it becomes part of the system.

## Design as a system

The design will be applied to many writers. Deliver it as a small system:

1. **Color as a palette, not hardcoded choices.** Define: background(s), ink/text colors, one accent, hairline/border. The whole design should work if the accent and background mood are swapped (e.g., warm ivory+maroon ⇄ cool grey+deep blue). Show one alternate palette applied to prove it.
2. **One font pairing as default, one alternate** (e.g., serif-led literary vs. sans-led modern) to show the layout survives a type swap.
3. **Spacing rhythm**: consistent vertical rhythm between sections; the page should breathe.
4. Content flexes: 2–8 books, poem present/absent, long/short names — the layout must not break.

## Deliverables

- **3 distinct design directions**, each a single self-contained static HTML file (inline CSS; Google Fonts links OK). Not variations of one idea — three genuinely different takes on "senior Hindi literary figure online."
- Each fully responsive (design mobile-first — most visitors arrive from Facebook/WhatsApp on phones).
- Each includes, at the bottom or as a second file, a small swatch/spec strip: palette tokens, type scale, and the alternate palette + font pairing demo.
- Use the sample content above in all three.

## Constraints

- Single page, anchor navigation only. No page transitions, no heavy JS — CSS-only or trivial JS interactions.
- No external assets beyond Google Fonts and placeholder images; everything else inline.
- Fast and lightweight: this page will often be opened on mid-range phones over mobile data in small-town India.
- Accessible contrast (WCAG AA) for all text.
