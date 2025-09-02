// components/CSRFInitializer.tsx - Client component for CSRF token initialization
'use client';

import { useCSRFToken } from '@/hooks/useCSRFToken';

/**
 * Client component to initialize CSRF token on app load
 */
export function CSRFInitializer() {
  useCSRFToken();
  return null; // This component doesn't render anything
}

export default CSRFInitializer;