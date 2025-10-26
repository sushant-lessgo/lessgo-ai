'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { useAnalytics } from './AnalyticsContext';
import { logger } from '@/lib/logger';

interface SectionTrackerProps {
  sectionId: string;
  sectionType?: string;
  children: ReactNode;
  threshold?: number; // Percentage of section that must be visible (0-1)
}

export function SectionTracker({
  sectionId,
  sectionType,
  children,
  threshold = 0.5,
}: SectionTrackerProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);
  const analytics = useAnalytics();

  useEffect(() => {
    if (!sectionRef.current || hasTracked.current || !analytics.pageSlug) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Track when section becomes visible and hasn't been tracked yet
          if (entry.isIntersecting && !hasTracked.current) {
            analytics.trackEvent('landing_page_section_view', {
              section_id: sectionId,
              section_type: sectionType || 'unknown',
            });

            logger.debug('📊 Analytics: Section view tracked', {
              slug: analytics.pageSlug,
              sectionId,
              sectionType,
            });

            hasTracked.current = true;
          }
        });
      },
      {
        threshold, // Section must be X% visible
        rootMargin: '0px',
      }
    );

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
    };
  }, [sectionId, sectionType, threshold, analytics]);

  return (
    <div ref={sectionRef} data-section-id={sectionId} data-section-type={sectionType}>
      {children}
    </div>
  );
}
