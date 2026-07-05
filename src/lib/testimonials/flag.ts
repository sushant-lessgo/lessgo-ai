// Dark-launch gate for the testimonial system. See docs/tracks/testimonialSystem.md.
//
// Two flags, kept in sync:
// - TESTIMONIALS_ENABLED (server-only) gates the dashboard page + API routes — the real
//   security boundary.
// - NEXT_PUBLIC_TESTIMONIALS_ENABLED gates client components (e.g. the Header nav link),
//   since server-only env vars aren't available in the client bundle. Cosmetic only.

// Server-side gate (page + API routes). Authoritative.
export function isTestimonialsEnabled(): boolean {
  return process.env.TESTIMONIALS_ENABLED === 'true';
}

// Client-readable gate (nav link visibility). Cosmetic — never the security boundary.
export function isTestimonialsEnabledPublic(): boolean {
  return process.env.NEXT_PUBLIC_TESTIMONIALS_ENABLED === 'true';
}
