'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import AddDomainForm from './domain/AddDomainForm';
import OwnershipStep from './domain/OwnershipStep';
import DnsStep from './domain/DnsStep';
import LiveStep from './domain/LiveStep';
import FailedStep from './domain/FailedStep';

type DomainStatus =
  | null
  | 'pending_ownership'
  | 'pending_dns'
  | 'issuing_ssl'
  | 'live'
  | 'failed';

interface StatusResponse {
  status: DomainStatus;
  domain: string | null;
  kind: 'apex' | 'subdomain' | null;
  error: string | null;
  ownershipVerified?: boolean;
  dnsInstructions?: { type: string; host: string; value: string };
  ownership?: { txtHost: string; txtValue: string };
}

interface Props {
  slug: string;
  open: boolean;
  onClose: () => void;
}

export default function CustomDomainModal({ slug, open, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatusResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [retryOverride, setRetryOverride] = useState<'ownership' | 'dns' | null>(null);

  const fetchStatus = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/domains/status?slug=${encodeURIComponent(slug)}`, { signal });
        const json = await res.json();
        if (!res.ok) {
          setFetchError(json.error || 'Failed to load status');
          return;
        }
        setData(json as StatusResponse);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setFetchError("Couldn't reach server.");
      } finally {
        setLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    fetchStatus(ctrl.signal);
    return () => ctrl.abort();
  }, [open, fetchStatus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const refresh = () => fetchStatus();

  const handleRemoved = (cooldown?: number) => {
    if (cooldown) setCooldownUntil(cooldown);
    setRetryOverride(null);
    refresh();
  };

  const renderStage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-10 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading…
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {fetchError}
        </div>
      );
    }

    if (!data) return null;

    // Failed state — unless user clicked "Try again" to override
    if (data.status === 'failed' && !retryOverride) {
      return (
        <FailedStep
          slug={slug}
          domain={data.domain || ''}
          error={data.error}
          ownershipVerified={!!data.ownershipVerified}
          onRetry={() =>
            setRetryOverride(data.ownershipVerified ? 'dns' : 'ownership')
          }
          onStartOver={() => {
            setRetryOverride(null);
            refresh();
          }}
        />
      );
    }

    const effectiveStatus = retryOverride
      ? retryOverride === 'dns'
        ? 'pending_dns'
        : 'pending_ownership'
      : data.status;

    if (effectiveStatus === null) {
      return (
        <AddDomainForm
          slug={slug}
          cooldownUntil={cooldownUntil}
          onAdded={refresh}
        />
      );
    }

    if (effectiveStatus === 'pending_ownership') {
      if (!data.ownership || !data.domain) return null;
      return (
        <OwnershipStep
          slug={slug}
          domain={data.domain}
          ownership={data.ownership}
          onAdvanced={() => {
            setRetryOverride(null);
            refresh();
          }}
          onRemoved={() => handleRemoved()}
        />
      );
    }

    if (effectiveStatus === 'pending_dns' || effectiveStatus === 'issuing_ssl') {
      if (!data.dnsInstructions || !data.domain) return null;
      return (
        <DnsStep
          slug={slug}
          domain={data.domain}
          status={effectiveStatus}
          dnsInstructions={data.dnsInstructions}
          onAdvanced={() => {
            setRetryOverride(null);
            refresh();
          }}
          onRemoved={() => handleRemoved()}
        />
      );
    }

    if (effectiveStatus === 'live') {
      if (!data.domain) return null;
      return (
        <LiveStep
          slug={slug}
          domain={data.domain}
          onRemoved={(cooldown) => handleRemoved(cooldown)}
        />
      );
    }

    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="font-bold text-gray-800">Custom Domain</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{renderStage()}</div>
      </div>
    </div>
  );
}
