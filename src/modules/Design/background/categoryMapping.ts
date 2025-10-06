// categoryMapping.ts - Map user profile to background category

import type { InputVariables, HiddenInferredFields } from '@/types/core/content';
import type { BackgroundCategory } from './primaryBackgrounds';

/**
 * Determine background category based on user's onboarding data
 *
 * Categories:
 * - technical: For developers, CTOs, DevTools, AI Tools
 * - professional: For enterprise, finance, compliance, HR, B2B
 * - friendly: For SMBs, founders, creators, no-code (default)
 */
export function getCategoryForUser(
  onboardingData: Partial<InputVariables & HiddenInferredFields>
): BackgroundCategory {
  const audience = (onboardingData.targetAudience || '').toLowerCase();
  const market = (onboardingData.marketCategory || '').toLowerCase();

  // Technical: Developers, CTOs, DevTools, AI Tools
  if (
    // Audience indicators
    audience.includes('developer') ||
    audience.includes('engineer') ||
    audience.includes('technical') ||
    audience.includes('cto') ||
    audience.includes('devops') ||
    audience.includes('architect') ||

    // Market category indicators
    market.includes('development tools') ||
    market.includes('engineering') ||
    market.includes('ai tools') ||
    market.includes('developer tools') ||
    market.includes('devops') ||
    market.includes('infrastructure')
  ) {
    return 'technical';
  }

  // Professional: Enterprise, Finance, Compliance, HR, B2B
  if (
    // Audience indicators
    audience.includes('enterprise') ||
    audience.includes('finance') ||
    audience.includes('compliance') ||
    audience.includes('legal') ||
    audience.includes('corporate') ||
    audience.includes('business') ||

    // Market category indicators
    market.includes('finance') ||
    market.includes('accounting') ||
    market.includes('hr ') ||
    market.includes('human resources') ||
    market.includes('compliance') ||
    market.includes('legal') ||
    market.includes('b2b') ||
    market.includes('enterprise')
  ) {
    return 'professional';
  }

  // Friendly: Default for everyone else
  // Includes: SMBs, founders, creators, no-code users, startups, marketers, etc.
  return 'friendly';
}

/**
 * Get category with detailed reasoning (for debugging)
 */
export function getCategoryWithReason(
  onboardingData: Partial<InputVariables & HiddenInferredFields>
): { category: BackgroundCategory; reason: string } {
  const audience = (onboardingData.targetAudience || '').toLowerCase();
  const market = (onboardingData.marketCategory || '').toLowerCase();
  const category = getCategoryForUser(onboardingData);

  let reason = '';

  if (category === 'technical') {
    if (audience.includes('developer') || audience.includes('engineer')) {
      reason = `Technical audience detected: "${onboardingData.targetAudience}"`;
    } else {
      reason = `Technical market detected: "${onboardingData.marketCategory}"`;
    }
  } else if (category === 'professional') {
    if (audience.includes('enterprise') || audience.includes('corporate')) {
      reason = `Professional audience detected: "${onboardingData.targetAudience}"`;
    } else {
      reason = `Professional market detected: "${onboardingData.marketCategory}"`;
    }
  } else {
    reason = `Default friendly category for: ${onboardingData.targetAudience || 'general audience'}`;
  }

  return { category, reason };
}

/**
 * Test the category mapping with sample profiles
 */
export function testCategoryMapping() {
  const testProfiles = [
    {
      name: 'Developer Tool',
      data: { targetAudience: 'Developers', marketCategory: 'AI Tools' },
      expectedCategory: 'technical'
    },
    {
      name: 'Enterprise SaaS',
      data: { targetAudience: 'Enterprise Teams', marketCategory: 'Business Productivity Tools' },
      expectedCategory: 'professional'
    },
    {
      name: 'Finance App',
      data: { targetAudience: 'Small Businesses', marketCategory: 'Finance & Accounting Tools' },
      expectedCategory: 'professional'
    },
    {
      name: 'No-Code Platform',
      data: { targetAudience: 'Founders', marketCategory: 'No-Code & Development Platforms' },
      expectedCategory: 'friendly'
    },
    {
      name: 'Creator Tool',
      data: { targetAudience: 'Content Creators', marketCategory: 'Design & Creative Tools' },
      expectedCategory: 'friendly'
    },
  ];

  console.log('🧪 Testing Category Mapping...\n');

  testProfiles.forEach(profile => {
    const { category, reason } = getCategoryWithReason(profile.data);
    const passed = category === profile.expectedCategory;
    const emoji = passed ? '✅' : '❌';

    console.log(`${emoji} ${profile.name}:`);
    console.log(`   Expected: ${profile.expectedCategory}`);
    console.log(`   Got: ${category}`);
    console.log(`   Reason: ${reason}`);
    console.log('');
  });
}
