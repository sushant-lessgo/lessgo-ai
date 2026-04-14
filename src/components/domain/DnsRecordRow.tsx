'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Cell {
  label: string;
  value: string;
}

interface Props {
  cells: Cell[];
}

function CopyCell({ label, value }: Cell) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-mono text-gray-800">
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copy ${label}`}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50',
            copied && 'text-green-600 border-green-300'
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function DnsRecordRow({ cells }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-2 rounded-lg border border-gray-200 bg-white p-3">
      {cells.map((c) => (
        <CopyCell key={c.label} {...c} />
      ))}
    </div>
  );
}
