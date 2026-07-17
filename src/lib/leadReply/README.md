# leadReply

Pure helpers behind the dashboard **"Draft reply"** action (Dashboard S4b): given a
lead's form submission and the owning project's `Brief`, one gated AI call drafts an
on-brand, editable reply the founder copies to clipboard. Draft + copy only — no
send infra, no CRM.

## Key files

- `messageExtraction.ts` — `extractLeadMessage(data)` / `hasReplyableMessage(data)`.
  Finds the lead's free-text message. `hasReplyableMessage` is the ONE shared gate
  for BOTH the UI affordance and the server route (single source of truth: the UI
  never offers a draft the route would refuse). Inverse of `LeadsInbox.tsx`'s
  `previewOf`, which picks contact fields — do not merge them.
- `brandGrounding.ts` — `resolveReplyGrounding(brief, siteName)` → `{ mode, summary }`.
  Server-side; wraps the email module's `buildBrandContext`/`summarizeBrandContext`.
- `prompt.ts` — `buildLeadReplyPrompt(grounding, leadMessage, leadName?)` +
  `LeadReplyOutputSchema` (the Zod contract for `generateRawJson('lead-reply', …)`).

## B1 — mode is derived from FACTS, not parse-success or summary-emptiness

Two tempting "is the Brief thin?" signals are dead:

1. **Parse-success** — `BriefSchema` fields are ALL optional, so any non-null object
   (even `{}`) `safeParse`s OK. Parse success ≠ has facts.
2. **Summary-emptiness** — `summarizeBrandContext` NEVER returns empty; a thin Brief
   yields the fallback sentence *"No specific brand facts were captured…"*.

So `resolveReplyGrounding` sets `mode: 'brief'` **only** when `buildBrandContext`
yielded ≥ 1 real fact (`offer` OR non-empty `offerings`/`audiences`/`testimonials`/
`proofAvailable`). Otherwise `mode: 'light'`, and the summary is the **site name
only** — the "No specific brand facts…" fallback sentence is NEVER shipped into the
prompt. `resolveReplyGrounding` never throws (null/undefined/non-object/garbage →
light).

## Boundary invariant

- `messageExtraction.ts` is the **ONLY** file here safe/intended for import from
  `'use client'` code (the lead-detail pane's gate). It has zero server/AI deps.
- `brandGrounding.ts` and `prompt.ts` are **server-side** (consumed by the route);
  do not import them from client components.
- Nothing in this module ever enters a published renderer.
