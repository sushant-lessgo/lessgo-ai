import { prisma } from '@/lib/prisma';

export interface AccountPage {
  id: string;
  slug: string;
  title: string | null;
}

export interface AccountScope {
  pages: AccountPage[];
  pageIds: string[];
  slugs: string[];
}

/**
 * Resolves the account-level data scope for the dashboard rollup + inbox pages:
 * every PublishedPage that belongs to the viewer.
 *
 * ID SPACE — READ THIS FIRST:
 * `clerkUserId` is the **Clerk id returned by `auth()`** (e.g. `user_2ab...`), which is the
 * id space `PublishedPage.userId` stores (schema: "Clerk User ID (external, not a foreign key)").
 * NEVER pass the internal `User.id` (the space `Project.userId` uses) — a wrong-space filter is
 * tsc-green and silently returns ZERO rows.
 *
 * Why this helper exists (R-A): `/api/forms/submit` writes BOTH `FormSubmission.userId` and
 * `FormSubmission.publishedPageId` from the client-supplied request body, so `FormSubmission.userId`
 * is attacker-controllable and must not be used for scoping. The page ids returned here derive from
 * the server-set `PublishedPage.userId`, so they are trustworthy: the leads inbox scopes via
 * `publishedPageId: { in: pageIds }`.
 *
 * Known accepted gap (R-A): `FormSubmission.publishedPageId` is nullable — orphan submissions with a
 * null `publishedPageId` are invisible to the inbox.
 *
 * No admin widening (R-B): this helper ALWAYS returns the viewer's own pages; admins get no god-view.
 * Deliberate divergence from the dashboard root's all-projects admin branch.
 *
 * All of the user's pages are included regardless of `publishState` / `isPublished` — historical leads
 * and analytics of a since-unpublished page still belong to the user.
 *
 * Server-only plain module (no 'use client'). `db` defaults to the prisma singleton and is injectable
 * for tests.
 */
export async function getAccountScope(
  clerkUserId: string,
  db = prisma
): Promise<AccountScope> {
  const pages = await db.publishedPage.findMany({
    where: { userId: clerkUserId /* Clerk id space — NOT internal User.id */ },
    select: { id: true, slug: true, title: true },
  });

  return {
    pages,
    pageIds: pages.map((p) => p.id),
    slugs: pages.map((p) => p.slug),
  };
}
