import { config } from 'dotenv';
import { prisma } from '../src/lib/prisma';

config({ path: '.env.local' });

async function checkDuplicates() {
  const slug = process.argv[2] || 'page1';

  console.log('🔍 Checking for duplicate pages with slug:', slug);
  console.log('');

  const pages = await prisma.publishedPage.findMany({
    where: { slug },
    select: {
      id: true,
      slug: true,
      userId: true,
      publishState: true,
      createdAt: true,
      updatedAt: true,
      lastPublishAt: true,
      currentVersionId: true,
    }
  });

  console.log('📊 Found', pages.length, 'page(s) with this slug');
  console.log('');

  pages.forEach((p, i) => {
    console.log(`${i + 1}. Page ID: ${p.id}`);
    console.log(`   Created: ${p.createdAt}`);
    console.log(`   Updated: ${p.updatedAt}`);
    console.log(`   Last Publish: ${p.lastPublishAt}`);
    console.log(`   State: ${p.publishState}`);
    console.log(`   Current Version ID: ${p.currentVersionId || 'NONE'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkDuplicates();
