# perf-03 image-weight — implementation audit

## Phase 1 — prod content base64 scan (read-only)

**Files changed**
- `scripts/scanBase64Content.ts` (new)

### What changed
Added a standalone READ-ONLY diagnostic script. Bootstrap matches the existing
`scripts/checkDuplicates.ts` pattern: `import { config } from 'dotenv'` +
`import { prisma } from '../src/lib/prisma'` + `config({ path: '.env.local' })`.
DATABASE_URL is ambient (never hardcoded) — the DB target is whatever `.env.local`
provides; the script only prints a credential-masked form of it.

Behavior: `prisma.project.findMany` (reads only) selecting
`id, tokenId, title, content, themeValues`. Each project's `content` and
`themeValues` are `JSON.stringify`'d and regex-scanned for `data:image/…;…` and
`blob:…` occurrences. Per hit: kind, 48-char prefix, matched substring length
(approx size). Per project: id, token (tokenId), title, hit count, embedded KB.
Summary line: projects scanned / affected / total hits / total embedded bytes.

### Zero-writes confirmation
Only `findMany` + `$disconnect` are called. No create/update/upsert/delete
anywhere. Read-only.

### How it is invoked
```
npx tsx scripts/scanBase64Content.ts
```
(No `tsx`/`ts-node` in devDeps; `npx tsx` fetches the runner on the fly, same as
the other `scripts/*.ts`. DATABASE_URL comes from `.env.local`.)

### Dev-DB scan output (executed)
```
DATABASE_URL: postgresql://***@ep-nameless-thunder-a2lj1s9v.eu-central-1.aws.neon.tech/neondb (dev)

Projects affected: 5 — all `blob:http://localhost:3000/<uuid>` (ephemeral object URLs),
each ~0.1 KB prefix-only (the URL string, not embedded image bytes).

Summary
  Projects scanned:  628
  Projects affected: 5
  Total hits:        5
  Total embedded:    ~0.3 KB (315 bytes)
```
Zero `data:image` (base64) hits on dev. The 5 hits are all `blob:` object-URL
strings — exactly the ImageToolbar reload-death bug phase 2 targets (a dead
`blob:` URL persisted into content). These are string-length only, not real
embedded image weight.

### tsc
`npx tsc --noEmit` reports no errors referencing `scanBase64Content`. `scripts/`
is inside the app tsconfig `include` (`**/*.ts`), so the script is type-checked
in-tree and is clean.

### Deviations
- None material. Chose to also mask the DB URL credentials in the printed target
  line (conservative — avoids leaking passwords when output is pasted to the
  user). This is additive/log-only.

### Open risks / notes for orchestrator
- Prod scan NOT run (per instructions — orchestrator handles prod + the human
  gate). Dev is clean of true base64; if prod matches, phase 1b (migration) can
  be skipped. The `blob:` hits are a separate concern already owned by phase 2.
- Script is a delete-after-use candidate (plan phase 7).
