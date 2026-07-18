import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import TransferOwnershipControl from '@/components/admin/TransferOwnershipControl';
import {
  businessTypes,
  businessTypeKeys,
  type BusinessTypeKey,
} from '@/modules/businessTypes/config';
import { fit } from '@/modules/templates/fit';
import { templateIds } from '@/types/service';
import { serveabilityMatrix, type ServeMatrixRow } from '@/modules/brief/serveMatrix';

export const dynamic = 'force-dynamic';

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().slice(0, 16).replace('T', ' ');
}

function shortId(id: string | null | undefined, len = 10): string {
  if (!id) return '—';
  return id.length > len ? id.slice(0, len) + '…' : id;
}

function truncate(s: string | null | undefined, n = 80): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default async function AdminPage() {
  const { userId } = await auth();
  if (!isAdmin(userId)) notFound();

  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [users, projects, published, demandLeads] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        title: true,
        inputText: true,
        updatedAt: true,
        createdAt: true,
        token: { select: { value: true } },
        user: { select: { email: true, clerkId: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    }),
    prisma.publishedPage.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        userId: true,
        updatedAt: true,
        lastPublishAt: true,
        publishState: true,
        views: true,
        projectId: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    }),
    prisma.demandLead.findMany({
      take: 500,
      orderBy: [{ fasttrack: 'desc' }, { createdAt: 'desc' }],
    }),
  ]);

  // Demand-board grouping (briefDraft is Json — can't groupBy in SQL, group in JS).
  const missingTagCounts = new Map<string, number>();
  const businessTypeCounts = new Map<string, number>();
  const engineCounts = new Map<string, number>();
  for (const lead of demandLeads) {
    for (const tag of lead.missing.split(',').map((t) => t.trim()).filter(Boolean)) {
      missingTagCounts.set(tag, (missingTagCounts.get(tag) ?? 0) + 1);
    }
    const draft = lead.briefDraft as any;
    const bt = typeof draft?.businessType === 'string' ? draft.businessType : '(none)';
    businessTypeCounts.set(bt, (businessTypeCounts.get(bt) ?? 0) + 1);
    const engine =
      typeof draft?.facts?.entry?.resolvedEngine === 'string'
        ? draft.facts.entry.resolvedEngine
        : '(none)';
    engineCounts.set(engine, (engineCounts.get(engine) ?? 0) + 1);
  }
  const rankedMissing = [...missingTagCounts.entries()].sort((a, b) => b[1] - a[1]);
  const rankedBusinessTypes = [...businessTypeCounts.entries()].sort((a, b) => b[1] - a[1]);
  const rankedEngines = [...engineCounts.entries()].sort((a, b) => b[1] - a[1]);
  const fasttrackCount = demandLeads.filter((l) => l.fasttrack).length;

  const clerkIds = users.map((u) => u.clerkId);

  const [plans, usage, subsByPage, publishedLastWeek, submissionsThisMonth] = await Promise.all([
    prisma.userPlan.findMany({
      where: { userId: { in: clerkIds } },
      select: {
        userId: true,
        tier: true,
        status: true,
        stripeCustomerId: true,
        currentPeriodEnd: true,
        trialEnd: true,
      },
    }),
    prisma.userUsage.findMany({
      where: { userId: { in: clerkIds }, period },
      select: {
        userId: true,
        fullPageGens: true,
        sectionRegens: true,
        elementRegens: true,
        fieldInference: true,
        totalTokens: true,
      },
    }),
    prisma.formSubmission.groupBy({
      by: ['publishedPageId'],
      _count: { _all: true },
      where: { publishedPageId: { in: published.map((p) => p.id) } },
    }),
    prisma.publishedPage.count({
      where: { lastPublishAt: { gte: weekAgo } },
    }),
    prisma.formSubmission.count({
      where: { createdAt: { gte: monthStart } },
    }),
  ]);

  const planByClerk = new Map(plans.map((p) => [p.userId, p]));
  const usageByClerk = new Map(usage.map((u) => [u.userId, u]));
  const emailByClerk = new Map(users.map((u) => [u.clerkId, u.email]));
  const subsByPageId = new Map(
    subsByPage.map((s) => [s.publishedPageId ?? '', s._count._all])
  );

  const payingCount = plans.filter((p) => p.tier !== 'FREE' && p.status === 'active').length;
  const activeThisMonth = usage.length;

  const userOptions = users.map((u) => ({ clerkId: u.clerkId, email: u.email }));

  // Business-type config panel (read-only; editing entries is a code deploy —
  // frozen-enum philosophy). Serveability is the REAL gate: serveabilityMatrix()
  // runs decideServe per businessType × likelyIntent, so this table can never
  // disagree with the live gate (serve-gate-v2 phase 3). The caps column still
  // uses the pure `fit()` helper to flag which requiredCapability is unbacked
  // (e.g. photographer → gallery).
  const intentsByType = new Map<BusinessTypeKey, ServeMatrixRow[]>();
  for (const row of serveabilityMatrix()) {
    const list = intentsByType.get(row.businessType) ?? [];
    list.push(row);
    intentsByType.set(row.businessType, list);
  }
  const businessTypeRows = businessTypeKeys.map((key) => {
    const entry = businessTypes[key];
    // engineDecider R2 — union-aware. Committed types have a single copyEngine;
    // ambiguous types (designer/agency) defer to D4, so use priorEngine for the
    // capability-backing probe and show `ask (candidates)` in the engine column.
    const probeEngine =
      entry.engineState === 'committed' ? entry.copyEngine : entry.priorEngine;
    const engineLabel =
      entry.engineState === 'committed'
        ? entry.copyEngine
        : `ask (${entry.candidateEngines.join('/')})`;
    const missingCaps = entry.requiredCapabilities.filter(
      (cap) => !templateIds.some((t) => fit(t, probeEngine, [cap]))
    );
    return { entry, engineLabel, missingCaps, intents: intentsByType.get(key) ?? [] };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-slate-600 mt-1">
            {users.length} users · {payingCount} paying · {activeThisMonth} active this month ·{' '}
            {published.length} published ({publishedLastWeek} last 7d) · {submissionsThisMonth} submissions this month
          </p>
        </header>

        {/* USERS */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Users ({users.length})
          </h2>
          <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Clerk ID</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Stripe</th>
                  <th className="px-3 py-2 text-right">Projects</th>
                  <th className="px-3 py-2 text-right">Gens ({period})</th>
                  <th className="px-3 py-2 text-right">Regens</th>
                  <th className="px-3 py-2 text-right">Tokens</th>
                  <th className="px-3 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const plan = planByClerk.get(u.clerkId);
                  const usg = usageByClerk.get(u.clerkId);
                  const regens = (usg?.sectionRegens ?? 0) + (usg?.elementRegens ?? 0);
                  return (
                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">{u.email ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500" title={u.clerkId}>
                        {shortId(u.clerkId, 16)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            plan?.tier && plan.tier !== 'FREE'
                              ? 'inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-semibold'
                              : 'text-slate-400 text-xs'
                          }
                        >
                          {plan?.tier ?? 'FREE'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {plan?.status ?? '—'}
                        {plan?.status === 'past_due' && ' ⚠️'}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {plan?.stripeCustomerId ? '✓' : '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{u._count.projects}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{usg?.fullPageGens ?? 0}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{regens}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-xs text-slate-500">
                        {usg?.totalTokens?.toLocaleString() ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(u.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* PROJECTS */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Projects ({projects.length}, most recent 200)
          </h2>
          <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Input</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Links</th>
                  <th className="px-3 py-2">Transfer</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{p.title ?? '(untitled)'}</td>
                    <td className="px-3 py-2 text-xs text-slate-600" title={p.inputText ?? ''}>
                      {truncate(p.inputText, 80)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500" title={p.user?.clerkId ?? 'orphan'}>
                      {p.user?.email ?? (p.user?.clerkId ? shortId(p.user.clerkId, 14) : 'orphan')}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(p.updatedAt)}</td>
                    <td className="px-3 py-2 text-xs">
                      <Link
                        href={`/preview/${p.token.value}`}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        preview
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <TransferOwnershipControl
                        token={p.token.value}
                        currentOwnerClerkId={p.user?.clerkId ?? null}
                        users={userOptions}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* PUBLISHED */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Published Pages ({published.length})
          </h2>
          <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">State</th>
                  <th className="px-3 py-2 text-right">Views</th>
                  <th className="px-3 py-2 text-right">Submissions</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Last Publish</th>
                  <th className="px-3 py-2">Links</th>
                </tr>
              </thead>
              <tbody>
                {published.map((p) => {
                  const subs = subsByPageId.get(p.id) ?? 0;
                  return (
                    <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs">{p.slug}</td>
                      <td className="px-3 py-2">{p.title ?? '—'}</td>
                      <td className="px-3 py-2 text-xs">
                        <span
                          className={
                            p.publishState === 'published'
                              ? 'text-emerald-700'
                              : p.publishState === 'failed'
                              ? 'text-red-700'
                              : 'text-slate-500'
                          }
                        >
                          {p.publishState}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.views}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {subs > 0 ? (
                          <span className="font-semibold text-emerald-700">{subs}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500" title={p.userId}>
                        {emailByClerk.get(p.userId) ?? shortId(p.userId, 14)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {fmtDate(p.lastPublishAt ?? p.updatedAt)}
                      </td>
                      <td className="px-3 py-2 text-xs space-x-2">
                        <Link
                          href={`/p/${p.slug}`}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          live
                        </Link>
                        <Link
                          href={`/dashboard/analytics/${p.slug}`}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          analytics
                        </Link>
                        {subs > 0 && (
                          <Link
                            href={`/dashboard/forms/${p.slug}`}
                            target="_blank"
                            className="text-blue-600 hover:underline"
                          >
                            forms
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* DEMAND BOARD */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Demand Board ({demandLeads.length} leads · {fasttrackCount} fast-track)
          </h2>

          {demandLeads.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-6 text-sm text-slate-500">
              No demand leads yet.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Blocked-on counts (ranked by missing tag) */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Blocked on</th>
                        <th className="px-3 py-2 text-right">Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedMissing.map(([tag, count]) => (
                        <tr key={tag} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono text-xs">{tag}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Business-type counts */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Business type</th>
                        <th className="px-3 py-2 text-right">Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedBusinessTypes.map(([bt, count]) => (
                        <tr key={bt} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-2 text-xs">{bt}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Engine counts */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                      <tr>
                        <th className="px-3 py-2">Engine</th>
                        <th className="px-3 py-2 text-right">Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedEngines.map(([engine, count]) => (
                        <tr key={engine} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-3 py-2 text-xs">{engine}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lead table — fasttrack rows pinned to top by the query orderBy */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Input</th>
                      <th className="px-3 py-2">Missing</th>
                      <th className="px-3 py-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandLeads.map((l) => (
                      <tr
                        key={l.id}
                        className={
                          l.fasttrack
                            ? 'border-t border-slate-100 bg-amber-50 hover:bg-amber-100'
                            : 'border-t border-slate-100 hover:bg-slate-50'
                        }
                      >
                        <td className="px-3 py-2 text-xs">
                          {l.fasttrack && (
                            <span className="inline-block rounded bg-amber-200 text-amber-900 px-2 py-0.5 text-xs font-semibold mr-2">
                              FAST TRACK
                            </span>
                          )}
                          {l.status}
                        </td>
                        <td className="px-3 py-2 font-medium">{l.email}</td>
                        <td className="px-3 py-2 text-xs text-slate-600" title={l.input}>
                          {truncate(l.input, 80)}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600">{l.missing}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(l.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* BUSINESS TYPES (read-only config) */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Business Types ({businessTypeRows.length}) — config, read-only
          </h2>
          <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Engine</th>
                  <th className="px-3 py-2">Required capabilities</th>
                  <th className="px-3 py-2">Structure</th>
                  <th className="px-3 py-2">Voice hint</th>
                  <th className="px-3 py-2">Serveability</th>
                </tr>
              </thead>
              <tbody>
                {businessTypeRows.map(({ entry, engineLabel, missingCaps, intents }) => (
                  <tr key={entry.key} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs">{entry.key}</td>
                    <td className="px-3 py-2">{entry.label}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">{engineLabel}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">
                      {entry.requiredCapabilities.length > 0
                        ? entry.requiredCapabilities.map((cap) => (
                            <span
                              key={cap}
                              className={
                                missingCaps.includes(cap)
                                  ? 'inline-block rounded bg-red-100 text-red-800 px-1.5 py-0.5 mr-1 font-semibold'
                                  : 'inline-block rounded bg-slate-100 text-slate-700 px-1.5 py-0.5 mr-1'
                              }
                            >
                              {cap}
                            </span>
                          ))
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{entry.structureDefault}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">
                      {entry.voiceHint ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex flex-col gap-1">
                        {intents.map(({ intent, decision }) => (
                          <div key={intent} className="flex items-center gap-2">
                            <span className="font-mono text-slate-500 min-w-[7rem]">{intent}</span>
                            {decision.outcome === 'serve' ? (
                              <span className="inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-semibold">
                                serve → {decision.templateId}
                              </span>
                            ) : (
                              <span className="inline-block rounded bg-red-100 text-red-800 px-2 py-0.5 font-semibold font-mono">
                                {decision.missing}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
