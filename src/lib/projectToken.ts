import { nanoid } from 'nanoid';
import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * Mints a fresh project token (`Token` row) and returns its value.
 *
 * Extracted from `/api/start` (which creates a token the same way: `nanoid(12)` + `token.create`).
 * `Project.tokenId` FKs `Token.value`, so the Token row must exist BEFORE the Project insert —
 * pass the caller's transaction client when both happen in one `$transaction` (DD9).
 *
 * 🚨 `/api/start` is deliberately NOT re-pointed at this helper (blast-radius control this
 * slice — see DD9). It stays a duplicate two-liner there until a follow-up moves it.
 */
export async function mintProjectToken(
  client: PrismaClient | Prisma.TransactionClient
): Promise<string> {
  const value = nanoid(12);
  await client.token.create({ data: { value } });
  return value;
}
