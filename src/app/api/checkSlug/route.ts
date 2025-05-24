// app/api/check-slug/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  const exists = await prisma.publishedPage.findUnique({ where: { slug } });
  return NextResponse.json({ available: !exists });
}
