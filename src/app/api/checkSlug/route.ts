// app/api/check-slug/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSlug } from "@/lib/security";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  // Reserved-slug / format guard runs BEFORE the DB check so the UI reports
  // `app`/`dashboard`/`admin`/etc. as unavailable up-front instead of letting a
  // user burn a publish attempt on a slug the publish route would reject anyway.
  const check = validateSlug(slug);
  if (!check.valid) {
    return NextResponse.json({ available: false, reason: check.error });
  }

  const exists = await prisma.publishedPage.findUnique({ where: { slug } });
  return NextResponse.json({ available: !exists });
}
