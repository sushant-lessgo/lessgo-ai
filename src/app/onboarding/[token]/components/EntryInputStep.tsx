'use client';

// Entry step 1 (scale-02 phase 5): ONE field accepting a one-liner OR a URL.
// URL-like input ⇒ POST /api/v2/scrape-website {url, entry:true}; plain text
// ⇒ POST /api/v2/understand {oneLiner, entry:true}. Both return
// { success, data, briefDraft, creditsUsed } (phase 3). URL detection +
// one-liner validation + loading/error conventions are copied from the
// product wizard's OneLinerStep (src/app/onboarding/product/[token]/
// components/steps/OneLinerStep.tsx) — do not invent new patterns.

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Brief } from '@/types/brief';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { trackFailure } from '@/utils/trackTelemetry';
import { parseInsufficientCredits } from '@/lib/billing/insufficientCredits';
import { CREDIT_COSTS } from '@/lib/creditCosts';

/** Hostname-only (privacy: never emit the full URL). null for the text path. */
function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const examples = [
  'AI note taker for sales calls',
  'Growth marketing agency for SaaS startups',
  'Leadership coaching for first-time managers',
];

/** Normalize user input to an http(s) URL; returns null if not URL-like.
 *  (OneLinerStep's normalizeUrl pattern, verbatim.) */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // A multi-word sentence is a description, not a URL, even if it contains a dot.
  if (/\s/.test(trimmed)) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    // Require a dot in the host so "foo" isn't treated as a site.
    if (!u.hostname.includes('.')) return null;
    return u.href;
  } catch {
    return null;
  }
}

/** OneLinerStep's validation, verbatim (gibberish/min-length guards). */
function validateOneLiner(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();

  if (trimmed.length < 10) return { valid: false, error: 'Min 10 characters' };

  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) return { valid: false, error: 'Describe in at least 2 words' };

  if (/^(.)\1{5,}$/.test(trimmed.replace(/\s/g, ''))) {
    return { valid: false, error: 'Please enter a real description' };
  }

  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  if (uniqueWords.size === 1 && words.length > 1) {
    return { valid: false, error: 'Please use different words' };
  }

  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length >= 20) {
    const vowelCount = (lettersOnly.match(/[aeiouAEIOU]/g) || []).length;
    const vowelRatio = vowelCount / lettersOnly.length;
    const hasWordWithVowel = words.some((word) => /[aeiouAEIOU]/.test(word));
    if (vowelRatio < 0.12 && !hasWordWithVowel) {
      return { valid: false, error: 'Please use real words' };
    }
  }

  return { valid: true };
}

interface EntryInputStepProps {
  onSuccess: (rawInput: string, briefDraft: Brief) => void;
}

