import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { logger } from '@/lib/logger';
import type { BlogPost } from '@/types/blog';

const postsDirectory = path.join(process.cwd(), "src/content/blog");

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".mdx"));

  const posts = fileNames
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(postsDirectory, fileName);

      try {
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data, content } = matter(fileContents);

        // Skip unpublished posts
        if (data.published === false) {
          return null;
        }

        return {
          slug,
          meta: {
            title: data.title || slug,
            date: data.date || "Unknown date",
            description: data.description || "",
            ...(data.image && { image: data.image }),
            author: data.author || "Lessgo.ai Team",
            published: data.published !== false,
            tags: data.tags || [],
          },
          readingTime: calculateReadingTime(content),
        };
      } catch (err) {
        logger.error(`Failed to read or parse ${fileName}:`, err);
        return null;
      }
    })
    .filter((post): post is BlogPost => post !== null);

  // Sort by date (newest first)
  return posts.sort((a, b) => {
    const dateA = new Date(a.meta.date);
    const dateB = new Date(b.meta.date);
    return dateB.getTime() - dateA.getTime();
  });
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    // Don't return unpublished posts
    if (data.published === false) {
      return null;
    }

    return {
      slug,
      meta: {
        title: data.title || slug,
        date: data.date || "Unknown date",
        description: data.description || "",
        ...(data.image && { image: data.image }),
        author: data.author || "Lessgo.ai Team",
        published: data.published !== false,
        tags: data.tags || [],
      },
      content,
      readingTime: calculateReadingTime(content),
    };
  } catch (err) {
    logger.error(`Failed to read blog post with slug "${slug}":`, err);
    return null;
  }
}
