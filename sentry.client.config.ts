// Sentry init for the browser. Auto-detected and bundled by withSentryConfig.
import * as Sentry from '@sentry/nextjs';
import {
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  SENTRY_TRACES_SAMPLE_RATE,
  sentryBeforeSend,
} from '@/lib/sentryShared';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    // Session Replay: record only sessions that hit an error (replaysOnError),
    // never sample idle sessions (replaysSession: 0). Text/inputs/media masked
    // for privacy. Drop replayIntegration() below to disable replay entirely.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    integrations: [
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    beforeSend: sentryBeforeSend,
  });
}
