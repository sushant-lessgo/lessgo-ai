'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface AnalyticsContextValue {
  pageSlug: string;
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({
  children,
  pageSlug,
}: {
  children: ReactNode;
  pageSlug: string;
}) {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(eventName, {
        page_slug: pageSlug,
        ...properties,
      });
    }
  };

  return (
    <AnalyticsContext.Provider value={{ pageSlug, trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Return noop functions if not in analytics context (e.g., edit mode)
    return {
      pageSlug: '',
      trackEvent: () => {},
    };
  }
  return context;
}
