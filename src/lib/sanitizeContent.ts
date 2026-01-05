/**
 * Sanitizes content for JSON serialization by removing circular references,
 * DOM elements, React fibers, and other non-serializable data.
 */

/**
 * Checks if a value is a plain object (not a class instance, DOM element, etc.)
 */
function isPlainObject(value: any): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Checks if a key should be filtered out (React internal properties)
 */
function shouldFilterKey(key: string): boolean {
  // Filter out React internal properties
  if (key.startsWith('__reactFiber$')) return true;
  if (key.startsWith('__reactProps$')) return true;
  if (key.startsWith('__reactEventHandlers$')) return true;
  if (key.startsWith('__reactInternalInstance$')) return true;

  return false;
}

/**
 * Recursively sanitizes an object for JSON serialization
 * @param obj - The object to sanitize
 * @param visited - WeakSet to track visited objects (prevents circular references)
 * @param depth - Current recursion depth (prevents stack overflow)
 * @param maxDepth - Maximum allowed recursion depth
 * @returns Sanitized copy of the object
 */
export function sanitizeForSerialization(
  obj: any,
  visited: WeakSet<object> = new WeakSet(),
  depth: number = 0,
  maxDepth: number = 50
): any {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    console.warn('[sanitize] Max depth reached, truncating');
    return undefined;
  }

  // Handle primitive types
  if (obj === null) return null;
  if (obj === undefined) return undefined;

  const type = typeof obj;

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return obj;
  }

  // Filter out functions
  if (type === 'function') {
    return undefined;
  }

  // Filter out symbols
  if (type === 'symbol') {
    return undefined;
  }

  // Filter out DOM elements
  if (typeof Element !== 'undefined' && obj instanceof Element) {
    return undefined;
  }
  if (typeof Node !== 'undefined' && obj instanceof Node) {
    return undefined;
  }
  if (typeof HTMLElement !== 'undefined' && obj instanceof HTMLElement) {
    return undefined;
  }

  // Handle Date objects - convert to ISO string
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle RegExp - convert to string
  if (obj instanceof RegExp) {
    return obj.toString();
  }

  // Check for circular references
  if (typeof obj === 'object' && visited.has(obj)) {
    console.warn('[sanitize] Circular reference detected, skipping');
    return undefined;
  }

  // Mark as visited
  if (typeof obj === 'object') {
    visited.add(obj);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    const sanitized: any[] = [];
    for (let i = 0; i < obj.length; i++) {
      const value = sanitizeForSerialization(obj[i], visited, depth + 1, maxDepth);
      // Only include defined values to maintain array indices
      sanitized.push(value);
    }
    return sanitized;
  }

  // Handle plain objects
  if (isPlainObject(obj)) {
    const sanitized: Record<string, any> = {};

    for (const key of Object.keys(obj)) {
      // Skip React internal properties
      if (shouldFilterKey(key)) {
        continue;
      }

      const value = sanitizeForSerialization(obj[key], visited, depth + 1, maxDepth);

      // Only include defined values
      if (value !== undefined) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // For any other object types (class instances, etc.), skip them
  console.warn('[sanitize] Non-plain object encountered, skipping:', obj?.constructor?.name);
  return undefined;
}

/**
 * Convenience wrapper that creates a fresh WeakSet for sanitization
 */
export function sanitize(obj: any): any {
  try {
    return sanitizeForSerialization(obj);
  } catch (error) {
    console.error('[sanitize] Error during sanitization:', error);
    // Return a safe fallback
    return {};
  }
}
