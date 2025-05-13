import posthog from 'posthog-js';

export function trackEdit(section: string, field: string, value: string) {
  posthog.capture('content_edited', {
    section,
    field,
    char_count: value.length,
  });
}
