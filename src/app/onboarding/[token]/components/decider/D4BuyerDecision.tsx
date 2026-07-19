'use client';

// D4 — "Buyer-decision question" (engineDecider Phase 4). The KEY screen.
//
// Fires when the engine is genuinely undetermined (`engineStatus:'ambiguous'` —
// an ambiguous registry type like designer/agency/manufacturer, OR an unknown
// type with no tiebreaker signal). Instead of guessing, we ask ONE plain-language
// question: "When someone lands on your site, what makes them reach out?" and let
// the user pick how their buyers decide. The prior (best guess) is pre-selected.
//
// The pick is written by `applyEnginePick` in page.tsx (this screen only reports
// the choice up via `onPick`); place/quick-yes are "SOON" (dashed) and route to
// the demand board — they are NEVER written to `brief.copyEngine`.
//
// Prior derivation: the collapsed `EntryFacts` stores `resolvedEngine:null` for
// an `ask` — it does NOT persist the candidates/prior. So we RE-DERIVE the
// resolution client-side from the same pure inputs (`businessType` + tiebreaker)
// via `resolveEngine` — code decides, never AI. Firewall: pure `@/modules/brief`
// + agnostic rail field + lucide only; no template/generation/seam graph.

import { useState } from 'react';
import { ArrowRight, BadgeCheck, Boxes, Images, Store, Zap } from 'lucide-react';
import type { Brief } from '@/types/brief';
import type { ResolvedEngine } from '@/modules/brief/classify';
import { getEntryFacts, resolveEngine } from '@/modules/brief/classify';
import { EngineRailField } from '@/components/onboarding/journey/UnderstoodRail';
import JourneyTopBar from '@/components/onboarding/journey/JourneyTopBar';
import { cn } from '@/lib/utils';

/** The 5 buyer-decision options. `line` is the plain user-facing sentence (kept
 *  verbatim per the spec); `soon` engines (place/quick-yes) route to demand. */
const OPTIONS: {
  engine: ResolvedEngine;
  line: string;
  noun: string;
  icon: React.ReactNode;
  soon?: boolean;
}[] = [
  {
    engine: 'work',
    line: 'They see my work and love it.',
    noun: 'your work',
    icon: <Images className="w-[18px] h-[18px]" />,
  },
  {
    engine: 'trust',
    line: 'They trust my experience & track record.',
    noun: 'your experience',
    icon: <BadgeCheck className="w-[18px] h-[18px]" />,
  },
  {
    engine: 'thing',
    line: 'They understand what my product does.',
    noun: 'your product',
    icon: <Boxes className="w-[18px] h-[18px]" />,
  },
  {
    engine: 'place',
    line: 'They see my space, menu, or location.',
    noun: 'your place',
    icon: <Store className="w-[18px] h-[18px]" />,
    soon: true,
  },
  {
    engine: 'quick-yes',
    line: 'They already know me — I just need them to act.',
    noun: 'one clear ask',
    icon: <Zap className="w-[18px] h-[18px]" />,
    soon: true,
  },
];

interface D4BuyerDecisionProps {
  briefDraft: Brief;
  /** The user's pick → page.tsx runs `applyEnginePick` + routes by engine. */
  onPick: (engine: ResolvedEngine) => void;
}

