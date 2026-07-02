// Next.js instrumentation hook. Requires experimental.instrumentationHook on
// Next 14 (see next.config.js). Loads the right Sentry init per runtime.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Auto-captures errors thrown in nested React Server Components / route handlers.
export { captureRequestError as onRequestError } from '@sentry/nextjs';
