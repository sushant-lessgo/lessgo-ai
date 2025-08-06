import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

const PublishedPageClient = dynamic(() => import('./components/PublishedPageClient'), {
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
    <PublishedPageClient pageData={page} />
  );
}