export default function EntryInputStep({ onSuccess }: EntryInputStepProps) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // billing-beta phase 4 — a credit block is NOT a scrape failure. Before this,
  // a 402 fell through to the generic "Couldn't read that site…" copy below:
  // misleading (it read the site fine — the user just has no credits) and it
  // pointed at no way out.
  const [creditsBlocked, setCreditsBlocked] = useState<{
    required?: number;
    available?: number;
  } | null>(null);

  const normalizedUrl = normalizeUrl(value);
  const validation = validateOneLiner(value);
  const isValid = !!normalizedUrl || validation.valid;

  // billing-beta phase 7 — surface this step's spend at the affordance. The submit
  // runs the URL path (/api/v2/scrape-website ⇒ SCRAPE_WEBSITE) or the text path
  // (/api/v2/understand ⇒ UNDERSTAND); the cost tracks whichever route this input
  // will hit. Number always from CREDIT_COSTS, never a literal.
  const actionCost = normalizedUrl
    ? CREDIT_COSTS.SCRAPE_WEBSITE
    : CREDIT_COSTS.UNDERSTAND;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    setCreditsBlocked(null);
    try {
      const isUrl = !!normalizedUrl;
      const res = await fetch(isUrl ? '/api/v2/scrape-website' : '/api/v2/understand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isUrl
            ? { url: normalizedUrl, entry: true }
            : { oneLiner: value.trim(), entry: true }
        ),
      });
      const json = await res.json();
      if (!res.ok || !json?.success || !json?.briefDraft) {
        // data-capture phase 4 — scrape/understand failure (fire-and-forget,
        // side-effect-only). These v2 routes DO pre-check credits and emit a
        // Pattern A 402 before doing any work (scrape-website:239,360;
        // understand:174), so a 402 is a credit block, NOT a scrape failure —
        // the `!== 402` guard deliberately keeps those out of 'scrape_failed'
        // so the funnel isn't corrupted by blocks the user never got to try.
        // The credits notice below is rendered instead. audienceType is
        // unresolved at the unified entry step (serve gate runs later) ⇒ null;
        // templateId is not known yet ⇒ null.
        if (res.status !== 402) {
          trackFailure('scrape_failed', {
            reason: json?.error ?? json?.message ?? null,
            provider: json?.provider ?? null,
            sourceUrl_host: hostOf(normalizedUrl),
            audienceType: null,
            templateId: null,
          });
        }
        // billing-beta phase 4 — credit block ⇒ a credits notice, not the generic
        // failure copy. Read the numbers through the normalizer: these routes
        // answer Pattern A, whose message/numbers the ad-hoc `json?.message`
        // fallback below reads inconsistently across emitters.
        const blocked = parseInsufficientCredits(res.status, json);
        if (blocked) {
          setCreditsBlocked(blocked);
          return;
        }
        setError(
          json?.message ||
            (isUrl
              ? "Couldn't read that site. Try describing your business in a sentence instead."
              : "Couldn't understand that. Try rephrasing in a sentence.")
        );
        return;
      }
      onSuccess(isUrl ? normalizedUrl : value.trim(), json.briefDraft as Brief);
    } catch {
      // data-capture phase 4 — transport/parse failure (no server code available).
      trackFailure('scrape_failed', {
        reason: 'network_error',
        provider: null,
        sourceUrl_host: hostOf(normalizedUrl),
        audienceType: null,
        templateId: null,
      });
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isValid) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          What are you building a page for?
        </h1>
        <p className="mt-2 text-gray-600">
          Describe your business in a sentence — or paste your website URL.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="entry-input" className="text-gray-700">
          One-liner or website URL <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="entry-input"
          placeholder="Growth marketing agency for SaaS startups — or yourcompany.com"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
            if (creditsBlocked) setCreditsBlocked(null);
          }}
          onKeyDown={handleKeyDown}
          className="min-h-[100px]"
          maxLength={500}
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-red-500">
            {!isValid && value.length > 0 ? validation.error : ''}
          </p>
          <p className="text-xs text-gray-400">{value.length}/500</p>
        </div>
        {normalizedUrl && (
          <p className="text-xs text-gray-500">
            Looks like a website — we&apos;ll read it and pull your copy + testimonials.
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setValue(ex)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-orange-50
                         hover:text-brand-accentPrimary border border-transparent
                         hover:border-orange-200 transition-all duration-200"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Credit block — the ONLY honest thing to say here, plus a way out.
          Stock utilities on purpose: this wizard step is entirely stock-Tailwind
          (Label/Textarea/Button above), and a lone app-* island would render
          off-palette. Numbers are omitted when the route sent none. */}
      {creditsBlocked && (
        <div
          data-testid="entry-credits-notice"
          className="rounded-lg border border-orange-200 bg-orange-50 p-3"
        >
          <p className="text-xs text-gray-700">
            {typeof creditsBlocked.required === 'number' &&
            typeof creditsBlocked.available === 'number' ? (
              <>
                Not enough credits — this needs {creditsBlocked.required} credit
                {creditsBlocked.required === 1 ? '' : 's'} and you have{' '}
                {creditsBlocked.available} left.
              </>
            ) : (
              <>You don&apos;t have enough credits left for this.</>
            )}
          </p>
          <a
            href="/dashboard/billing"
            className="mt-1 inline-block text-xs font-semibold text-brand-accentPrimary underline"
          >
            Get more credits
          </a>
        </div>
      )}

      <div>
        <Button
          type="submit"
          disabled={!isValid || loading}
          className="w-full bg-brand-accentPrimary hover:bg-orange-500 hover:shadow-lg
                     transform hover:scale-105 transition-all duration-200"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              {normalizedUrl ? 'Reading your site…' : 'Understanding…'}
            </>
          ) : (
            'Continue'
          )}
        </Button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Takes ~30 seconds · Costs {actionCost} credit{actionCost === 1 ? '' : 's'}
        </p>
      </div>
    </form>
  );
}
