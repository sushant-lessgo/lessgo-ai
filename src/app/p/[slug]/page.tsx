import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { GPTOutput } from '@/modules/prompt/types';
import dynamic from 'next/dynamic';

const PublishedPageRenderer = dynamic(() => import('@/modules/generatedLanding/PublishedPageRenderer'), {
  ssr: false,
});

interface PageProps {
  params: { slug: string };
}

export default async function PublishedPage({ params }: PageProps) {
  const page = await prisma.publishedPage.findUnique({
    where: { slug: params.slug }
  });

  if (!page) return notFound();

  return (
    <PublishedPageRenderer
      data={page.content as GPTOutput}
      themeValues={page.themeValues as {
        primary: string;
        background: string;
        muted: string;
      }}
      userId={page.userId}
      publishedPageId={page.id}
    />
  );
}
