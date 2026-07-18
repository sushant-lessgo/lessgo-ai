'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ExternalLink, AlertCircle } from 'lucide-react';

interface Props {
  slug: string;
  domain: string;
  onRemoved: (cooldownUntil: number) => void;
}

export default function LiveStep({ slug, domain, onRemoved }: Props) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (!confirm(`Remove ${domain}? Your Lessgo AI subdomain will become the primary URL again.`)) {
      return;
    }
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch('/api/domains/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to remove domain');
        return;
      }
      const cooldownMs = (data.retryAfter || 60) * 1000;
      onRemoved(Date.now() + cooldownMs);
    } catch {
      setError("Couldn't reach server. Try again.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-3">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 role="status" aria-live="polite" className="font-semibold text-gray-800">
          Your site is live
        </h3>
        <a
          href={`https://${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2 font-mono text-sm"
        >
          {domain}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
        Your Lessgo AI subdomain (<span className="font-mono">{slug}.lessgo.site</span>) now redirects here.
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={remove} disabled={removing}>
          {removing ? 'Removing…' : 'Remove domain'}
        </Button>
      </div>
    </div>
  );
}