export default function D4BuyerDecision({ briefDraft, onPick }: D4BuyerDecisionProps) {
  const facts = getEntryFacts(briefDraft);

  // Re-derive the resolution (candidates + prior) client-side — the collapsed
  // EntryFacts doesn't persist them (resolvedEngine is null for an `ask`). Same
  // pure inputs, same code path: never AI.
  const resolution = resolveEngine({
    businessTypeGuess: briefDraft.businessType ?? null,
    tiebreaker: facts?.tiebreaker ?? 'none',
  });
  const prior: ResolvedEngine | null =
    resolution.state === 'ask' ? resolution.prior : resolution.engine;

  const [selected, setSelected] = useState<ResolvedEngine | null>(prior);
  const selectedNoun = OPTIONS.find((o) => o.engine === selected)?.noun;

  return (
    <div className="app-chrome fixed inset-0 flex flex-col bg-app-canvas">
      <JourneyTopBar step={null} right={<span />} />

      <div className="flex-1 min-h-0 overflow-auto flex">
        {/* Live-read rail (LEFT — matches the work journey's rail convention). */}
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
                {facts?.summary || facts?.oneLiner || '—'}
              </span>
            </div>
            {/* Ambiguous engine field — amber "could go two ways". */}
            <EngineRailField engine={{ status: 'ambiguous' }} />
          </div>
        </aside>

        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-[radial-gradient(120%_90%_at_50%_-6%,#eef4ff_0%,#fcfcfd_58%)]">
          <div data-testid="decider-d4" className="w-full max-w-[560px] flex flex-col">
            <div className="self-center inline-flex items-center gap-1.5 rounded-app-pill bg-[#fbf1e0] px-2.5 py-1 font-app-mono font-bold text-[10px] tracking-[0.08em] text-[#c47d1a]">
              COULD GO TWO WAYS
            </div>

            <h1 className="mt-4 text-center font-app-sans font-extrabold text-[27px] leading-[1.2] tracking-[-0.8px] text-app-ink">
              When someone lands on your site, what makes them reach out?
            </h1>
            <p className="mt-2.5 text-center font-app-sans text-[14px] text-app-muted max-w-[440px] self-center">
              Pick the closest — you can change it any time before we build.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              {OPTIONS.map((o) => {
                const isSelected = selected === o.engine;
                const isPrior = prior === o.engine;
                return (
                  <button
                    key={o.engine}
                    type="button"
                    data-testid={`decider-d4-option-${o.engine}`}
                    data-soon={o.soon ? 'true' : 'false'}
                    aria-pressed={isSelected}
                    onClick={() => setSelected(o.engine)}
                    className={cn(
                      'rounded-app-panel px-4 py-3.5 flex items-center gap-3 text-left transition-colors',
                      o.soon
                        ? 'border-[1.5px] border-dashed'
                        : 'border-[1.5px]',
                      isSelected
                        ? 'border-app-primary bg-app-tint'
                        : o.soon
                          ? 'border-[#f0dcb4] bg-[#fdf7ec] hover:border-[#e6c98f]'
                          : 'border-app-border-hairline bg-app-surface hover:border-app-primary/40'
                    )}
                  >
                    <span
                      className={cn(
                        'flex-none w-[34px] h-[34px] rounded-full flex items-center justify-center',
                        isSelected
                          ? 'bg-app-primary text-white'
                          : 'bg-app-track text-app-muted'
                      )}
                    >
                      {o.icon}
                    </span>
                    <span className="min-w-0 flex flex-col">
                      <span className="font-app-sans font-semibold text-[14.5px] text-app-ink">
                        {o.line}
                      </span>
                      {isPrior && (
                        <span className="font-app-sans text-[12px] text-app-primary mt-0.5">
                          Our best guess from your description
                        </span>
                      )}
                    </span>
                    {o.soon ? (
                      <span className="flex-none ml-auto rounded-[5px] bg-[#fbf1e0] px-1.5 py-0.5 font-app-mono font-bold text-[9.5px] tracking-[0.06em] text-[#c47d1a]">
                        SOON
                      </span>
                    ) : (
                      isSelected && <ArrowRight className="flex-none ml-auto w-4 h-4 text-app-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              data-testid="decider-d4-continue"
              disabled={!selected}
              onClick={() => selected && onPick(selected)}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-[11px] bg-app-cta px-4 py-3 font-app-sans font-bold text-[13.5px] text-white shadow-app-btn-cta disabled:opacity-50"
            >
              {selectedNoun ? `Continue with ${selectedNoun}` : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
