'use client';

// D5 — the DEMAND BOARD (engineDecider Phase 5). The honest "we don't build this
// yet" storefront for the two engines we have not shipped (place / quick-yes) AND
// for any serve-gate `manual` outcome (an unserveable confirmed Brief, incl. the
// `engine-unresolved` defect path). Never a cold waitlist, never a dead-end: we
// LOG the demand (→ /api/demand-lead, which also emails the founder) and offer a
// fast-track call.
//
// It NEVER writes `brief.copyEngine` — place/quick-yes stay off the schema enum
// (guarded upstream by `applyEnginePick`). This screen only PRESENTS; it reads
// the resolved engine for the rail/headline and reuses ManualOnboardStep's
// byte-identical demand-lead POST/PATCH.
//
// "Go back" reopens D4 so the visitor can re-pick how buyers decide — the engine
// is a revisable belief. Hidden once the lead is logged (nothing to revise).
//
// Firewall: pure `@/modules/brief` + the agnostic rail field + lucide only. No
// template/generation/seam graph — D5 is dynamically imported (ssr:false) by
// page.tsx like the other decider screens.

import { ArrowLeft, Store } from 'lucide-react';
import type { Brief } from '@/types/brief';
import type { ResolvedEngine } from '@/modules/brief/classify';
import { getEntryFacts } from '@/modules/brief/classify';
import { EngineRailField } from '@/components/onboarding/journey/UnderstoodRail';
import JourneyTopBar from '@/components/onboarding/journey/JourneyTopBar';
import { ENGINE_LEAD } from './engineCopy';
import ManualOnboardStep from '../ManualOnboardStep';

interface D5DemandBoardProps {
  rawInput: string;
  briefDraft: Brief;
  missing: string;
  leadId: string | null;
  onLeadCreated: (id: string) => void;
  /** "Go back" → reopens D4 (the engine is a revisable belief). */
  onGoBack: () => void;
}

/** A readable business/place noun for the honest headline (never a raw tag). */
function businessNoun(brief: Brief): string | null {
  const bt = brief.businessType?.trim();
  if (bt) return bt.replace(/[-_]/g, ' ');
  const cat = getEntryFacts(brief)?.categories?.[0]?.trim();
  if (cat) return cat.replace(/[-_]/g, ' ');
  return null;
}

/** The short demand tag surfaced in the rail chip (#PLACE …). Derived from the
 *  resolved engine, else the first `rungE:<engine>` tag, else a neutral fallback. */
function demandChipTag(engine: ResolvedEngine | null, missing: string): string {
  if (engine) return engine.toUpperCase();
  const rungE = missing
    .split(',')
    .map((t) => t.trim())
    .find((t) => t.startsWith('rungE:'));
  if (rungE) return rungE.slice('rungE:'.length).toUpperCase();
  return 'DEMAND';
}

export default function D5DemandBoard({
  rawInput,
  briefDraft,
  missing,
  leadId,
  onLeadCreated,
  onGoBack,
}: D5DemandBoardProps) {
  const facts = getEntryFacts(briefDraft);
  const engine = (facts?.resolvedEngine ?? null) as ResolvedEngine | null;
  const noun = businessNoun(briefDraft);
  const headline = noun
    ? `We don’t build ${noun} sites yet — but we’re close.`
    : 'We don’t build this kind of site yet — but we’re close.';
  // Neutral engine card: how the site WOULD win, so the visitor sees the intent
  // is understood even though we can’t build it yet. Falls back to `place`.
  const lead = engine ? ENGINE_LEAD[engine] : ENGINE_LEAD.place;
  const chipTag = demandChipTag(engine, missing);
  const submitted = !!leadId;

  return (
    <div className="app-chrome fixed inset-0 flex flex-col bg-app-canvas">
      <JourneyTopBar step={null} right={<span />} />

      <div className="flex-1 min-h-0 overflow-auto flex">
        {/* Live-read rail (LEFT — matches the decider convention): neutral engine
            card + amber "DEMAND LOGGED" chip. */}
        <aside className="w-[320px] flex-none bg-app-surface-sunken border-r border-app-border-frame flex flex-col">
          <div className="flex-none px-[22px] pt-5 pb-3.5">
            <div className="font-app-mono font-bold text-[10px] tracking-[0.11em] text-app-faint">
              WHAT WE UNDERSTOOD
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto px-[22px]">
            <div className="py-[11px] border-t border-app-hairline">
              <div className="font-app-mono font-semibold text-[10px] tracking-[0.06em] text-app-faint mb-1.5">
                WHAT YOU DO
              </div>
              <span className="font-app-sans font-medium text-[13px] text-app-slate">
                {facts?.summary || facts?.oneLiner || rawInput || '—'}
              </span>
            </div>
            <EngineRailField
              engine={{
                status: 'known',
                label: lead.label,
                descriptor: lead.descriptor,
                icon: lead.icon,
                demandTag: chipTag,
                // NEUTRAL grey card — the demand is LOGGED, not built; it must
                // not read as the confident blue "we're building this" card.
                neutral: true,
              }}
            />
          </div>
        </aside>

        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-[radial-gradient(120%_90%_at_50%_-6%,#fdf7ec_0%,#fcfcfd_58%)]">
          <div
            data-testid="decider-d5"
            className="w-full max-w-[520px] rounded-app-modal border-[1.5px] border-[#f0dcb4] bg-[#fdf7ec] p-8 shadow-app-float"
          >
            <div className="inline-flex items-center gap-1.5 rounded-app-pill bg-[#fbf1e0] px-2.5 py-1 font-app-mono font-bold text-[10px] tracking-[0.08em] text-[#c47d1a]">
              <Store className="w-3 h-3" />
              COMING SOON
            </div>

            <h1 className="mt-4 font-app-sans font-extrabold text-[26px] leading-[1.2] tracking-[-0.7px] text-app-ink">
              {headline}
            </h1>
            <p className="mt-2.5 font-app-sans text-[14px] text-app-muted">
              Leave your email and we&rsquo;ll tell you the moment it&rsquo;s
              ready — Lessgo AI can hop on a quick call to make sure it&rsquo;s
              right for you.
            </p>

            <div className="mt-6">
              {/* Reused, byte-identical demand-lead capture (contract unchanged). */}
              <ManualOnboardStep
                rawInput={rawInput}
                briefDraft={briefDraft}
                missing={missing}
                leadId={leadId}
                onLeadCreated={onLeadCreated}
              />
            </div>

            {!submitted && (
              <button
                type="button"
                data-testid="decider-d5-back"
                onClick={onGoBack}
                className="mt-5 inline-flex items-center gap-1.5 font-app-sans font-semibold text-[12.5px] text-app-muted hover:text-app-ink transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Actually, it&rsquo;s something else
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
