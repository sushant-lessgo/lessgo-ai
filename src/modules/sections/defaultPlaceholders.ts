// modules/sections/defaultPlaceholders.ts - Default placeholder values for manual_preferred fields

/**
 * Default placeholder values for manual_preferred elements
 * These elements should NOT be sent to AI - they need user's actual business data
 */

export type DefaultValue = string | number | boolean | string[];

/**
 * Pattern-based default value mapping for manual_preferred fields
 */
export const DEFAULT_PLACEHOLDERS: Record<string, DefaultValue> = {
  // === IMAGE FIELDS ===
  hero_image: '/placeholder-hero.jpg',
  center_hero_image: '/placeholder-hero.jpg',
  split_hero_image: '/placeholder-hero.jpg',
  image_first_hero_image: '/placeholder-hero.jpg',
  before_visual: '/placeholder-visual.jpg',
  after_visual: '/placeholder-visual.jpg',
  step1_visual: '/placeholder-step.jpg',
  step2_visual: '/placeholder-step.jpg',
  step3_visual: '/placeholder-step.jpg',
  step_visual_0: '/placeholder-step.jpg',
  step_visual_1: '/placeholder-step.jpg',
  step_visual_2: '/placeholder-step.jpg',
  step_visual_3: '/placeholder-step.jpg',
  step_visual_4: '/placeholder-step.jpg',
  step_visual_5: '/placeholder-step.jpg',
  founder_image: '/placeholder-founder.jpg',
  persona_avatar: '/placeholder-avatar.jpg',
  support_avatar: '/placeholder-avatar.jpg',
  background_image: '/placeholder-background.jpg',
  story_image: '/placeholder-story.jpg',
  secondary_image: '/placeholder-secondary.jpg',
  before_after_image: '/placeholder-comparison.jpg',
  mockup_image: '/placeholder-mockup.jpg',
  video_thumbnail: '/placeholder-video-thumb.jpg',
  testimonial_company_logo: '/placeholder-logo.jpg',

  // === AVATAR ARRAYS ===
  avatar_urls: ['/placeholder-avatar-1.jpg', '/placeholder-avatar-2.jpg', '/placeholder-avatar-3.jpg'],
  avatar_1: '/placeholder-avatar-1.jpg',
  avatar_2: '/placeholder-avatar-2.jpg',
  avatar_3: '/placeholder-avatar-3.jpg',
  avatar_4: '/placeholder-avatar-4.jpg',
  avatar_5: '/placeholder-avatar-5.jpg',
  avatar_6: '/placeholder-avatar-6.jpg',

  // === LOGO ARRAYS ===
  logo_urls: ['/placeholder-logo-1.png', '/placeholder-logo-2.png', '/placeholder-logo-3.png'],
  company_logos: ['/placeholder-logo-1.png', '/placeholder-logo-2.png', '/placeholder-logo-3.png'],
  testimonial_images: ['/placeholder-testimonial-1.jpg', '/placeholder-testimonial-2.jpg'],

  // === CUSTOMER/REVIEWER NAMES ===
  customer_names: ['John D.', 'Sarah M.', 'Alex K.'],
  reviewer_name_1: 'John D.',
  reviewer_name_2: 'Sarah M.',
  reviewer_name_3: 'Alex K.',
  reviewer_name_4: 'Emily R.',

  // === COUNTS & METRICS ===
  customer_count: '500+',
  avatar_count: 3,
  active_creators_count: '1,000+',
  creations_count: '10,000+',
  rating_count: '250',
  tier_count: 3,
  limited_quantity: 100,

  // === RATINGS & PERCENTAGES ===
  rating_value: '4.8',
  average_rating: '4.8',
  average_rating_display: '4.8/5',
  rating_stat: '4.9/5',
  uptime_percentage: '99.9%',

  // === STATISTICS ===
  enterprise_customers_stat: '500+ Enterprise Customers',
  enterprise_stat: '500+ Companies',
  agencies_stat: '300+ Agencies',
  small_business_stat: '1,000+ Small Businesses',
  dev_teams_stat: '200+ Dev Teams',
  support_stat: '24/7 Support',
  uptime_stat: '99.9% Uptime',
  global_reach_stat: 'Used in 100+ Countries',
  social_metric_1: '50K+ Followers',
  social_metric_2: '1M+ Views',
  social_metric_3: '4.8★ Rating',
  social_metric_4: '10K+ Reviews',

  // === BOOLEAN FLAGS (show_*) ===
  show_social_proof: true,
  show_customer_avatars: true,
  show_stats_section: true,
  show_trust_badge: true,
  show_trust_section: true,
  show_trust_footer: true,
  show_help_section: true,
  show_cta_section: true,
  show_typing_indicator: false,
  show_company_values: false,
  show_quote_mark: true,
  show_process_summary: false,
  show_feature_summary: false,
  show_circle_features: false,
  show_flip_features: false,
  show_summary_card: false,
  show_tech_specs: false,
  show_step_indicators: true,
  show_process_indicators: true,
  show_interactive_guide: false,
  show_flow_summary: false,
  show_demo_stats: false,
  show_guarantee: false,
  show_video_info: false,

  // === ANIMATION & BEHAVIOR FLAGS ===
  auto_rotate: false,
  auto_play: false,
  auto_animate: false,
  carousel_navigation: true,
  step_numbers: true,

  // === PRICING FIELDS ===
  pricing_type: 'subscription',
  base_price: 49,
  unit_price: 10,
  min_units: 1,
  max_units: 100,
  default_units: 10,
  tier_breakpoints: [10, 50, 100],
  tier_discounts: [0, 10, 20],
  popular_labels: ['Most Popular', 'Best Value'],
  popular_tiers: [1],

  // === TEXT LABELS & NAMES ===
  customer_label: 'Happy Customers',
  uptime_label: 'Guaranteed Uptime',
  algorithm_name: 'Smart Algorithm',
  methodology_name: 'Proven Methodology',
  mechanism_name: 'Advanced Mechanism',
  us_header: 'Why Choose Us',
  your_product_name: 'Your Product',
  highlight_column: 1,

  // === FORM FIELDS ===
  form_type: 'waitlist',
  required_fields: ['email'],

  // === MISC DATA ===
  countries_list: ['USA', 'UK', 'Canada', 'Australia'],
  trust_badge: 'Trusted by 10,000+ users',
  video_url: '',
  video_duration: '2:30',
  testimonial_date: '2 weeks ago',
  testimonial_ratings: [5, 5, 4, 5],
  countdown_end_date: '2024-12-31',
  countdown_end_time: '23:59:59',
};

