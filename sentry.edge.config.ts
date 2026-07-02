// Sentry init for the Edge runtime (middleware, edge routes). Loaded via instrumentation.ts.
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
    beforeSend: sentryBeforeSend,
  });
}
