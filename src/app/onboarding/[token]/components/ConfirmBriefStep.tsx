'use client';

// Entry step 2 (scale-02 phase 5, D7): user-language playback card + 1-tap
// Confirm + "Not quite right?" businessType chooser. Internal terms (engine/
// archetype/rung) are NEVER rendered — all copy comes from the pure playback
// module. Chooser taps route through applyBusinessTypeCorrection — the ONLY
// sanctioned draft mutation (resets classificationSource/tiebreaker/
// resolvedEngine so a corrected KNOWN type never carries a stale portfolio
// rung into the gate). The server re-runs the gate at confirm (D1 —
// authoritative); this component only follows its verdict.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import type { Brief } from '@/types/brief';
import {
  applyBusinessTypeCorrection,
  LOW_CONFIDENCE_THRESHOLD,
} from '@/modules/brief/classify';
import { playbackSentence, chooserCards } from '@/modules/brief/playback';
import { Button } from '@/components/ui/button';

interface ConfirmBriefStepProps {
  tokenId: string;
  briefDraft: Brief;
  onDraftCorrected: (draft: Brief) => void;
  /** MANUAL path — carries the server's `missing` (or rungA:unclassified for "Something else"). */
  onManual: (missing: string) => void;
}

export default function ConfirmBriefStep({
  tokenId,
  briefDraft,
  onDraftCorrected,
  onManual,
}: ConfirmBriefStepProps) {
  const router = useRouter();
  const lowConfidence = (briefDraft.confidence ?? 0) < LOW_CONFIDENCE_THRESHOLD;
  const [showChooser, setShowChooser] = useState(lowConfidence);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cards = chooserCards();

  const handleChooserTap = (key: (typeof cards)[number]['key']) => {
    if (confirming) return;
    if (key === 'other') {
      // "Something else" ⇒ manual capture directly (D7, rungA:unclassified).
      onManual('rungA:unclassified');
      return;
    }
    // The single sanctioned correction path (D7).
    const corrected = applyBusinessTypeCorrection(briefDraft, key);
    onDraftCorrected(corrected);
    setShowChooser(false);
    setError(null);
  };

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch('/api/brief/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, brief: briefDraft }),
      });
      const json = await res.json();
      if (!res.ok || !json?.outcome) {
        setError(json?.error || 'Something went wrong. Please try again.');
        return;
      }
      if (json.outcome === 'serve' && json.redirectTo) {
        router.push(json.redirectTo);
        return; // keep the spinner during navigation
      }
      onManual(typeof json.missing === 'string' ? json.missing : 'rungA:unclassified');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Here&apos;s what we&apos;ll build
        </h1>
        <p className="mt-2 text-gray-600">Confirm it, or fix it in one tap.</p>
      </div>

      <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-4">
        <p className="text-base text-gray-800">{playbackSentence(briefDraft)}</p>
      </div>

      {showChooser ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800">
            What describes your business best?
          </p>
          <div className="flex flex-wrap gap-2">
            {cards.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => handleChooserTap(card.key)}
                disabled={confirming}
                className="text-sm px-4 py-2 rounded-full bg-gray-100 hover:bg-orange-50
                           hover:text-brand-accentPrimary border border-transparent
                           hover:border-orange-200 transition-all duration-200"
              >
                {card.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowChooser(true)}
          disabled={confirming}
          className="text-sm text-gray-500 underline underline-offset-2 hover:text-brand-accentPrimary
                     transition-colors duration-200"
        >
          Not quite right?
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg
                     transform hover:scale-105 transition-all duration-200"
          size="lg"
        >
          {confirming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Setting up…
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              Looks right — continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
