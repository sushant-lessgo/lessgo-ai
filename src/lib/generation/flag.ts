// Dark-launch gate for the "images at birth" system. See docs/task/scale-03-images-at-birth.plan.md.
//
// NEXT_PUBLIC_ because the only reader is the client component GeneratingStep.tsx
// (server-only env vars aren't available in the client bundle). Flag off = byte-identical
// to today (no image writes at generation time).
export function isImagesAtBirthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IMAGES_AT_BIRTH === 'true';
}
