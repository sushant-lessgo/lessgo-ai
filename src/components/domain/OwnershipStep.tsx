'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import DnsRecordRow from './DnsRecordRow';

interface Props {
  slug: string;
  domain: string;
  ownership: { txtHost: string; txtValue: string };
  onAdvanced: () => void;
  onRemoved: () => void;
}

export default function OwnershipStep({ slug, domain, ownership, onAdvanced, onRemoved }: Props) {
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    setChecking(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/domains/verify-ownership', {
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
      if (data.status === 'pending_dns') {
        onAdvanced();
        return;
      }
      if (data.status === 'pending_ownership') {
        if (data.error === 'txt_mismatch' || data.error === 'ENOTFOUND' || data.error === 'dns_error') {
          setMessage("We couldn't find the TXT record yet. DNS can take a few minutes — try again shortly.");
          return;
        }
        setMessage(data.error || "Couldn't verify yet.");
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
          Step 1 of 2
        </div>
        <h3 role="status" aria-live="polite" className="font-semibold text-gray-800">
          Verify you own <span className="font-mono text-gray-900">{domain}</span>
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Add this TXT record at your DNS provider. We&apos;ll check once you&apos;re done.
        </p>
      </div>

      <DnsRecordRow
        cells={[
          { label: 'Type', value: 'TXT' },
          { label: 'Host', value: ownership.txtHost },
          { label: 'Value', value: ownership.txtValue },
        ]}
      />

      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={remove}
          className="text-sm text-gray-500 hover:text-red-600 underline-offset-2 hover:underline"
        >
          Remove domain
        </button>
        <Button onClick={verify} disabled={checking}>
          {checking ? 'Checking…' : 'Verify ownership'}
        </Button>
      </div>
    </div>
  );
}
