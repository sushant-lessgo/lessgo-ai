import { AppIcon } from '@/components/ui/icon'
import NewPostButton from './NewPostButton'

/**
 * BlogFirstRun — handoff TURN 4 ("Add a blog to {project}"), rendered when the site IS
 * published but has ZERO posts.
 *
 * 🚨 ENABLEMENT IS DERIVED, NOT STORED (plan ruling #1): `enabled ⇔ ≥1 BlogPost`. There is
 * no `Project.blogEnabled` column and this component must not invent one — writing post #1
 * IS the enable action, and `publishBlogPost` only writes the public `/blog` index on
 * publish, so 0 posts genuinely means no public blog.
 *
 * ⚠️ ACCEPTED WART: deleting the LAST post drops the manager back to THIS screen. That is
 * the derived model showing through, not a bug to patch here — it is asserted head-on in
 * `e2e/blog-manager.spec.ts` so it can never regress silently into a broken half-state.
 *
 * Server component. Phase 4 adds a "Write a post with AI" CTA BESIDE the manual one below.
 */
export default function BlogFirstRun({
  tokenId,
  projectName,
  host,
}: {
  tokenId: string
  projectName: string
  /** Published subdomain host — used to show where the blog will live. */
  host: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-app-card border border-app-border bg-app-surface px-6 py-[58px] text-center">
      <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[12px] bg-app-tint">
        <AppIcon name="article" size={24} className="text-app-primary" />
      </span>

      <h2 className="font-app-sans text-[16px] font-bold text-app-ink">
        Add a blog to {projectName}
      </h2>
      <p className="max-w-[420px] font-app-sans text-[12.5px] leading-[1.6] text-app-body">
        Write posts that live on your own site. Your first post turns the blog on — it appears
        at{' '}
        <span className="font-app-mono text-[11.5px] text-app-slate">{host}/blog</span> the
        moment you publish it.
      </p>

      <div className="mt-2 flex items-center gap-2.5">
        <NewPostButton tokenId={tokenId} variant="hero" />
      </div>
    </div>
  )
}
