'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import DnsRecordRow from './DnsRecordRow';

interface Props {
  slug: string;
  domain: string;
  status: 'pending_dns' | 'issuing_ssl';
  dnsInstructions: { type: string; host: string; value: string };
  onAdvanced: () => void;
  onRemoved: () => void;
}

export default function DnsStep({
  slug,
  domain,
  status,
  dnsInstructions,
  onAdvanced,
  onRemoved,
}: Props) {
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expectedValues, setExpectedValues] = useState<string[] | null>(null);

  const verify = async () => {
    setChecking(true);
    setError(null);
    setMessage(null);
    setExpectedValues(null);
    try {
      const res = await fetch('/api/domains/verify-dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setError(`Checking too fast. Try again in ${data.retryAfter}s.`);
        return;
      }
      if (!res.ok) {
        setError(data.error || data.message || 'Verification failed');
        return;
      }
      if (data.status === 'live') {
        onAdvanced();
        return;
      }
      if (data.status === 'pending_dns' && data.misconfigured) {
        setMessage(
          "DNS isn't pointing to us yet. It can take a few minutes to propagate — try again shortly."
        );
        const expected =
          [...(data.expected?.aValues || []), ...(data.expected?.cnames || [])].filter(Boolean);
        if (expected.length) setExpectedValues(expected);
      }
    } catch {
      setError("Couldn't reach server. Try again.");
    } finally {
      setChecking(false);
    }
  };

  const remove = async () => {
    if (!confirm('Remove this custom domain?')) return;
    try {
      await fetch('/api/domains/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      onRemoved();
    } catch {
      /* noop */
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
          Step 2 of 2
        </div>
        <h3 role="status" aria-live="polite" className="font-semibold text-gray-800">
          Point your DNS to Lessgo
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {status === 'issuing_ssl'
            ? 'DNS looks good. Issuing SSL certificate…'
            : `Add this ${dnsInstructions.type} record at your DNS provider for ${domain}.`}
        </p>
      </div>

      <DnsRecordRow
        cells={[
          { label: 'Type', value: dnsInstructions.type },
          { label: 'Host', value: dnsInstructions.host },
          { label: 'Value', value: dnsInstructions.value },
        ]}
      />

      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {message}
          {expectedValues && expectedValues.length > 0 && (
            <div className="mt-2 text-xs">
              Expected: <span className="font-mono">{expectedValues.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Having trouble? Some registrars block Let&apos;s Encrypt via CAA records. Make sure your CAA
        records allow <code className="font-mono">letsencrypt.org</code>, or remove them entirely.
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={remove}
          className="text-sm text-gray-500 hover:text-red-600 underline-offset-2 hover:underline"
        >
          Remove domain
        </button>
        <Button onClick={verify} disabled={checking}>
          {checking ? 'Checking…' : 'Verify DNS'}
        </Button>
      </div>
    </div>
  );
}
