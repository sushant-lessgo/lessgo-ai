// lib/gtag.ts (or your preferred path)

export const GA_MEASUREMENT_ID = 'G-DM2YZB9VYG'; // Ensure this is your correct Measurement ID

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Initialize dataLayer and gtag if they don't exist.
// This allows queuing of commands before gtag.js is fully loaded.
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(...args) { (window.dataLayer as any[]).push(args); };
}

// Helper function to safely call gtag
export const safeGtag = (...args: any[]): boolean => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
    return true;
  }
  console.warn('⚠️ gtag not available or not a function for call:', args);
  return false;
};

/**
 * Tracks a pageview in GA4.
 * In SPAs, this should be called on every route change.
 * The 'config' command also sends a page_view by default, but explicitly calling
 * it or re-sending config with page_path ensures accuracy for SPAs.
 * @param url - The path of the page to track (e.g., /about, /products/widget).
 */
export const pageview = (url: string): boolean => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('⚠️ GA_MEASUREMENT_ID is not defined. Pageview not sent.');
    return false;
  }
  // For SPAs, re-sending 'config' with the new page_path is a common way to log page views.
  // This will also update the page context for subsequent events.
  return safeGtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    // 'debug_mode': process.env.NODE_ENV === 'development', // Optional: enable for dev
  });
};

/**
 * Tracks a custom event in GA4.
 * @param action - The name of the event (e.g., 'login', 'purchase', 'email_submitted').
 * @param params - An object of additional parameters to send with the event.
 */
export const event = ({
  action,
  params,
}: {
  action: string; // This is your GA4 event name
  params?: { [key: string]: string | number | boolean | undefined };
}): boolean => {
  if (!GA_MEASUREMENT_ID) {
    console.warn(`⚠️ GA_MEASUREMENT_ID is not defined. Event "${action}" not sent.`);
    return false;
  }
  return safeGtag('event', action, {
    // 'debug_mode': process.env.NODE_ENV === 'development', // Optional: enable for dev
    ...params,
    // 'send_to': GA_MEASUREMENT_ID, // Usually not needed if config is correct, but can ensure it goes to the right property.
  });
};