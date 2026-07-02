import { config } from 'dotenv';
import { kv } from '@vercel/kv';
import { prisma } from '../src/lib/prisma';

config({ path: '.env.local' });

async function fixKV() {
  const slug = process.argv[2] || 'page1';

  console.log('🔧 Fixing KV entry for slug:', slug);
  console.log('');

  try {
    // Get current page from DB
    const page = await prisma.publishedPage.findUnique({
      where: { slug },
      include: {
        currentVersion: true,
      }
    });

    if (!page) {
      console.log('❌ Page not found in database!');
      return;
    }

    if (!page.currentVersion) {
      console.log('❌ Page has no current version!');
      return;
    }

    console.log('📄 Current Database Info:');
    console.log('  Page ID:', page.id);
    console.log('  Version:', page.currentVersion.version);
    console.log('  Blob URL:', page.currentVersion.blobUrl);
    console.log('');

    // Check current KV entry
    const host = `${slug}.lessgo.site`;
    const routeKey = `route:${host}:/`;
    const currentKV = await kv.get(routeKey);

    console.log('🔍 Current KV Entry:');
    console.log(JSON.stringify(currentKV, null, 2));
    console.log('');

    // Update KV with correct info
    const newRouteConfig = {
      pageId: page.id,
      version: page.currentVersion.version,
      blobUrl: page.currentVersion.blobUrl,
      publishedAt: Date.now(),
    };

    console.log('✅ Updating KV with:');
    console.log(JSON.stringify(newRouteConfig, null, 2));
    console.log('');

    await kv.set(routeKey, newRouteConfig, { ex: 365 * 24 * 60 * 60 });

    console.log('✅ KV entry updated successfully!');
    console.log('');
    console.log(`Test: https://${slug}.lessgo.site`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixKV();
