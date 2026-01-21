// Feature flag hook for simplified onboarding V3
// Controlled via NEXT_PUBLIC_SIMPLIFIED_ONBOARDING_V3 env variable

/**
 * Check if simplified onboarding V3 is enabled
 * Works on both client and server side
 */
export function useSimplifiedOnboardingV3(): boolean {
  return process.env.NEXT_PUBLIC_SIMPLIFIED_ONBOARDING_V3 === 'true';
}

/**
 * Server-side check for simplified onboarding V3
 * Use in API routes and server components
 */
export function isSimplifiedOnboardingV3(): boolean {
  return process.env.NEXT_PUBLIC_SIMPLIFIED_ONBOARDING_V3 === 'true';
}
