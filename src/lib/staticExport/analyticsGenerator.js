/**
 * Lessgo Analytics - Lightweight Beacon Script
 * Tracks pageviews, CTA clicks, and form submissions on static published pages
 *
 * Features:
 * - Pageview tracking with UTM params
 * - CTA click tracking via event delegation
 * - Session tracking (sessionStorage)
 * - navigator.sendBeacon with fetch fallback
 * - Exposes window._lessgoTrack for form integration
 *
 * Target: <2KB gzipped
 */

(function() {
  'use strict';

  // Get config from script tag data attributes
  const scriptTag = document.currentScript || document.querySelector('script[data-page-id]');
  const config = {
    pageId: scriptTag?.dataset.pageId,
    slug: scriptTag?.dataset.slug,
  };

  if (!config.pageId || !config.slug) {
    console.warn('[Lessgo Analytics] Missing required config (data-page-id or data-slug)');
    return;
  }

  // Generate or retrieve session ID
  function getSessionId() {
    const key = 'lessgo_session_id';
    let sessionId = sessionStorage.getItem(key);

    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem(key, sessionId);
    }

    return sessionId;
  }

  // Extract UTM parameters from URL
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    const utm = {};

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
      const value = params.get(key);
      if (value) utm[key] = value;
    });

    return utm;
  }

  // Detect device type from user agent (simple)
  function getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return 'mobile';
    }
    if (/tablet|ipad/i.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  }

  // Send event via sendBeacon or fetch fallback
  function sendEvent(eventData) {
    const API_URL = '/api/analytics/event';  // Same-origin (centralization at DB layer)
    const payload = JSON.stringify(eventData);

    // Try sendBeacon first (preferred for page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(API_URL, blob);
      if (sent) return;
    }

    // Fallback to fetch with keepalive
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(err => {
      console.error('[Lessgo Analytics] Track error:', err);
    });
  }

  // Track event function
  function trackEvent(event, customData = {}) {
    const eventData = {
      event,
      pageId: config.pageId,
      slug: config.slug,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer || undefined,
      sessionId: getSessionId(),
      deviceType: getDeviceType(),
      ...getUTMParams(),
      ...customData,
    };

    sendEvent(eventData);
  }

  // Track pageview on load
  function trackPageview() {
    trackEvent('pageview', {
      title: document.title,
    });
  }

  // Track CTA clicks via event delegation
  function initCTATracking() {
    document.addEventListener('click', (event) => {
      const cta = event.target.closest('[data-lessgo-cta]');
      if (!cta) return;

      const ctaText = cta.textContent?.trim() || cta.innerText?.trim() || '';
      const ctaHref = cta.getAttribute('href') || '';

      trackEvent('cta_click', {
        ctaText,
        ctaHref,
      });
    });
  }

  // Expose tracking function for form handler integration
  window._lessgoTrack = trackEvent;

  // Initialize on DOMContentLoaded
  function init() {
    trackPageview();
    initCTATracking();
    console.log('[Lessgo Analytics] Initialized for', config.slug);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
