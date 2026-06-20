'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Catches errors thrown in the root layout. Must render its own <html>/<body>.
export default function GlobalError({
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
    <html>
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 0,
          padding: '24px',
          textAlign: 'center',
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
      </body>
    </html>
  );
}
