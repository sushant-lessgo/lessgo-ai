import 'server-only';

// scale-04 (phase 3) — shared goal-fetch helper for the published render path.
//
// ONE prisma lookup: PublishedPage.projectId → Project.brief → goal. Reused by
// all three surfaces that instantiate the published renderer with a goal:
//  - renderPublishedExport (blob-bake, self-fetch → covers normal publish AND
//    the custom-domain republish path with zero caller edits)
//  - src/app/p/[slug]/page.tsx           (root SSR fallback)
//  - src/app/p/[slug]/[...subpath]/page.tsx (subpage SSR fallback)
//
// Null projectId / brief / goal → undefined: the normalization pre-pass then
// leaves every GOAL_REF primary on its legacy fallback, so pre-scale-01 projects
// render unchanged. Never throws — a lookup failure degrades to legacy behavior.

import { prisma } from '@/lib/prisma';
import type { Brief } from '@/types/brief';

export async function getPublishedGoal(
  pageId: string,
): Promise<Brief['goal'] | undefined> {
  try {
    const page = await prisma.publishedPage.findUnique({
      where: { id: pageId },
      select: { projectId: true },
    });
    if (!page?.projectId) return undefined;

    const project = await prisma.project.findUnique({
      where: { id: page.projectId },
      select: { brief: true },
    });
    const brief = project?.brief as { goal?: Brief['goal'] } | null | undefined;
    if (!brief || typeof brief !== 'object') return undefined;
    return brief.goal ?? undefined;
  } catch {
    return undefined;
  }
}
