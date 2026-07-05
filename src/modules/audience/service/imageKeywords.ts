// src/modules/audience/service/imageKeywords.ts
// Type-scoped (service) Pexels keyword suffixes. Warm-leaning industry hints
// keyed by serviceType — shared by ALL service templates. The palette-specific
// mood phrase is template-scoped and passed in as a plain string, so this
// module has no template (Hearth/Folio/…) coupling.
// Reference: docs/architecture/newServiceOnboarding.md §5.serviceImageKeywords.

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

export function getServiceImageQuery(
  query: string,
  serviceType?: string,
  palettePhrase?: string,
): string {
  const serviceSuffix =
    SERVICE_IMAGE_KEYWORDS[serviceType ?? 'default'] ?? SERVICE_IMAGE_KEYWORDS.default;
  const paletteSuffix = palettePhrase ?? '';
  return `${query} ${serviceSuffix} ${paletteSuffix}`.replace(/\s+/g, ' ').trim();
}
