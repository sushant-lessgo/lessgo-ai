'use client';

import { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  messages: string[];
  messageInterval?: number;  // Default 800ms
  skeletonCount?: number;    // Default 3
  className?: string;
}

/**
 * Reusable loading overlay component with rotating messages.
 * Pattern from UnderstandingStep.
 */
export default function LoadingOverlay({
  messages,
  messageInterval = 800,
  skeletonCount = 3,
  className = '',
}: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, messageInterval);
    return () => clearInterval(interval);
  }, [messages.length, messageInterval]);

  return (
    <div className={`flex flex-col items-center justify-center py-16 space-y-6 ${className}`}>
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-accentPrimary rounded-full animate-spin" />

      {/* Rotating message */}
      <p className="text-gray-600 animate-pulse">{messages[messageIndex]}</p>

      {/* Skeleton cards */}
      <div className="w-full max-w-sm space-y-3">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
