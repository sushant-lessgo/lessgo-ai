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

  const normalizedUrl = normalizeUrl(value);
  const validation = validateOneLiner(value);
  const isValid = !!normalizedUrl || validation.valid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
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
        <p className="text-xs text-gray-400 text-center mt-2">Takes ~30 seconds</p>
      </div>
    </form>
  );
}
