import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

interface CleanupResult {
  deleted: number;
}

/**
 * Clean up old versions of a published page
 * Deletes both blob files and database records
 *
 * @param pageId - Published page ID
 * @param keepCount - Number of versions to keep (default: 10)
 * @returns Number of versions deleted
 */
export async function cleanupOldVersions(
  pageId: string,
  keepCount: number = 10
): Promise<CleanupResult> {
  try {
    // 1. Query old versions from DB (skip last N versions)
    const oldVersions = await prisma.publishedPageVersion.findMany({
      where: { publishedPageId: pageId },
      orderBy: { createdAt: 'desc' },
      skip: keepCount, // Keep last N versions
    });

    if (oldVersions.length === 0) {
      return { deleted: 0 };
    }

    // 2. Delete blobs and DB records
    let deleted = 0;
    for (const version of oldVersions) {
      try {
        // Delete every blob in this version (root + subpages). Multi-page
        // publishes record all blob keys in metadata.blobs[]; fall back to the
        // primary blobKey for legacy single-page versions.
        const meta = version.metadata as { blobs?: Array<{ blobKey?: string }> } | null;
        const blobKeys = Array.isArray(meta?.blobs)
          ? meta!.blobs.map((b) => b.blobKey).filter((k): k is string => !!k)
          : [];
        if (!blobKeys.includes(version.blobKey)) blobKeys.unshift(version.blobKey);

        for (const key of blobKeys) {
          await del(key);
        }

        // Then delete DB record (only if blob deletion succeeded)
        await prisma.publishedPageVersion.delete({
          where: { id: version.id },
        });

        deleted++;
        console.log('[Cleanup] Deleted version:', version.version);
      } catch (err) {
        console.error('[Cleanup] Delete failed:', version.blobKey, err);
        // Continue to next version (don't fail entire cleanup)
      }
    }

    return { deleted };
  } catch (err) {
    console.error('[Cleanup] Cleanup failed:', err);
    return { deleted: 0 };
  }
}
