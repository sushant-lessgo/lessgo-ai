'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Catches errors thrown in route segments (renders inside the root layout).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '24px',
        textAlign: 'center',
        gap: '8px',
      }}
    >
      <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Something went wrong</h1>
      <p style={{ color: '#666', maxWidth: '420px' }}>
        An unexpected error occurred. The team has been notified.
      </p>
      <button
        onClick={() => reset()}
        style={{
          marginTop: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          background: '#111',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
