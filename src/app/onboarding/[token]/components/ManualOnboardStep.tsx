'use client';

// Entry step 3 (scale-02 phase 5, spec §5/§11.11): MANUAL-ONBOARD demand
// capture. Screen is the same for no-coverage and out-of-icp; the internal
// `missing` tag in the payload differs and is never rendered raw. Exception
// (scale-10 phase 3): a `collection:<key>` tag adds ONE graceful, readable
// sentence (registry label, never the raw tag) so a portfolio/services lead
// sees a reason.
// Submit ⇒ POST /api/demand-lead (returns {id}); thank-you offers the
// "Need it sooner?" fast-track ⇒ PATCH {id, fasttrack:true} ⇒ message
// upgrades (spec §11.11 double-intent signal).

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Brief } from '@/types/brief';
import { Button } from '@/components/ui/button';
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            You&apos;re on the list
          </h1>
          <p className="mt-2 text-gray-600">
            {fasttracked
              ? 'Sushant will connect with you shortly to personalize.'
              : 'Not automated yet — someone from Lessgo AI will connect with you shortly.'}
          </p>
        </div>

        {!fasttracked && (
          <Button
            type="button"
            onClick={handleFasttrack}
            disabled={fasttracking}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {fasttracking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                One sec…
              </>
            ) : (
              'Need it sooner?'
            )}
          </Button>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          We&apos;ve got you — almost
        </h1>
        <p className="mt-2 text-gray-600">
          Not automated yet — someone from Lessgo AI will connect with you shortly.
        </p>
        {reason && <p className="mt-2 text-sm text-gray-500">{reason}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-email" className="text-gray-700">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lead-email"
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

      <div className="space-y-2">
        <Label htmlFor="lead-phone" className="text-gray-700">
          Phone <span className="text-gray-400">(optional)</span>
        </Label>
        <Input
          id="lead-phone"
          type="tel"
          inputMode="tel"
          placeholder="+91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={submitting}
          maxLength={50}
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div>
        <Button
          type="submit"
          disabled={!emailValid || submitting}
          className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg
                     transform hover:scale-105 transition-all duration-200"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Sending…
            </>
          ) : (
            'Keep me posted'
          )}
        </Button>
      </div>
    </form>
  );
}
