# `src/lib/testimonials/`

Native testimonial system: collect → moderate → project-scope → feature-on-page.
Dark-launched behind a flag. Data model = `Testimonial` + `CollectLink` (see
`prisma/README.md`). Full plan: `docs/tracks/testimonialSystem.md`.

| File | Purpose |
|------|---------|
| `repo.ts` | Owner-scoped data-access (pure — no auth/HTTP). Callers enforce ownership first. `status`/`source` validated here (stored as plain String, no DB enum). |
| `collectLinks.ts` | Per-project public collect links. The `token` is the only capability: the public submit endpoint resolves owner + project from it server-side. |
| `photo.ts` | Testimonial photo upload for the **public** collect endpoint — trusts nothing from the client; Sharp always re-encodes to webp (that decode is the real MIME guard). No SVG passthrough (stored-XSS avoidance). |
| `applyToPage.ts` | Pure function: fills a project's testimonials section in `finalContent` from approved testimonials (page-store `finalContent.pages[pageId]` model). Returns null if no testimonials section. |
| `flag.ts` | Dark-launch gates: `TESTIMONIALS_ENABLED` (server, authoritative) + `NEXT_PUBLIC_TESTIMONIALS_ENABLED` (client, cosmetic). |

Key invariant: testimonials are durable tenant assets — the `Testimonial.projectId` FK is
`SetNull`, so deleting a project never destroys real customer testimonials.
