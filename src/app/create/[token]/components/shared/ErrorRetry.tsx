'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorRetryProps {
  title?: string;
  message: string;
  onRetry: () => void;
  retryLabel?: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
}

export default function ErrorRetry({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  onSecondary,
  secondaryLabel,
}: ErrorRetryProps) {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">{message}</p>
      <div className="flex flex-col gap-3 items-center">
        <Button onClick={onRetry} variant="outline">
          {retryLabel}
        </Button>
        {onSecondary && secondaryLabel && (
          <Button onClick={onSecondary} variant="ghost" className="text-gray-500">
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
