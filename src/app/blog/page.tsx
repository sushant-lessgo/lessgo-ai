import { getAllPosts } from "@/lib/mdx";
import Link from "next/link";

export default function BlogPage() {
  const posts = getAllPosts(); // ❗ this should now work because it's inside function body

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>

      {posts.map((post: any) => (
        <article key={post.slug} className="mb-8">
          <Link href={`/blog/${post.slug}`}>
            <h2 className="text-xl font-semibold text-blue-600 hover:underline">{post.title}</h2>
          </Link>
          <p className="text-gray-500 text-sm">{post.meta?.date}</p>
          <p className="text-gray-700 mt-1">{post.meta?.description}</p>
        </article>
      ))}
    </main>
  );
}
