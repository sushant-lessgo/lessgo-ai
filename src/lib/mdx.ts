import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { logger } from '@/lib/logger';

const postsDirectory = path.join(process.cwd(), "src/content/blog");

export function getAllPosts() {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory).filter((name) => name.endsWith(".mdx"));

  return fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, "");
    const fullPath = path.join(postsDirectory, fileName);

    try {
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      return {
        slug,
        meta: {
          title: data.title || slug,
          date: data.date || "Unknown date",
          description: data.description || "",
        },
      };
    } catch (err) {
      logger.error(`Failed to read or parse ${fileName}:`, err);
      return null;
    }
  }).filter(Boolean); // remove nulls
}

export function getPostBySlug(slug: string) {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      meta: {
        title: data.title || slug,
        date: data.date || "Unknown date",
        description: data.description || "",
      },
      content,
    };
  } catch (err) {
    logger.error(`Failed to read blog post with slug "${slug}":`, err);
    return null;
  }
}