/**
 * Pattern-based matching for element names that follow common patterns
 */
export function getDefaultValueByPattern(elementName: string): DefaultValue | null {
  // Image patterns
  if (elementName.includes('image') || elementName.includes('visual') || elementName.includes('avatar') || elementName.includes('logo')) {
    if (elementName.includes('urls') || elementName.includes('logos') || elementName.includes('avatars')) {
      return ['/placeholder-image-1.jpg', '/placeholder-image-2.jpg'];
    }
    return '/placeholder-image.jpg';
  }

  // Boolean show_* pattern
  if (elementName.startsWith('show_')) {
    return false; // Default to false for optional display flags
  }

  // Count/stat patterns
  if (elementName.includes('count') || elementName.includes('stat')) {
    return '100+';
  }

  // Rating patterns
  if (elementName.includes('rating')) {
    return '4.8';
  }

  // Name patterns
  if (elementName.includes('name') && !elementName.includes('your_product')) {
    return 'Customer Name';
  }

  // URL patterns
  if (elementName.includes('url') && elementName.includes('urls')) {
    return [];
  }
  if (elementName.includes('url')) {
    return '';
  }

  return null;
}

/**
 * Get default value for a manual_preferred element
 */
export function getDefaultPlaceholder(elementName: string): DefaultValue {
  // First try exact match
  if (DEFAULT_PLACEHOLDERS[elementName] !== undefined) {
    return DEFAULT_PLACEHOLDERS[elementName];
  }

  // Then try pattern matching
  const patternValue = getDefaultValueByPattern(elementName);
  if (patternValue !== null) {
    return patternValue;
  }

  // Fallback: empty string for unknown elements
  return '';
}

/**
 * Check if an element value is empty/needs default
 */
export function needsDefaultValue(value: any): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}
