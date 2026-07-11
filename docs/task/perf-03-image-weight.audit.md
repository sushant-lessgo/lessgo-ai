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

---

## Phase 2 — write-layer base64/blob guard + ImageToolbar persistence fix

### Files changed
- `src/hooks/editStore/imageWriteGuard.ts` (new) — pure sync guard.
- `src/hooks/editStore/imageWriteGuard.test.ts` (new) — 9 unit tests.
- `src/hooks/editStore/contentActions.ts` — guard at `updateElementContent` chokepoint.
- `src/hooks/editStore/formsImageActions.ts` — new `uploadImageFromObjectUrl` adapter.
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx` — `handleImageEditorSave` now routes ephemeral blob: through the adapter.

### Write-path enumeration result (done FIRST, before landing the reject)
Grepped `URL.createObjectURL` under `src/`, all `updateElementContent`/`replaceImage`
callers, and `blob:`/`createObjectURL` in ImageToolbar. Findings:
- **ImageToolbar `handleImageEditorSave`** — the ONE genuine offender. SimpleImageEditor
  (`crop`/`resize` → `canvas.toBlob` → `URL.createObjectURL`, lines 186/213) hands back a
  `blob:` object URL that was persisted directly → dies on reload. FIXED (routed through adapter).
- **ImageToolbar stock-photo path (`onSelectImage`, ~:424) + `selectStockPhoto` (formsImageActions:591)**
  — write a Pexels **https** preview, then swap to a compressed https Blob-storage URL from
  `/api/proxy-image`. Neither is `data:`/`blob:`. SAFE, unchanged. Confirmed on disk.
- **`AvatarEditableComponent.tsx`, `HeaderLogo.tsx`** — each call `URL.createObjectURL` for a
  local preview, but grep shows they're imported only by self + `components/README.md` → DEAD.
  Not modified (out of scope per plan).
- `ExportFormCSV.tsx` / `ExportCSV.tsx` `createObjectURL` are CSV download blobs, not content writes — irrelevant.
- **No legit transient-preview flow beyond ImageToolbar** would be broken by the hard reject
  (the only transient-preview flows use https, not data:/blob:). Proceeded without pausing (plan unresolved-Q1 resolved: no pause needed).

### Per-file
- **imageWriteGuard.ts**: `isForbiddenImageSrc(value)` → true for `data:image/` and `blob:` prefixes.
  Pure, dependency-free (no fetch/store), non-string returns false.
- **contentActions.ts**: added guard immediately after the EDITOR_DEBUG block in `updateElementContent`.
  Guards STRING values only (`typeof content === 'string'`) — arrays / nested-collection non-string
  paths untouched. Forbidden value → `console.warn` in dev (`NODE_ENV !== 'production'`) / silent
  no-op in prod, returns without mutating (old value preserved, not marked dirty).
- **formsImageActions.ts**: new `uploadImageFromObjectUrl(objectUrl, targetElement)` — `fetch(url)` →
  `blob()` → `new File(...)` → delegates to existing `uploadImage(file, targetElement)` (which owns
  FormData + `tokenId` + writes permanent URL via updateElementContent + full save). No new token-less
  `/api/upload-image` fetch was added.
- **ImageToolbar.tsx**: `handleImageEditorSave` is now async; forbidden src → adapter with
  `isUploading` spinner + `uploadError` toast (both pre-existing UI), keeps old value on failure;
  non-forbidden src → direct `updateElementContent` (https passthrough). Stock-photo path unchanged.

### Deviations
- **Did NOT touch `src/types/store/actions.ts`** (out of Files-touched). The new `uploadImageFromObjectUrl`
  is therefore not declared on the `FormsImageActions` interface. `formsImageActions.ts` returns
  `as unknown as FormsImageActions`, so the extra method compiles there; ImageToolbar accesses it via a
  typed cast off the store instance (`(store as any).uploadImageFromObjectUrl`). Conservative choice to
  stay in scope — a follow-up may add the type declaration. tsc is green regardless.
- `isImageValue` in `aiActions.ts:84-89` intentionally LEFT UNCHANGED (read-side preserve-during-regen;
  existing base64 projects must keep rendering/regenerating).

### Verification
- `npx tsc --noEmit`: green.
- `npm run test:run`: green — 128 files passed / 1 skipped; 2016 passed / 3 skipped. New file
  `imageWriteGuard.test.ts` = 9/9 passing.
- Manual dev browser upload NOT run (per instructions; adapter delegation covered by mocked unit test).

### Open risks
- The type-declaration gap (deviation above) means callers get no compile-time signature for
  `uploadImageFromObjectUrl`; only ImageToolbar uses it and does so via cast. Low risk.
