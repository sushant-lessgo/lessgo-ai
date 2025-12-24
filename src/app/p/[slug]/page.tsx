import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// ISR configuration - revalidate every hour
export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await prisma.publishedPage.findUnique({
    where: { slug: params.slug },
    select: {
      title: true,
      content: true,
      previewImage: true,
    },
  });

  if (!page) return {};

  // Extract hero content for description
  const content = page.content as any;
  const sections = content?.layout?.sections || [];
  const heroSectionId = sections.find((id: string) => id.includes('hero'));
  const heroElements = heroSectionId
    ? content?.content?.[heroSectionId]?.elements || {}
    : {};

  const headline = heroElements.headline?.content || page.title || 'Landing Page';
  const subheadline = heroElements.subheadline?.content || '';

  // Truncate description to 160 characters
  const description = subheadline
    ? (subheadline.length > 160 ? subheadline.slice(0, 157) + '...' : subheadline)
    : `Check out ${headline}`;

  // Use manual override if exists, otherwise generate dynamically
  const ogImageUrl = page.previewImage || `/api/og/${params.slug}`;

  return {
    title: page.title || headline,
    description,
    openGraph: {
      title: page.title || headline,
      description,
      url: `https://${params.slug}.lessgo.ai`,
      siteName: 'Lessgo.ai',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: page.title || headline,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title || headline,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PublishedPage({ params }: PageProps) {
  const page = await prisma.publishedPage.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      htmlContent: true,
      title: true,
    },
  });

  if (!page) return notFound();

  if (!page.htmlContent) {
    // Fallback if htmlContent doesn't exist
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Page Not Ready</h1>
        <p>This page needs to be republished. Please contact the page owner.</p>
      </div>
    );
  }

  // Server-rendered HTML (no client component, zero JS)
  return (
    <main
      className="published-page"
      dangerouslySetInnerHTML={{ __html: page.htmlContent }}
    />
  );
}
