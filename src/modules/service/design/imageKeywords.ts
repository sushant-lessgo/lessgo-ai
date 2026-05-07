// src/modules/service/design/imageKeywords.ts
// Warm-leaning Pexels keyword suffixes for service projects. Appended to the
// raw user query before /api/images/search call. Pilot uses `default` only;
// serviceType-keyed differentiation deferred post-pilot.
// Reference: newServiceOnboarding.md §5.serviceImageKeywords.

export const SERVICE_IMAGE_KEYWORDS: Record<string, string> = {
  default:    'warm professional craft natural light',
  agency:     'studio workspace warm natural light',
  consulting: 'professional conversation warm office',
  coaching:   'people conversation warm sunlight',
  freelance:  'craft workspace warm natural light',
  beauty:     'beauty skincare natural minimal warm',
  food:       'food artisan craft natural',
  local:      'local artisan warm community',
};

export function getServiceImageQuery(query: string, serviceType?: string): string {
  const suffix =
    SERVICE_IMAGE_KEYWORDS[serviceType ?? 'default'] ?? SERVICE_IMAGE_KEYWORDS.default;
  return `${query} ${suffix}`.trim();
}
