import { getPostBySlug, getAllPosts } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import GiscusComments from "@/components/GiscusComments";
import { mdxComponents } from "@/components/mdx/MDXComponents";

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post) return {};

  return {
    title: `${post.meta.title} | Lessgo.ai Blog`,
    description: post.meta.description,
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      url: `https://lessgo.ai/blog/${post.slug}`,
      type: "article",
      publishedTime: post.meta.date,
      authors: [post.meta.author || "Lessgo.ai Team"],
      images: post.meta.image ? [
        {
          url: post.meta.image,
          alt: post.meta.title,
        },
      ] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta.title,
      description: post.meta.description,
      images: post.meta.image ? [post.meta.image] : undefined,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post || !post.content) return notFound();

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta.title,
    description: post.meta.description,
    author: {
      "@type": "Organization",
      name: post.meta.author || "Lessgo.ai Team",
    },
    publisher: {
      "@type": "Organization",
      name: "Lessgo.ai",
      logo: {
        "@type": "ImageObject",
        url: "https://lessgo.ai/logo.png",
      },
    },
    datePublished: post.meta.date,
    dateModified: post.meta.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://lessgo.ai/blog/${post.slug}`,
    },
    image: post.meta.image || "https://lessgo.ai/og-image.jpg",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="prose prose-neutral prose-lg max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8 not-prose">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.meta.title}</h1>
          <div className="flex items-center gap-3 text-gray-600">
            <time dateTime={post.meta.date}>{formatDate(post.meta.date)}</time>
            {post.readingTime && (
              <>
                <span>•</span>
                <span>{post.readingTime}</span>
              </>
            )}
            <span>•</span>
            <span>{post.meta.author}</span>
          </div>
          {post.meta.tags && post.meta.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <MDXRemote source={post.content} components={mdxComponents} />

        <GiscusComments />
      </article>
    </>
  );
}