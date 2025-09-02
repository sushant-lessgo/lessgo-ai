// lib/fetch-with-csrf.ts - Client-side fetch wrapper with CSRF token
import { getClientCSRFToken } from './csrf';

/**
 * Fetch wrapper that automatically includes CSRF token
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get CSRF token from cookie
  const csrfToken = getClientCSRFToken();
  
  // Add CSRF token to headers for state-changing requests
  const method = options.method?.toUpperCase() || 'GET';
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    options.headers = {
      ...options.headers,
      'x-csrf-token': csrfToken || '',
      'Content-Type': 'application/json',
    };
  }

  return fetch(url, options);
}

/**
 * Convenience methods
 */
export const fetchAPI = {
  get: (url: string, options?: RequestInit) => 
    fetchWithCSRF(url, { ...options, method: 'GET' }),
  
  post: (url: string, body?: any, options?: RequestInit) => 
    fetchWithCSRF(url, { 
      ...options, 
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }),
  
  put: (url: string, body?: any, options?: RequestInit) => 
    fetchWithCSRF(url, { 
      ...options, 
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    }),
  
  delete: (url: string, options?: RequestInit) => 
    fetchWithCSRF(url, { ...options, method: 'DELETE' }),
};