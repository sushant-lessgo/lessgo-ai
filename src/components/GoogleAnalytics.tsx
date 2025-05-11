// components/GoogleAnalytics.tsx (or your preferred path)
'use client'; // This component uses client-side hooks

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { GA_MEASUREMENT_ID, pageview as trackPageview } from '@/lib/gtag'; // Adjust path to your gtag.ts

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Effect for initial GA4 setup and first pageview
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
      console.warn("GA_MEASUREMENT_ID is missing or window is undefined. Analytics not initialized.");
      return;
    }

    // The Script component below handles loading gtag.js.
    // We need to ensure the initial config is sent once gtag is available.
    // gtag.js itself will create window.gtag and window.dataLayer.
    // The 'js' command initializes dataLayer with the current timestamp.
    // The 'config' command configures the measurement ID and by default sends an initial page_view.
    // However, to have more control for SPAs, we'll set send_page_view: false and call our trackPageview.

    // Define gtag if not already defined by the Script component by the time this effect runs
    // (though Next.js Script strategy should handle this)
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(...args: any[]) { (window.dataLayer as any[]).push(args); };

    window.gtag('js', new Date()); // Initialize dataLayer with current time
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false, // We will manually trigger pageviews for better control in SPAs
      // debug_mode: process.env.NODE_ENV === 'development', // Enable for development builds
    });

    // Send the initial pageview explicitly after config
    const initialUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    console.log(`GA: Initializing and sending first pageview for ${initialUrl}`);
    trackPageview(initialUrl);

  }, []); // Run only once on component mount for initialization

  // Effect to track pageviews on subsequent route changes
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    // The initial pageview is handled by the setup effect.
    // This effect handles client-side navigations.
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    console.log(`GA: Route changed. Sending pageview for ${currentUrl}`);
    trackPageview(currentUrl);

  }, [pathname, searchParams]); // Re-run when path or search params change

  if (!GA_MEASUREMENT_ID) {
    return null; // Don't render script if ID is missing
  }

  return (
    <>
      <Script
        strategy="afterInteractive" // Load script after page becomes interactive
        id="ga-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        onLoad={() => {
          console.log('GA: gtag.js script loaded successfully.');
        }}
        onError={(e) => {
          console.error('GA: Failed to load gtag.js script:', e);
        }}
      />
    </>
  );
}