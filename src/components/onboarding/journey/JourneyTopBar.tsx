'use client';

// ============================================================================
// JourneyTopBar — the journey's 58px chrome bar. FULLY AGNOSTIC.
//
// Knows no engine: logo, "New site", centered dot progress (steps 2–6), and a
// right slot. Copy strings here are universal (per the STEP 01 copy ruling);
// per-engine content lives behind the seam and never reaches this file.
//
// Glyphs are restricted to the CURRENT committed Material Symbols subset
// (`public/fonts/material-symbols-rounded/icons.txt`) until P3 does the icon
// pass — a glyph outside the subset renders as its raw ligature TEXT.
// `check` is in the subset.
// ============================================================================

import Logo from '@/components/shared/Logo';
import { AppIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { JourneyStep } from './engines/types';

/** The dot-progress rail: the journey's resumable steps, in order. */
const JOURNEY_STEPS: JourneyStep[] = [2, 3, 4, 5, 6];

export interface JourneyTopBarProps {
  /** Current step; `null` ⇒ no dot progress (STEP 01, pre-confirm). */
  step: JourneyStep | null;
  /** Right-hand slot (P5 puts "Building…" here). Defaults to Save & exit. */
  right?: React.ReactNode;
  onExit?: () => void;
}

export default function JourneyTopBar({ step, right, onExit }: JourneyTopBarProps) {
  return (
    <div className="h-[58px] flex-none bg-white border-b border-app-hairline flex items-center px-5 gap-3.5">
      <Logo size={22} />
      <span className="w-px h-[22px] bg-app-divider" aria-hidden />
      <span className="font-app-sans font-semibold text-[12.5px] text-app-muted">
        New site
      </span>

      {step !== null && (
        <nav
          aria-label="Progress"
          className="flex-1 flex items-center justify-center gap-[7px]"
        >
          {JOURNEY_STEPS.map((s, i) => (
            <JourneyDot
              key={s}
              index={i}
              position={s}
              current={step}
              showConnector={i > 0}
            />
          ))}
        </nav>
      )}
      {step === null && <div className="flex-1" />}

      {right ?? (
        <button
          type="button"
          onClick={onExit}
          className="font-app-sans font-semibold text-[12.5px] text-app-muted hover:text-app-ink transition-colors duration-200"
        >
          Save &amp; exit
        </button>
      )}
    </div>
  );
}

function JourneyDot({
  index,
  position,
  current,
  showConnector,
}: {
  index: number;
  position: JourneyStep;
  current: JourneyStep;
  showConnector: boolean;
}) {
  const done = position < current;
  const active = position === current;
  return (
    <>
      {showConnector && (
        <span
          aria-hidden
          className={cn('w-10 h-0.5', done || active ? 'bg-app-primary' : 'bg-app-divider')}
        />
      )}
      <span
        data-testid={`journey-dot-${position}`}
        data-state={done ? 'done' : active ? 'active' : 'todo'}
        aria-current={active ? 'step' : undefined}
        className={cn(
          'flex items-center justify-center rounded-full',
          done && 'w-[22px] h-[22px] bg-app-primary text-white',
          active &&
            'w-[26px] h-[26px] bg-app-primary text-white font-app-sans font-bold text-xs',
          !done && !active && 'w-[9px] h-[9px] bg-app-placeholder'
        )}
      >
        {done && <AppIcon name="check" size={15} className="text-white" />}
        {active && index + 1}
      </span>
    </>
  );
}
