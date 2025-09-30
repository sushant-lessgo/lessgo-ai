// /app/sitemap.xml/route.ts

import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/mdx";

export async function GET() {
  const baseUrl = "https://lessgo.ai";

  const staticPages = ["", "blog"]; // Add other routes here as needed

  // Get all blog posts
  const posts = getAllPosts();

  // Static pages
  const staticUrls = staticPages.map((path) => {
    return `
      <url>
        <loc>${baseUrl}/${path}</loc>
        <changefreq>monthly</changefreq>
        <priority>${path === "" ? "1.0" : "0.7"}</priority>
      </url>
    `;
  });

  // Blog posts
  const blogUrls = posts.map((post) => {
    const lastmod = new Date(post.meta.date).toISOString().split('T')[0];
    return `
      <url>
        <loc>${baseUrl}/blog/${post.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
    `;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${[...staticUrls, ...blogUrls].join("\n")}
  </urlset>`;

  return new NextResponse(sitemap.trim(), {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  });
}