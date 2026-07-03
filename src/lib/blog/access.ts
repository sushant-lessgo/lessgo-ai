// Blog (Phase 1) — shared ownership gate for /api/blog/* routes.
// Wraps assertProjectOwner (memory: use it for ALL new token routes) and loads
// the project row blog handlers need. Demo token gets no blog.
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { assertProjectOwner } from '@/lib/security';

export type BlogAccess =
  | {
      ok: true;
      project: { id: string; audienceType: string; templateId: string | null };
    }
  | { ok: false; status: number; error: string };

export async function requireBlogProject(tokenId: string, action: string): Promise<BlogAccess> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { ok: false, status: 401, error: 'Unauthorized' };

  const access = await assertProjectOwner(clerkId, tokenId, { action });
  if (!access.ok) return { ok: false, status: access.status, error: access.error };
  if (access.isDemo) return { ok: false, status: 404, error: 'Project not found' };

  const project = await prisma.project.findUnique({
    where: { tokenId },
    select: { id: true, audienceType: true, templateId: true },
  });
  if (!project) return { ok: false, status: 404, error: 'Project not found' };

  return { ok: true, project };
}
