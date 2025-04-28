// /app/sitemap.xml/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = "https://lessgo.ai";

  const staticPages = ["", "blog"]; // Add other routes here as needed

  const urls = staticPages.map((path) => {
    return `
      <url>
        <loc>${baseUrl}/${path}</loc>
        <changefreq>monthly</changefreq>
        <priority>${path === "" ? "1.0" : "0.7"}</priority>
      </url>
    `;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("\n")}
  </urlset>`;

  return new NextResponse(sitemap.trim(), {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  });
}