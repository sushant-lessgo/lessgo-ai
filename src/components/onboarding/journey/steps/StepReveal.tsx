'use client';

// ============================================================================
// STEP 06 — the reveal. FULLY AGNOSTIC.
//
// The magic moment: the REAL generated site, first look. Token-based and
// engine-free — it takes NO props at all (not even the seam). Engine #2
// inherits this file verbatim.
//
// ── LANDMINE 1 — WHY AN IFRAME, AND WHY IT IS NOT NEGOTIABLE ────────────────
// The journey chrome wraps everything in `.app-chrome` (JourneyShell), which
// carries the APP's fonts + design tokens. Template output must NEVER live
// under that scope: app fonts would bleed into the site, so the editor would
// render differently from the published page — the dual-renderer divergence
// class this codebase's #1 architectural trap is named after.
//
// An iframe is a SEPARATE DOCUMENT. `.app-chrome` is not merely "not applied";
// it is structurally unable to reach in — no CSS scope, no cascade, no
// inherited font-family crosses the boundary. That is the whole mechanism, and
// it is why the rule is stated negatively:
//
//     THERE MUST NEVER BE A NON-IFRAME RENDERING OF SITE CONTENT IN THE SHELL.
//
// Do not "optimise" this into a direct <LandingPageRenderer/>, a portal, or a
// shadow root to save the extra document load. Each of those puts template
// output back under `.app-chrome`.
//
// ── NO PUBLISH SURFACE (handoff ruling) ─────────────────────────────────────
// The reveal IS the review; the only way forward is the editor. The embedded
// route is `/preview/{token}?chrome=0`, which renders the site and nothing else
// — no action bar, no Publish, no domain modal (absent from the DOM, not
// hidden; the e2e asserts count = 0 inside the iframe). Do not add a publish
// action here.
// ============================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardStore } from '@/hooks/useWizardStore';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { cn } from '@/lib/utils';

type Viewport = 'desktop' | 'phone';

/** Handoff phone width. Desktop = whatever the column gives us. */
const PHONE_WIDTH = 390;

// Takes no props: the reveal is token-based and engine-free, so it ignores the
// shared step signature's `seam` entirely (a zero-arg component is still
// assignable to it). That is the clearest possible statement of "engine #2
// inherits this verbatim".
export default function StepReveal() {
  const router = useRouter();
  const tokenId = useWizardStore((s) => s.tokenId);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [loaded, setLoaded] = useState(false);

  // Unreachable in the journey (the shell hydrates the token before any step
  // body mounts), but the reveal is the one step that CANNOT degrade to a blank
  // box — it is the conversion point.
  if (!tokenId) {
    return (
      <div data-testid="step-reveal" data-journey-step={6}>
        <p className="font-app-sans text-sm text-app-danger">
          We couldn&apos;t open your site. Please refresh and try again.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="step-reveal" data-journey-step={6} className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-app-success/25
                     bg-app-success-bg px-3 py-1 font-app-sans text-[11.5px] font-semibold
                     text-app-success"
        >
          <AppIcon name="celebration" size={15} />
          Ready
        </span>
        <h1 className="font-app-sans text-xl font-bold tracking-tight text-app-ink">
          Meet your site.
        </h1>
        <span className="flex-1" />
        <SegmentedControl
          aria-label="Preview size"
          data-testid="reveal-viewport"
          value={viewport}
          onValueChange={(v) => setViewport(v as Viewport)}
          options={[
            { value: 'desktop', label: 'Desktop', icon: 'desktop_windows' },
            { value: 'phone', label: 'Phone', icon: 'smartphone' },
          ]}
        />
      </div>

      {/* The site, in its own document. */}
      <div className="relative flex justify-center rounded-app-card bg-app-canvas p-3">
        {!loaded && (
          <p
            role="status"
            data-testid="reveal-loading"
            className="absolute inset-0 flex items-center justify-center font-app-sans text-sm text-app-muted"
          >
            Opening your site…
          </p>
        )}
        {/*
          INTERIM TARGET: generate + reveal + preview are consolidating onto the
          edit route (preview becomes an editor mode toggle; `/preview` retires) —
          future editor-track work. When that lands, this iframe src moves to the
          editor preview surface, along with the X-Frame-Options SAMEORIGIN rule
          in next.config.js that makes the framing possible.
        */}
        <iframe
          data-testid="reveal-frame"
          title="Your site"
          src={`/preview/${tokenId}?chrome=0`}
          onLoad={() => setLoaded(true)}
          style={viewport === 'phone' ? { width: PHONE_WIDTH } : undefined}
          className={cn(
            'h-[68vh] min-h-[420px] rounded-app-card border border-app-hairline bg-white',
            'transition-opacity duration-300',
            viewport === 'desktop' && 'w-full',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      {/* The ONLY forward path. No publish — see the header. */}
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="cta"
          data-testid="reveal-open-editor"
          onClick={() => router.push(`/edit/${tokenId}`)}
        >
          <AppIcon name="tune" size={18} className="mr-1.5" />
          Open the editor
        </Button>
      </div>
    </div>
  );
}
