  🚫 Blocker                                                                                             
                                                                                                         
  Subpath routing for published pages is broken — will not work on subdomain OR custom domain without    
  middleware changes.                                                                                    
                                                                                                         
  Middleware Branch A fallback (middleware.ts:82-83):                                                    
  url.pathname = `/p/${subdomain}`   // drops original path
  return NextResponse.rewrite(url)
  Visiting mysite.lessgo.ai/privacy → rewrites to /p/mysite (path dropped) → hits /p/[slug] not
  /p/[slug]/privacy.

  Middleware Branch B (middleware.ts:88-91) hard-404s on pathname !== '/' — customdomain.com/privacy
  returns 404 immediately.

  Required middleware changes (add to plan):
  - Branch A SSR fallback: preserve path → url.pathname = \/p/${subdomain}${originalPath}``
  - Branch B: remove root-only guard OR add allowlist (/privacy, /terms…); also preserve path in slug-for
   fallback rewrite
  - KV route check in Branch A should still only look up route:{host}:/ (blob only for root) — but
  continue to SSR fallback for other paths, not short-circuit

  ✅ Verified claims

  - generateWithSchema at aiClient.ts:264
  - requireAICredits at planCheck.ts:208, consumeCredits at creditSystem.ts:252
  - CREDIT_COSTS at line 7 — ✅ plan correctly says to add PRIVACY_POLICY_GENERATION: 2 there, AND add
  PRIVACY_POLICY to UsageEventType enum (plan omits this — needed since consumeCredits requires a known
  event type, and switch at line 175 routes costs per event)
  - ContactFooter.tsx + ContactFooter.published.tsx both exist
  - PublishedPage model at line 43 — correct location for legalPages Json? addition
  - /api/v2/understand/route.ts exists as pattern reference
  - react-markdown NOT in package.json → must npm install

  Gaps

  1. UsageEventType.PRIVACY_POLICY_GENERATION missing from plan — must be added alongside CREDIT_COSTS
  entry; consumeCredits at line 175 has a switch-case per event type, verify it handles new type or has a
   default.
  2. /api/publish/route.ts change underspecified — plan item #8 says "include legalPages from project
  draft content". Draft content stores it at Project.content.legalPages.privacy (per plan #1), but
  PublishedPage gets a top-level legalPages column. Need explicit extraction: legalPages: (draftContent
  as any)?.legalPages ?? null on lines 77/105/137/143/210 (publish has 4+ write sites — verify all).
  3. Republish semantics for legalPages — plan answers "preserve" but doesn't specify: if user removed
  legalPages from draft, does republish clear it? Likely yes (overwrite). Document.
  4. /p/[slug]/privacy/page.tsx typography — plan says "reuse site theme if possible, else neutral." Site
   theme is per-page via themeValues. Use it — a neutral black-and-white privacy page on a branded site
  looks broken.
  5. Edit-mode link behavior — clicking "Privacy Policy" link in footer while editing should open the
  editor, not rewrite. Plan item #6 says "In edit mode, link opens editor instead" — fine, but requires
  wiring to useEditStoreLegacy or a click handler check mode === 'edit'.
  6. Published footer (#7 ContactFooter.published.tsx) is static SSR-rendered HTML. Conditional on
  legalPages?.privacy?.content means footer must receive legalPages as a prop or read from page context.
  Verify the published renderer has access to page-level data (not just section content).

  Smaller nits

  - Regenerate button costs credits again → no problem, but tell the user in the UI before the click (not
   after).
  - Markdown textarea + live preview = 2 columns. On mobile, split fails. Plan doesn't mention responsive
   handling — don't need to solve, but confirm it's acceptable or force mobile to tabs.
  - "AI-generated, not legal advice" disclaimer should also appear on the published page footer (tiny
  note), not just editor. Reduces lawyer-call risk for your users.

  Unresolved

  - Middleware subpath rewrite: accept this scope addition or carve out /privacy as root-only hack (e.g.,
   mysite.com/?p=privacy)?
  - UsageEventType switch-case: does consumeCredits need explicit case for new event type?
  - Site theme on privacy page: inherit or neutral?
  - Custom-domain non-root routing: is this the right trigger to retire the "v1 root path only" rule in
  Branch B? Affects terms/cookies/future legal pages too.
  - Published footer data access: can ContactFooter.published.tsx read page-level legalPages today, or
  does it need prop plumbing?