const API_BASE = 'https://api.vercel.com';

function env() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !projectId) {
    throw new VercelApiError('config', 'VERCEL_TOKEN or VERCEL_PROJECT_ID not set', 500);
  }
  return { token, projectId, teamId };
}

function teamQuery(teamId?: string): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
}

export class VercelApiError extends Error {
  constructor(
    public code: 'config' | 'unauthorized' | 'not_found' | 'conflict' | 'forbidden' | 'rate_limited' | 'server' | 'network' | 'unknown',
    message: string,
    public status: number,
    public body?: any
  ) {
    super(message);
    this.name = 'VercelApiError';
  }
}

async function vercelFetch(path: string, init: RequestInit = {}): Promise<any> {
  const { token } = env();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
  } catch (e: any) {
    throw new VercelApiError('network', e?.message || 'network_error', 0);
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* no-body */
  }

  if (res.ok) return body;

  const code: VercelApiError['code'] =
    res.status === 401 ? 'unauthorized'
    : res.status === 403 ? 'forbidden'
    : res.status === 404 ? 'not_found'
    : res.status === 409 ? 'conflict'
    : res.status === 429 ? 'rate_limited'
    : res.status >= 500 ? 'server'
    : 'unknown';

  throw new VercelApiError(code, body?.error?.message || res.statusText || 'vercel_api_error', res.status, body);
}

export interface VercelDomainConfig {
  misconfigured: boolean;
  acceptedChallenges?: string[];
  aValues?: string[];
  cnames?: string[];
  nameservers?: string[];
}

/**
 * Attach a domain to the project.
 * Assumes ownership already verified via TXT — we only call this AFTER our challenge passes.
 */
export async function addDomain(name: string): Promise<{ name: string; verified: boolean; createdAt?: number }> {
  const { projectId, teamId } = env();
  return await vercelFetch(`/v10/projects/${encodeURIComponent(projectId)}/domains${teamQuery(teamId)}`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function getDomainConfig(name: string): Promise<VercelDomainConfig> {
  const { projectId, teamId } = env();
  return await vercelFetch(
    `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(name)}/config${teamQuery(teamId)}`,
    { method: 'GET' }
  );
}

export async function removeDomain(name: string): Promise<void> {
  const { projectId, teamId } = env();
  await vercelFetch(
    `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(name)}${teamQuery(teamId)}`,
    { method: 'DELETE' }
  );
}

let apexCache: { ip: string; fetchedAt: number } | null = null;
const APEX_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the A record IP Vercel expects for apex domains.
 * Cached 24h in-memory. Falls back to Vercel's documented static IP.
 */
export async function getApexIp(): Promise<string> {
  if (apexCache && Date.now() - apexCache.fetchedAt < APEX_TTL_MS) return apexCache.ip;
  try {
    const { teamId } = env();
    const res = await vercelFetch(`/v6/domains/lessgo.ai/config${teamQuery(teamId)}`, { method: 'GET' });
    const ip = Array.isArray(res?.aValues) && res.aValues[0] ? String(res.aValues[0]) : '76.76.21.21';
    apexCache = { ip, fetchedAt: Date.now() };
    return ip;
  } catch {
    return '76.76.21.21';
  }
}
