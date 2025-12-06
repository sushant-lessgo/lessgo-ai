// lib/adminValidation.ts
// Zod validation schemas for admin endpoints
import { z } from 'zod';

// Migration endpoint schema
export const MigrateProjectSchema = z.object({
  token: z
    .string()
    .min(1, 'Token required')
    .max(100, 'Token too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid token format'),
});

// Transfer ownership schema
export const TransferOwnershipSchema = z.object({
  token: z
    .string()
    .min(1, 'Token required')
    .max(100, 'Token too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid token format'),
  newClerkId: z
    .string()
    .min(1, 'New clerk ID required')
    .regex(/^user_[a-zA-Z0-9]+$/, 'Invalid Clerk user ID format'),
});

export type MigrateProjectInput = z.infer<typeof MigrateProjectSchema>;
export type TransferOwnershipInput = z.infer<typeof TransferOwnershipSchema>;
