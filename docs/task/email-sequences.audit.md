# email-sequences — implementation audit

> **Phase 1 re-applied on `feature/social-posts` base (drift resolution).** The worktree
> is now based on `feature/social-posts`, not main. All Phase 1 edits are ADDITIVE alongside
> the existing social-posts entries (SocialPost model, socialPostsLimit, 'social-posts'
> endpoint, SOCIAL_POST_GENERATION event) — nothing social-posts was removed or modified.
> Migration pending orchestrator run.

## Phase 1 — Schema + shared plumbing

**Files changed**
- `prisma/schema.prisma`
- `src/lib/modelConfig.ts`
- `src/lib/creditSystem.ts`

### `prisma/schema.prisma`
- Added inverse relation field `emailSequence EmailSequence?` to `model Project`, directly after the existing `socialPosts SocialPost[]` relation (both kept).
- Added new `EmailSequence` model (placed before `model UserIntegration`):

```prisma
model EmailSequence {
  id        String   @id @default(cuid())
  userId    String
  projectId String   @unique
  tokenId   String
  intent    String
  archetype String
  emails    Json // [{ position, key, subject, body }]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenId])
}
```

### `src/lib/modelConfig.ts`
- Added `'emailSequence'` to the `Endpoint` union type (alongside existing `'social-posts'`).
- Added `emailSequence: { primary: GPT_4O_MINI, backup: null }` to BOTH the `cheap` and `production` maps, after each `'social-posts'` entry (which is unchanged). NO Anthropic backup (spec constraint — OpenAI-only path). `ModelConfig.backup` is typed `string | null`, so `null` type-checks.

### `src/lib/creditSystem.ts`
- Added `EMAIL_SEQUENCE_GENERATION = 'email_sequence_generation'` to the `UsageEventType` enum, after the existing `SOCIAL_POST_GENERATION` (unchanged). No `CREDIT_COSTS` entry, no `deductCredits` switch case, no planManager change (ungated, creditsUsed 0).

### Migration
- **Migration NOT run — awaiting human gate sign-off.** Proposed migration: `add_email_sequence`.
- `npx prisma generate` NOT run (no TS references the new model in Phase 1; unnecessary).

### Verification
- `npx tsc --noEmit`: green for all Phase 1 edits (filtered grep on `modelConfig|creditSystem|emailSequence` → "NO ERRORS"). Reported errors are all PRE-EXISTING and unrelated to this phase:
  - `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` — missing asset, untouched.
  - `src/app/api/social/[token]/posts/**: Property 'socialPost' does not exist on PrismaClient` — the Prisma client has not been regenerated in this worktree, so the social-posts model isn't on the client yet. Same class as the pending emailSequence generate; resolved when the orchestrator runs the migration + `prisma generate`. Not caused by this phase's edits.
- `test:run` not run (no DB, no test-relevant surface for Phase 1).

### Deviations
- None material. Field added directly after `socialPosts SocialPost[]` matching existing alignment; no reflow of the social-posts line.

### Open risks
- Pre-existing unrelated tsc errors persist on the branch (missing `founder.jpg` asset; `socialPost` Prisma-client property absent until `prisma generate` runs) — none introduced here.
- Schema left edited but unmigrated by design — dev/prod DB is out of sync with schema until the orchestrator runs the migration.
