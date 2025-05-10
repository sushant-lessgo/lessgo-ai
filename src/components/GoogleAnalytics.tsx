// app/components/GoogleAnalytics.tsx
'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_MEASUREMENT_ID, pageview } from '@/lib/gtag';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handle script load success
  const handleGtagLoad = () => {
    console.log('✅ Google Analytics script loaded successfully');
    
    // Force a pageview on script load
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      
      // Small delay to ensure gtag is fully initialized
      setTimeout(() => pageview(url), 100);
    }
  };

  // Track pageviews when route changes
  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      pageview(url);
    }
  }, [pathname, searchParams]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={handleGtagLoad}
        onError={() => console.error('❌ Failed to load Google Analytics script')}
      />
      <Script 
        id="google-analytics" 
        strategy="afterInteractive"
        onLoad={() => console.log('✅ Google Analytics initialization code loaded')}
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){
            dataLayer.push(arguments);
          }
          
          // Explicitly assign gtag to window object
          window.gtag = gtag;
          
          // Initialize gtag
          gtag('js', new Date());
          
          // Configure your GA Measurement ID
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            debug_mode: true,
            send_page_view: true
          });
          
          console.log('🔧 GA4 initialized with ID: ${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}