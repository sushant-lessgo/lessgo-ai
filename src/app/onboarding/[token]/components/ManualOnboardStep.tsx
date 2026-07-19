'use client';

// Demand-capture FORM (scale-02 phase 5, spec §5/§11.11) — reused as the inner
// form of the D5 demand board (engineDecider Phase 5). The screen chrome (honest
// storefront headline, live-read rail, "go back") lives in D5DemandBoard; this
// component is JUST the email/phone capture + confirmed state + fast-track.
//
// The screen is the same for no-coverage, out-of-icp, place/quick-yes and any
// serve-gate `manual` outcome; only the internal `missing` tag in the payload
// differs and is never rendered raw. Exception (scale-10 phase 3): a
// `collection:<key>` tag adds ONE graceful, readable sentence (registry label,
// never the raw tag) so a portfolio/services lead sees a reason.
//
// ⚠ API CONTRACT — DO NOT REGRESS (engineDecider Phase 5): the POST body
// (`{input, briefDraft, missing, email, phone?}`) and the PATCH fast-track
// (`{id, fasttrack:true}`) are byte-identical to the scale-02 implementation.
// `userId` is derived SERVER-SIDE from Clerk auth — never sent in the body.
// Submit ⇒ POST /api/demand-lead (returns {id}); thank-you offers the "Need it
// sooner?" fast-track ⇒ PATCH {id, fasttrack:true} (spec §11.11 double-intent).

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Brief } from '@/types/brief';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCollectionDef } from '@/modules/collections/registry';

interface ManualOnboardStepProps {
  rawInput: string;
  briefDraft: Brief;
  missing: string;
  leadId: string | null;
  onLeadCreated: (id: string) => void;
}

/**
 * Graceful, user-facing reason for a missing-collection demand tag (scale-10
 * phase 3). `missing` is a comma-joined tag string; `collection:<key>` tags mean
 * "we don't yet build <label> pages for sites like yours". Returns a readable
 * sentence, or null when no collection tag is present (screen stays identical to
 * the out-of-icp/no-coverage case). Internal tag values are never rendered raw.
 */
function collectionReason(missing: string): string | null {
  const labels = missing
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.startsWith('collection:'))
    .map((t) => getCollectionDef(t.slice('collection:'.length))?.label)
    .filter((l): l is string => !!l);
  if (labels.length === 0) return null;
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  return `We're still building ${list} pages for businesses like yours — that's exactly what we want to hear.`;
}

export default function ManualOnboardStep({
  rawInput,
  briefDraft,
  missing,
  leadId,
  onLeadCreated,
}: ManualOnboardStepProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fasttracking, setFasttracking] = useState(false);
  const [fasttracked, setFasttracked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const submitted = !!leadId;
  const reason = collectionReason(missing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/demand-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: rawInput,
          briefDraft,
          missing,
          email: email.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.id) {
        setError(json?.error || 'Something went wrong. Please try again.');
        return;
      }
      onLeadCreated(json.id);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFasttrack = async () => {
    if (!leadId || fasttracking || fasttracked) return;
    setFasttracking(true);
    setError(null);
    try {
      const res = await fetch('/api/demand-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, fasttrack: true }),
      });
      const json = await res.json();
      if (!res.ok || !json?.fasttrack) {
        setError(json?.error || 'Something went wrong. Please try again.');
        return;
      }
      setFasttracked(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setFasttracking(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4" data-testid="demand-confirmed">
        <div className="rounded-app-panel border border-app-border-hairline bg-app-surface p-4">
          <p className="font-app-sans font-bold text-[15px] text-app-ink">
            You&apos;re on the list
          </p>
          <p className="mt-1 font-app-sans text-[13px] text-app-muted">
            {fasttracked
              ? 'Sushant will reach out shortly to personalize.'
              : 'Not automated yet — someone from Lessgo AI will reach out shortly.'}
          </p>
        </div>

        {!fasttracked && (
          <button
            type="button"
            data-testid="demand-fasttrack"
            onClick={handleFasttrack}
            disabled={fasttracking}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-[11px] border-[1.5px] border-app-border-hairline bg-app-surface px-4 py-3 font-app-sans font-bold text-[13.5px] text-app-ink transition-colors hover:border-app-primary/40 disabled:opacity-60"
          >
            {fasttracking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                One sec…
              </>
            ) : (
              'Need it sooner?'
            )}
          </button>
        )}

        {error && <p className="text-xs text-app-danger">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {reason && (
        <p className="font-app-sans text-[13px] text-app-muted">{reason}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="lead-email" className="font-app-sans text-[12.5px] text-app-slate">
          Email <span className="text-app-danger">*</span>
        </Label>
        <Input
          id="lead-email"
          data-testid="demand-email"
          type="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          disabled={submitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-phone" className="font-app-sans text-[12.5px] text-app-slate">
          Phone <span className="text-app-placeholder">(optional)</span>
        </Label>
        <Input
          id="lead-phone"
          data-testid="demand-phone"
          type="tel"
          inputMode="tel"
          placeholder="+91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={submitting}
          maxLength={50}
        />
      </div>

      {error && <p className="text-xs text-app-danger">{error}</p>}

      <button
        type="submit"
        data-testid="demand-submit"
        disabled={!emailValid || submitting}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-[11px] bg-app-cta px-4 py-3 font-app-sans font-bold text-[13.5px] text-white shadow-app-btn-cta transition-opacity disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending…
          </>
        ) : (
          'Keep me posted & call me'
        )}
      </button>
    </form>
  );
}
