# QA Pilot — data-capture E2E (DEV) — 2026-07-12

Env: worktree `.claude/worktrees/feature-tracking-pixels` (main, data-capture merged: commits 3720a0a8/c8563db9/9870ca72). Dev Neon DB (`ep-nameless-thunder`, prod line commented out). `npx prisma generate` run, `npm run dev` port 3000, Chrome via claude-in-chrome (existing Clerk dev session, no sign-in needed).

Target project: token `xx73ydREHLYz` (id `cmrgzg9sm003ultu0obdmwzwj`, "Meridian", product/meridian). Pre-test EditDelta count = 0.

| Step | Verdict | Evidence |
|------|---------|----------|
| 1. DB query: recent project + EditDelta count | PASS | 5 projects returned; picked `xx73ydREHLYz`; EditDelta count 0 for all 5 tokens |
| 2. Editor loads authed | PASS | `/edit/xx73ydREHLYz` rendered full editor (screenshot: hero "Deploy daily without failures"), no sign-in redirect |
| 3. Edit → auto-save POST /api/saveDraft 200 | PASS | 3 edits made (headline " QA-EDIT", lede " QA2", lede " QA3"). Server log: 2× `POST /api/saveDraft 200`; browser network log captured 2× `POST http://localhost:3000/api/saveDraft → 200` |
| 4. EditDelta rows written | PASS | Row `cmrhizj8o0009ltzs0pomf38b`: sectionId `hero-7c301e87`, sectionType `hero`, elementKey `lede`, aiText = original AI lede, userText = edited lede, editDistance 9→22 after 2nd lede edit (UPSERT: same row id, updatedAt bumped, aiText baseline preserved). `Project.aiBaseline` populated (3 sections) |
| 4a. First-sight freeze semantics | PASS (by design) | Headline edited BEFORE first post-deploy save → its baseline froze WITH the edit ("Deploy daily&nbsp; QA-EDITwithout <em>failures</em>.") → no bogus delta row for headline; lede froze clean → correct delta. Matches capture.ts additive-freeze doc |
| 5. PostHog telemetry | PASS (beacons observed) | 8× `POST https://eu.i.posthog.com/{i/v0/e,s}/... → 200` during session. Event names NOT decodable (gzip-js payloads). Regen/failure telemetry events not exercised (regen costs credits, out of pilot scope) |
| 6. Console errors | PASS | 0 errors/exceptions during edit+save cycles (tracking active from mid-session; page-load window not covered) |
| 7. Cleanup | DONE | Dev server killed (PID 15544, port 3000 free); temp query scripts removed from worktree; `.env` dev copy left in worktree |

Notes / observations:
- Editor serialization quirk (NOT capture bug): 2nd edit re-escaped prior `&nbsp;` → userText contains `&amp;nbsp;`; also typed text inserted mid-string ("refuse&nbsp; QA3to..."). Capture faithfully recorded what the editor exported.
- Drafted edits left on project `xx73ydREHLYz` (headline "QA-EDIT", lede "QA2"/"QA3") — harmless dev data; its aiBaseline headline entry now includes "QA-EDIT" (frozen post-edit).
- 1 EditDelta row remains in dev DB for token `xx73ydREHLYz`.

Overall: data-capture E2E VERIFIED on dev — edit → saveDraft → baseline freeze + EditDelta upsert with correct AI-vs-user diff, revert-safe upsert semantics, PostHog beacons flowing.
