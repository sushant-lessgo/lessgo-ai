import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_IDS = (process.env.ADMIN_CLERK_IDS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdmin(clerkId: string | null | undefined): boolean {
  return !!clerkId && ADMIN_IDS.includes(clerkId);
}

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return null;

  const { userId } = await auth();
  if (isAdmin(userId)) return null;

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
