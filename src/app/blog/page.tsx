import { getAllPosts } from "@/lib/mdx";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-gray-600 text-lg">
          Insights on landing pages, conversion optimization, and AI-powered design.
        </p>
      </div>

      <div className="space-y-8">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No blog posts yet.</p>
        ) : (
          posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <time dateTime={post.meta.date}>{formatDate(post.meta.date)}</time>
                    {post.readingTime && (
                      <>
                        <span>•</span>
                        <span>{post.readingTime}</span>
                      </>
                    )}
                  </div>
                  <CardTitle className="text-2xl hover:text-brand-logo transition-colors">
                    {post.meta.title}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {post.meta.description}
                  </CardDescription>
                </CardHeader>
                {post.meta.tags && post.meta.tags.length > 0 && (
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {post.meta.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
