import { getPostBySlug, getAllPosts } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import GiscusComments from "@/components/GiscusComments";


export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts
    .filter((post): post is { slug: string; meta: { title: any; date: any; description: any } } => !!post?.slug)
    .map((post) => ({ slug: post.slug }));
}



export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = getPostBySlug(params.slug);
  
    if (!post) return {};
  
    return {
      title: post.meta.title,
      description: post.meta.description,
      openGraph: {
        title: post.meta.title,
        description: post.meta.description,
        url: `https://lessgo.ai/blog/${post.slug}`,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: post.meta.title,
        description: post.meta.description,
      },
    };
  }
  


export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post) return notFound();

  return (
    <main className="prose prose-neutral max-w-4xl mx-auto p-6">
      <h1>{post.meta.title}</h1>
      <p className="text-sm text-gray-500">{post.meta.date}</p>
      <MDXRemote source={post.content} />
        <GiscusComments />
    </main>
  );
}