import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { PLAN_CONFIGS, PlanTier } from '@/lib/planManager'
import AppSidebar, { type SidebarPlan } from '@/components/dashboard/AppSidebar'
import DashboardTopBar from '@/components/dashboard/DashboardTopBar'
import { DialogHost } from '@/components/ui/ConfirmDialog'
import { ToastProvider } from '@/components/ui/toast'

/**
 * Dashboard shell (dashboard-workspace-ia phase 1) — sidebar + top bar chrome for
 * every `/dashboard/*` screen. Before this, all 9 dashboard pages rendered their
 * own `<Header/>`; those call sites were removed in the same phase, so chrome
 * renders exactly once.
 *
 * 🚨 `.app-chrome` IS ATTACHED HERE AND ONLY HERE. It sets inherited Onest/ink/
 * canvas defaults, so it must never reach generated template markup. That is why
 * the blog SSR preview (`/dashboard/blog/{slug}/{postId}/preview`) deliberately
 * lives OUTSIDE this folder in the `(blog-preview)` root route group — same URL,
 * no shell. Never attach `.app-chrome` to <body>, /p/*, /preview/*, or the editor
 * canvas (src/components/ui/README.md "Attach rules").
 *
 * NOT an auth boundary: Clerk middleware handles authn and each page owner-scopes
 * its own query. This layout only fetches chrome display data.
 *
 * Dialog + toast hosts are mounted HERE, once, for every `/dashboard/*` screen
 * (dashboard-lifecycle-actions DD6). `<DialogHost />` is load-bearing, not
 * decoration: with no host mounted, `confirmDialog()`/`promptDialog()` silently
 * fall back to native `window.confirm`/`prompt` (ConfirmDialog.tsx:42-58) — the
 * destructive lifecycle actions would still "work", just unstyled and
 * unautomatable, so its absence fails silently rather than loudly.
 * Both are client components; this layout stays a server component (Next inserts
 * the boundary at the import).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()

  const profile = {
    name: user?.fullName ?? user?.firstName ?? 'Your account',
    email: user?.primaryEmailAddress?.emailAddress ?? '',
    avatarUrl: user?.imageUrl ?? null,
  }

  // Plan widget data (R6): real numbers or nothing — never fabricate.
  //
  // 🚨 THIS READ MUST STAY READ-ONLY — do NOT "simplify" it to `getUserPlan()`.
  // `getUserPlan()` is get-OR-CREATE: on a missing row it calls createDefaultPlan(),
  // which writes a UserPlan AND seeds the one-time FREE credit pool (a once-ever,
  // non-refilling grant — see planManager.createDefaultPlan). This layout renders on
  // EVERY /dashboard/* page, so using it would make passive chrome silently mutate
  // billing state. No row → `plan` stays undefined → the widget greys with em-dashes
  // (R14: real or absent, never fabricated).
  // Both reads below are Clerk-id-keyed (UserPlan.userId and PublishedPage.userId
  // are BOTH Clerk ids) — no cross-ID-space join.
  let plan: SidebarPlan | undefined
  if (user?.id) {
    const [userPlan, used] = await Promise.all([
      prisma.userPlan.findUnique({ where: { userId: user.id }, select: { tier: true } }),
      prisma.publishedPage.count({ where: { userId: user.id } }),
    ])
    const config = userPlan ? PLAN_CONFIGS[userPlan.tier as PlanTier] : undefined
    if (config) {
      plan = { planName: config.name, used, limit: config.limits.publishedPages }
    }
  }

  return (
    <ToastProvider>
      <div className="app-chrome flex h-screen w-full overflow-hidden">
        <AppSidebar profile={profile} plan={plan} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopBar />
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
        {/* Sibling of the scroll container, not inside it: the dialog is a fixed
            full-viewport overlay and must not be clipped by `overflow-y-auto`. */}
        <DialogHost />
      </div>
    </ToastProvider>
  )
}
