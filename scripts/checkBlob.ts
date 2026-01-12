import { prisma } from '../src/lib/prisma';

async function checkBlob() {
  const slug = process.argv[2] || 'page1';

  console.log('🔍 Checking Blob for slug:', slug);
  console.log('');

  try {
    // Get page from DB
    const page = await prisma.publishedPage.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        publishState: true,
        currentVersionId: true,
        lastPublishAt: true,
        publishError: true,
        currentVersion: {
          select: {
            version: true,
            blobKey: true,
            blobUrl: true,
            sizeBytes: true,
            createdAt: true,
          }
        },
        versions: {
          select: {
            version: true,
            blobKey: true,
            blobUrl: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }
      }
    });

    if (!page) {
      console.log('❌ Page not found in database!');
      return;
    }

    console.log('📄 Database Info:');
    console.log('  Page ID:', page.id);
    console.log('  Slug:', page.slug);
    console.log('  Publish State:', page.publishState);
    console.log('  Last Publish:', page.lastPublishAt);
    if (page.publishError) {
      console.log('  ❌ Publish Error:', page.publishError);
    }
    console.log('');

    if (page.currentVersion) {
      console.log('📦 Current Version:');
      console.log('  Version:', page.currentVersion.version);
      console.log('  Blob Key:', page.currentVersion.blobKey);
      console.log('  Blob URL:', page.currentVersion.blobUrl);
      console.log('  Size:', (page.currentVersion.sizeBytes / 1024).toFixed(2), 'KB');
      console.log('  Created:', page.currentVersion.createdAt);
      console.log('');

      // Try to fetch the blob URL
      console.log('🌐 Testing Blob URL...');
      try {
        const response = await fetch(page.currentVersion.blobUrl);
        console.log('  Status:', response.status, response.statusText);
        console.log('  Content-Type:', response.headers.get('content-type'));

        if (response.ok) {
          const text = await response.text();
          console.log('  Content Length:', text.length, 'bytes');
          console.log('  ✓ Blob is accessible!');
        } else {
          console.log('  ❌ Blob not accessible!');
        }
      } catch (fetchError) {
        console.log('  ❌ Error fetching blob:', fetchError);
      }
    } else {
      console.log('❌ No current version set!');
    }

    console.log('');
    console.log('📚 Version History:');
    page.versions.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.version} (${v.status})`);
      console.log(`     ${v.blobKey}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlob();
