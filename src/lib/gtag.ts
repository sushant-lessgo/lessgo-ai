// app/lib/gtag.ts

export const GA_MEASUREMENT_ID = 'G-DM2YZB9VYG'; // Replace with your actual GA4 ID

// Global declarations for TypeScript
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: Record<string, any>
    ) => void;
    dataLayer: Record<string, any>[];
  }
}

// Track a pageview
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      debug_mode: true,
    });
  }
};

// Track a custom event
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
