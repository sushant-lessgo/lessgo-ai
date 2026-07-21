// Tests for the Clerk owner-email lookup. Contract: never throws; every failure
// mode comes back as { error } so a lead is still saved.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clerkClient } from '@clerk/nextjs/server';
import { resolveOwnerEmail } from './resolveOwnerEmail';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const getUser = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn(),
}));

const clerkClientMock = clerkClient as unknown as ReturnType<typeof vi.fn>;

describe('resolveOwnerEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clerkClientMock.mockResolvedValue({ users: { getUser } } as any);
  });

  it('returns the PRIMARY email when several are on file', async () => {
    getUser.mockResolvedValue({
      primaryEmailAddressId: 'idb',
      emailAddresses: [
        { id: 'ida', emailAddress: 'old@example.com' },
        { id: 'idb', emailAddress: 'primary@example.com' },
      ],
    });

    const res = await resolveOwnerEmail('user_1');

    expect(res).toEqual({ email: 'primary@example.com' });
    expect(getUser).toHaveBeenCalledWith('user_1');
  });

  it('falls back to the first address when the primary id matches nothing', async () => {
    getUser.mockResolvedValue({
      primaryEmailAddressId: 'missing',
      emailAddresses: [
        { id: 'ida', emailAddress: 'first@example.com' },
        { id: 'idb', emailAddress: 'second@example.com' },
      ],
    });

    expect(await resolveOwnerEmail('user_1')).toEqual({ email: 'first@example.com' });
  });

  it('falls back to the first address when there is no primary id at all', async () => {
    getUser.mockResolvedValue({
      emailAddresses: [{ id: 'ida', emailAddress: 'only@example.com' }],
    });

    expect(await resolveOwnerEmail('user_1')).toEqual({ email: 'only@example.com' });
  });

  it('returns an error when the user has no email addresses', async () => {
    getUser.mockResolvedValue({ primaryEmailAddressId: null, emailAddresses: [] });

    const res = await resolveOwnerEmail('user_1');
    expect('error' in res).toBe(true);
    expect((res as any).error).toContain('no email address');
  });

  it('returns an error (never throws) when Clerk throws', async () => {
    getUser.mockRejectedValue(new Error('clerk down'));

    const res = await resolveOwnerEmail('user_1');
    expect('error' in res).toBe(true);
    expect((res as any).error).toContain('clerk down');
  });

  it('returns an error without calling Clerk when the id is empty', async () => {
    const res = await resolveOwnerEmail('');
    expect(res).toEqual({ error: 'no owner id' });
    expect(clerkClientMock).not.toHaveBeenCalled();
  });
});
