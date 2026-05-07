============================================================
Service dogfood batch  |  mocks: false  |  personas: 5
============================================================

────────────────────────────────────────────────────────────
Running: skincare — DTC skincare branding studio
────────────────────────────────────────────────────────────
[aiClient] Trying primary model: gpt-4o-mini
  Strategy ok. Sections: 7
[aiClient] Trying raw JSON generation with: gpt-4o-mini
  Copy ok. Sections: 7
  Accent emit: 7/7, complete: true, forbidden: 0
  → C:\Users\susha\lessgo-ai\dogfoodOutput\skincare.json

────────────────────────────────────────────────────────────
Running: saas-landing — B2B SaaS landing-page agency
────────────────────────────────────────────────────────────
[aiClient] Trying primary model: gpt-4o-mini
  Strategy ok. Sections: 7
[aiClient] Trying raw JSON generation with: gpt-4o-mini
  Copy ok. Sections: 7
  Accent emit: 7/7, complete: true, forbidden: 0
  → C:\Users\susha\lessgo-ai\dogfoodOutput\saas-landing.json

────────────────────────────────────────────────────────────
Running: restaurant-marketing — Local digital marketing agency for restaurants
────────────────────────────────────────────────────────────
[aiClient] Trying primary model: gpt-4o-mini
  Strategy ok. Sections: 7
[aiClient] Trying raw JSON generation with: gpt-4o-mini
  Copy ok. Sections: 7
  Accent emit: 4/7, complete: true, forbidden: 0
  → C:\Users\susha\lessgo-ai\dogfoodOutput\restaurant-marketing.json

────────────────────────────────────────────────────────────
Running: law-firm-web — Specialist law-firm web design agency
────────────────────────────────────────────────────────────
[aiClient] Trying primary model: gpt-4o-mini
  Strategy ok. Sections: 7
[aiClient] Trying raw JSON generation with: gpt-4o-mini
  Copy ok. Sections: 7
  Accent emit: 7/7, complete: true, forbidden: 0
  → C:\Users\susha\lessgo-ai\dogfoodOutput\law-firm-web.json

────────────────────────────────────────────────────────────
Running: wellness-ux — Wellness clinic UX consultancy
────────────────────────────────────────────────────────────
[aiClient] Trying primary model: gpt-4o-mini
  Strategy ok. Sections: 6
[aiClient] Trying raw JSON generation with: gpt-4o-mini
  Copy ok. Sections: 6
  Accent emit: 7/7, complete: true, forbidden: 0
  → C:\Users\susha\lessgo-ai\dogfoodOutput\wellness-ux.json

============================================================
AGGREGATE REPORT
============================================================

Italic-<em> LLM emit rate (before fallback):
  ✓ headline    20/20 (100.0%)
  ✓ lede        12/15 (80.0%)

Headline emit by section:
  hero             5/5 (100%)
  services         5/5 (100%)
  packages         5/5 (100%)
  cta              5/5 (100%)

Forbidden-word leaks: 0

Per-persona status:
  ✓ skincare               schema:ok complete:ok
  ✓ saas-landing           schema:ok complete:ok
  ✓ restaurant-marketing   schema:ok complete:ok
  ✓ law-firm-web           schema:ok complete:ok
  ✓ wellness-ux            schema:ok complete:ok

Done.