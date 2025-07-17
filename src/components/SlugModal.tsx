'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

type SlugModalProps = {
  slug: string;
  onChange: (val: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  error?: string;
};

export function SlugModal({
  slug,
  onChange,
  onCancel,
  onConfirm,
  loading,
  error
}: SlugModalProps) {
  const fullUrl = `https://${slug}.lessgo.ai`;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-2">Choose your page URL</h2>
        <p className="text-sm text-gray-600 mb-4">
          This is how your link will appear:
        </p>
        <div className="text-sm mb-3">
          <div className="flex items-center">
            <span className="text-gray-500">https://</span>
            <Input
              className="inline mx-1 min-w-0 flex-1"
              value={slug}
              onChange={(e) =>
                onChange(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
                )
              }
            />
            <span className="text-gray-500">.lessgo.ai</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

        <div className="flex justify-end mt-6 gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading || !slug}>
            {loading ? 'Publishing...' : 'Confirm & Publish'}
          </Button>
        </div>
      </div>
    </div>
  );
}
