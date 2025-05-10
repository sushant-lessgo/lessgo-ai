export const GA_MEASUREMENT_ID = 'G-DM2YZB9VYG';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Helper function to safely call gtag
export const safeGtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
    return true;
  }
  console.warn('⚠️ gtag not available for call:', args);
  return false;
};

// Track pageview
export const pageview = (url: string) => {
  return safeGtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    debug_mode: true
  });
};

// Track event
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
  return safeGtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    debug_mode: true,
  });
};