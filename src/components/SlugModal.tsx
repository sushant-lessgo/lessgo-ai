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
  existingPublished?: {
    slug: string;
    title: string;
    publishedAt: string;
  } | null;
};

export function SlugModal({
  slug,
  onChange,
  onCancel,
  onConfirm,
  loading,
  error,
  existingPublished
}: SlugModalProps) {
  const fullUrl = `https://${slug}.lessgo.ai`;
  const [isChangingSlug, setIsChangingSlug] = useState(false);

  // Detect if user changes slug from existing
  useEffect(() => {
    if (existingPublished && slug !== existingPublished.slug) {
      setIsChangingSlug(true);
    } else {
      setIsChangingSlug(false);
    }
  }, [slug, existingPublished]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold mb-2">
          {existingPublished ? 'Republish Your Page' : 'Choose your page URL'}
        </h2>

        {existingPublished && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-1">
              <strong>Currently published at:</strong>
            </p>
            <p className="text-sm font-mono text-blue-900 break-all">
              https://{existingPublished.slug}.lessgo.ai
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Last updated: {new Date(existingPublished.publishedAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {isChangingSlug && existingPublished && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Warning: Changing URL</p>
                <p className="text-xs text-amber-700 mt-1">
                  Your old URL (https://{existingPublished.slug}.lessgo.ai) will stop working.
                  Any links you've shared will break. Only change if necessary.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          {existingPublished ? 'Keep existing URL or change to new one:' : 'This is how your link will appear:'}
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
            {loading
              ? 'Publishing...'
              : existingPublished
                ? (isChangingSlug ? 'Change URL & Republish' : 'Update Published Page')
                : 'Confirm & Publish'
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
