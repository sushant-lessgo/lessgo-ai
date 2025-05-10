// app/components/GoogleAnalytics.tsx
'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_MEASUREMENT_ID} from '@/lib/gtag';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isGtagLoaded, setIsGtagLoaded] = useState(false);

  // Create a custom debug log function
  const debug = (message: string, data?: any) => {
    console.log(`📊 GA4 Debug: ${message}`, data || '');
  };

  // Define gtag function to window explicitly once scripts have loaded
  const setupGtag = () => {
    try {
      debug('Setting up gtag function on window object');
      
      // Make sure dataLayer exists
      window.dataLayer = window.dataLayer || [];
      
      // Define and assign gtag function
      window.gtag = function() {
        window.dataLayer.push(arguments);
        debug('gtag call:', [...arguments]);
      };
      
      // Initialize gtag
      window.gtag('js', new Date());
      
      // Configure tracking
      window.gtag('config', GA_MEASUREMENT_ID, {
        debug_mode: true,
        send_page_view: true,
        page_path: pathname
      });
      
      // Set flag that gtag is ready
      setIsGtagLoaded(true);
      
      debug(`gtag setup complete. Window.gtag type: ${typeof window.gtag}`);
      
      // Verify window.gtag exists
      if (typeof window.gtag === 'function') {
        debug('window.gtag is properly defined as a function');
      } else {
        console.error('❌ window.gtag is not a function after setup!', window.gtag);
      }
    } catch (error) {
      console.error('❌ Error setting up gtag:', error);
    }
  };

  // Handle external script load
  const handleGtagScriptLoad = () => {
    debug('External GA script loaded');
    setupGtag();
  };

  // Track page views when route changes and gtag is loaded
  useEffect(() => {
    if (!isGtagLoaded) return;
    
    try {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
        
      debug(`Tracking pageview: ${url}`);
      
      // Use the direct window.gtag reference
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: url,
        debug_mode: true
      });
    } catch (error) {
      console.error('❌ Error tracking pageview:', error);
    }
  }, [pathname, searchParams, isGtagLoaded]);

  // Check if gtag is properly set after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        if (typeof window.gtag === 'function') {
          debug('window.gtag verified after delay');
        } else {
          console.warn('⚠️ window.gtag still not available after delay');
          // Try to set it up again
          setupGtag();
        }
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Load the external GA script first */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={handleGtagScriptLoad}
        onError={(e) => console.error('❌ Failed to load GA script:', e)}
      />
      
      {/* This is now handled via the setupGtag function instead of inline script */}
    </>
  );
}