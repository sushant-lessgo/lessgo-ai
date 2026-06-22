// Per-project public collect links (Phase 3). The token is the only capability: the public submit
// endpoint resolves owner + project from it server-side. Owner-facing operations verify project
// ownership (Project.userId is the internal User.id; match via the `user` relation on clerkId).

import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import type { CollectLink } from '@prisma/client'

function newToken(): string {
  return nanoid(24) // URL-safe, unguessable
}

async function assertProjectOwned(userId: string, projectId: string): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, user: { clerkId: userId } },
    select: { id: true },
  })
  if (!project) throw new Error('Project not found or not owned by user')
}

/** Owner: fetch the project's link, creating it on first request. */
export async function getOrCreateCollectLink(userId: string, projectId: string): Promise<CollectLink> {
  await assertProjectOwned(userId, projectId)
  const existing = await prisma.collectLink.findUnique({ where: { projectId } })
  if (existing) return existing
  return prisma.collectLink.create({ data: { projectId, userId, token: newToken() } })
}

/** Public: resolve a link by token (caller checks `isActive`). Includes project title for branding. */
export function getCollectLinkByToken(
  token: string,
): Promise<(CollectLink & { project: { title: string } }) | null> {
  return prisma.collectLink.findUnique({
    where: { token },
    include: { project: { select: { title: true } } },
  })
}

/** Owner: enable/disable without deleting. */
export async function setCollectLinkActive(
  userId: string,
  projectId: string,
  isActive: boolean,
): Promise<CollectLink> {
  await assertProjectOwned(userId, projectId)
  return prisma.collectLink.update({ where: { projectId }, data: { isActive } })
}

/** Owner: rotate the token (old URL stops working immediately). */
export async function rotateCollectLinkToken(userId: string, projectId: string): Promise<CollectLink> {
  await assertProjectOwned(userId, projectId)
  return prisma.collectLink.update({ where: { projectId }, data: { token: newToken() } })
}
