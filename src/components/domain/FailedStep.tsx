'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  slug: string;
  domain: string;
  error: string | null;
  ownershipVerified: boolean;
  onRetry: () => void;
  onStartOver: () => void;
}

export default function FailedStep({
  slug,
  domain,
  error,
  ownershipVerified,
  onRetry,
  onStartOver,
}: Props) {
  const [starting, setStarting] = useState(false);

  const startOver = async () => {
    if (!confirm('Remove this domain and start over?')) return;
    setStarting(true);
    try {
      await fetch('/api/domains/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      onStartOver();
    } catch {
      /* noop */
    } finally {
      setStarting(false);
    }
  };

  const retryLabel = ownershipVerified ? 'Retry DNS setup' : 'Retry ownership verification';

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
        <div className="flex-1">
          <h3 role="status" aria-live="polite" className="font-semibold text-red-900">
            Setup failed for <span className="font-mono">{domain}</span>
          </h3>
          <p className="text-sm text-red-800 mt-1">
            {formatError(error)}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        {ownershipVerified
          ? 'Ownership is verified. Re-check your DNS records and try again.'
          : 'Re-check the TXT record at your DNS provider and try again.'}
      </p>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={startOver}
          disabled={starting}
          className="text-sm text-gray-500 hover:text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Start over with a different domain
        </button>
        <Button onClick={onRetry}>{retryLabel}</Button>
      </div>
    </div>
  );
}

function formatError(code: string | null): string {
  if (!code) return 'Unknown error';
  if (code === 'dns_regression') return 'DNS records no longer match what we expect.';
  if (code === 'dns_misconfigured') return "DNS isn't pointing to us correctly.";
  if (code.startsWith('vercel_conflict')) return 'This domain is attached to another project.';
  if (code === 'txt_mismatch') return "Couldn't find the TXT ownership record.";
  return code.replace(/_/g, ' ');
}
