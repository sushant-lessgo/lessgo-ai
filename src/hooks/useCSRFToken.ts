// hooks/useCSRFToken.ts - React hook for CSRF token initialization
import { useEffect } from 'react';

/**
 * Hook to ensure CSRF token is initialized on client
 */
export function useCSRFToken() {
  useEffect(() => {
    // Initialize CSRF token on mount
    fetch('/api/csrf')
      .then(res => res.json())
      .catch(err => console.warn('Failed to initialize CSRF token:', err));
  }, []);
}

export default useCSRFToken;