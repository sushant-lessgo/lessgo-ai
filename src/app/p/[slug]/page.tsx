import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import LandingPagePreview from '@/components/generatedLanding/LandingPagePreview';
import type { GPTOutput } from '@/modules/prompt/types';

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function PublishedPage({ params }: PageProps) {
  console.log('[LOOKUP]', params.slug);

const allPages = await prisma.publishedPage.findMany();
console.log('[ALL PAGES]', allPages);

  const page = await prisma.publishedPage.findUnique({
    where: { slug: params.slug }
  });

  if (!page) return notFound();
console.log('[PublishedPage] Loaded content:', page.content);
 return (
  <div className="min-h-screen bg-white">
    <LandingPagePreview
      data={page.content as GPTOutput} // ✅ safely cast here
      isStaticExport={true}
    />
  </div>
);

}
