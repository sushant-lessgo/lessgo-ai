// Dark-launch gate for the testimonial system (Phase 1+). Server-side only for now;
// a NEXT_PUBLIC_TESTIMONIALS_ENABLED twin is added in Phase 2 only if a client
// component (e.g. a dashboard nav link) needs to read it. See testimonialSystem.md.
export function isTestimonialsEnabled(): boolean {
  return process.env.TESTIMONIALS_ENABLED === 'true';
}
