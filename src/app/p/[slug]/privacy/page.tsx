import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { isServingPublishState } from '@/lib/publishState';

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await prisma.publishedPage.findUnique({
    where: { slug: params.slug },
    select: { title: true, publishState: true },
  });
  if (page && !isServingPublishState(page.publishState)) return {};
  const title = page?.title ? `Privacy Policy — ${page.title}` : 'Privacy Policy';
  return { title, robots: { index: true, follow: true } };
}

export default async function PrivacyPage({ params }: PageProps) {
  const page = await prisma.publishedPage.findUnique({
    where: { slug: params.slug },
    select: { content: true, themeValues: true, title: true, publishState: true },
  });

  // DD0: unpublished rows are retained — gate serving on publishState, not row existence.
  if (!page || !isServingPublishState(page.publishState)) return notFound();

  const legalPages = (page.content as any)?.legalPages;
  const privacy = legalPages?.privacy;
  if (!privacy?.content) return notFound();

  // Inherit page theme for visual consistency
  const theme = (page.themeValues as any) || {};
  const bgColor = theme?.colors?.background || theme?.background || '#FFFFFF';
  const textColor = theme?.colors?.text || theme?.text || '#111827';

  return (
    <main
      style={{ backgroundColor: bgColor, color: textColor, minHeight: '100vh' }}
      className="py-12 md:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
        {page.title && (
          <p className="text-sm opacity-70 mb-6">For {page.title}</p>
        )}
        {privacy.updatedAt && (
          <p className="text-xs opacity-60 mb-8">
            Last updated: {new Date(privacy.updatedAt).toLocaleDateString()}
          </p>
        )}
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown>{privacy.content}</ReactMarkdown>
        </article>
        <p className="mt-12 pt-6 border-t border-gray-200 text-xs opacity-60">
          This privacy policy was generated with AI assistance. For legal advice, consult a lawyer.
        </p>
        <p className="mt-6 text-sm">
          <a href="./" className="underline hover:opacity-80">← Back to home</a>
        </p>
      </div>
    </main>
  );
}
