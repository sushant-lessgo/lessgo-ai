/**
 * Mock data generator for UIBlock testing
 * Generates realistic mock data from V2 schema definitions
 */

import {
  layoutElementSchema,
  isV2Schema,
  UIBlockSchemaV2,
  ElementDef,
  CollectionDef,
} from '@/modules/sections/layoutElementSchema';

// ============================================================
// REALISTIC MOCK DATA OVERRIDES
// Hand-crafted content for designer review
// ============================================================

const realisticMockData: Record<string, Record<string, any>> = {
  // ─────────────────────────────────────────────────────────
  // SideBySideBlocks - Compact horizontal comparison
  // ─────────────────────────────────────────────────────────
  SideBySideBlocks: {
    headline: 'Stop Wrestling with Spreadsheets',
    subheadline: 'See what happens when you switch from manual tracking to automated insights.',
    before_label: 'Without Flowtrack',
    after_label: 'With Flowtrack',
    before_description: 'Scattered data across 12+ spreadsheets, weekly status meetings, constant "where is that file?" messages.',
    after_description: 'One dashboard, real-time updates, automated reports delivered to your inbox every Monday.',
    before_icon: '😤',
    after_icon: '😌',
    summary_text: 'Teams using Flowtrack save an average of 8 hours per week on reporting alone.',
    before_points: [
      { id: 'bp1', text: 'Hours wasted hunting for data' },
      { id: 'bp2', text: 'Outdated numbers in presentations' },
      { id: 'bp3', text: 'Manual copy-paste errors' },
    ],
    after_points: [
      { id: 'ap1', text: 'All metrics in one place' },
      { id: 'ap2', text: 'Always up-to-date dashboards' },
      { id: 'ap3', text: 'Zero manual data entry' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // SplitCard - Premium card-based comparison with visuals
  // ─────────────────────────────────────────────────────────
  SplitCard: {
    headline: 'From Chaos to Clarity',
    subheadline: 'Experience the difference professional project management makes.',
    before_label: 'The Old Way',
    after_label: 'The Projex Way',
    before_description: 'Endless email threads, missed deadlines, and that sinking feeling when you realize nobody knows who\'s doing what.',
    after_description: 'Crystal-clear task ownership, automated deadline reminders, and a team that actually ships on time.',
    before_visual: '',
    after_visual: '',
    before_icon: '📧',
    after_icon: '🚀',
    upgrade_icon: '→',
    upgrade_text: 'Transform',
    summary_text: 'Join 2,500+ teams who switched to Projex and never looked back.',
  },

  // ─────────────────────────────────────────────────────────
  // StackedTextVisual - Vertical stacked transformation
  // ─────────────────────────────────────────────────────────
  StackedTextVisual: {
    headline: 'Your Morning Routine, Transformed',
    subheadline: 'See how our meal planning app changes the daily breakfast scramble.',
    before_label: 'Every Morning Before',
    after_label: 'Every Morning After',
    before_text: 'Standing in front of an open fridge at 7:15 AM, wondering what to make while the kids ask "what\'s for breakfast?" for the fifth time. Ending up with the same boring cereal again.',
    after_text: 'Wake up knowing exactly what\'s for breakfast. Ingredients prepped the night before. A calm 15-minute cooking session while the kids set the table. Variety that keeps everyone excited.',
    before_icon: '😩',
    after_icon: '☀️',
    transition_icon: '↓',
    transition_text: 'One simple app changes everything',
    summary_text: 'Families using MealPlan report 73% less morning stress and actually look forward to breakfast again.',
  },

  // ─────────────────────────────────────────────────────────
  // SplitAlternating - Alternating feature rows with visuals
  // ─────────────────────────────────────────────────────────
  SplitAlternating: {
    headline: 'Built for Teams Who Ship Fast',
    subheadline: 'Every feature designed to eliminate friction and keep your team in flow state.',
    supporting_text: 'Used by engineering teams at over 500 companies worldwide.',
    features: [
      {
        id: 'f1',
        title: 'Instant Code Review',
        description: 'AI-powered code analysis catches bugs before they reach production. Get actionable feedback in seconds, not hours. Our models are trained on millions of pull requests to understand context and intent.',
        visual: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
        icon: '🔍',
      },
      {
        id: 'f2',
        title: 'Smart Test Generation',
        description: 'Stop writing boilerplate tests. Our engine analyzes your code paths and generates comprehensive test suites automatically. Covers edge cases you didn\'t even think of.',
        visual: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
        icon: '🧪',
      },
      {
        id: 'f3',
        title: 'One-Click Deployments',
        description: 'From commit to production in under 3 minutes. Zero-downtime deployments with automatic rollback if anything goes wrong. Sleep well knowing your releases are safe.',
        visual: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
        icon: '🚀',
      },
      {
        id: 'f4',
        title: 'Real-time Collaboration',
        description: 'See your teammates\' cursors as they code. Pair program without screen sharing. Built-in voice chat that just works. Remote teams feel like they\'re in the same room.',
        visual: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
        icon: '👥',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // IconGrid - Feature showcase grid (V2)
  // ─────────────────────────────────────────────────────────
  IconGrid: {
    headline: 'Everything You Need to Ship Faster',
    subheadline: 'A complete toolkit for modern product teams who refuse to compromise on quality.',
    badge_text: 'Core Features',
    supporting_text: 'And that\'s just the beginning. Explore our full feature set or talk to our team.',
    features: [
      {
        id: 'f1',
        title: 'Real-time Collaboration',
        description: 'Work on the same canvas with your team. See cursors, edits, and comments appear instantly.',
      },
      {
        id: 'f2',
        title: 'Smart Automations',
        description: 'Set up workflows once and let them run forever. From Slack notifications to Jira updates.',
      },
      {
        id: 'f3',
        title: 'Built-in Analytics',
        description: 'Track what matters without third-party tools. Conversion funnels, user behavior, and more.',
      },
      {
        id: 'f4',
        title: 'Enterprise Security',
        description: 'SOC 2 Type II certified. SSO, audit logs, and granular permissions built in from day one.',
      },
      {
        id: 'f5',
        title: 'API-First Design',
        description: 'Build custom integrations in minutes. Every feature is accessible via our REST and GraphQL APIs.',
      },
      {
        id: 'f6',
        title: '24/7 Priority Support',
        description: 'Chat with a real human in under 5 minutes. Average customer satisfaction: 98%.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // StackedPainBullets - Pain point identification
  // ─────────────────────────────────────────────────────────
  StackedPainBullets: {
    headline: 'Sound Familiar?',
    subheadline: 'These daily frustrations are costing you more than you realize.',
    conclusion_text: 'You\'re not alone. We built Flowtrack to fix exactly this.',
    pain_items: [
      {
        id: 'p1',
        point: 'Spending 3+ hours every week just finding the right spreadsheet',
        description: 'Version control nightmare—which one is "final_FINAL_v3_updated"?'
      },
      {
        id: 'p2',
        point: 'Your tools don\'t talk to each other',
        description: 'Copy-pasting between Slack, email, and your PM tool like it\'s 2005.'
      },
      {
        id: 'p3',
        point: 'Important updates get buried in endless threads',
        description: 'That critical deadline change? Somewhere in a 47-message Slack thread.'
      },
      {
        id: 'p4',
        point: 'Your team is burning out on busywork',
        description: 'Smart people doing repetitive tasks that should be automated.'
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LetterStyleBlock - Personal founder letter
  // ─────────────────────────────────────────────────────────
  LetterStyleBlock: {
    letter_header: 'A Personal Note from Our Founder',
    letter_greeting: 'Dear Fellow Builder,',
    letter_body: 'Three years ago, I sat exactly where you are now—staring at a landing page that just wouldn\'t convert.\n\nI\'d tried everything. Hired expensive copywriters. A/B tested until my eyes crossed. Read every marketing book I could find.\n\nThen it hit me: the problem wasn\'t my copy. It was the process. Great landing pages need great strategy first.\n\nThat\'s why I built Lessgo. To give founders like us the strategic foundation we need before writing a single word.',
    letter_signature: 'Sushant Jain',
    founder_title: 'Founder',
    company_name: 'Lessgo',
    date_text: 'January 2025',
    ps_text: 'P.S. Every founder who joins gets a personal strategy review from me. Just reply to your welcome email.',
    founder_image: '/images/founder.jpg',
  },

  // ─────────────────────────────────────────────────────────
  // MetricTiles - Data-driven metric tiles with ROI section (V2)
  // ─────────────────────────────────────────────────────────
  MetricTiles: {
    headline: 'Quantifiable Results That Speak for Themselves',
    subheadline: 'Our customers see measurable improvements within the first 90 days.',
    show_roi_summary: true,
    roi_summary_title: 'Proven Return on Investment',
    roi_description: 'Based on independent analysis of 500+ enterprise implementations over 3 years.',
    metrics: [
      {
        id: 'm1',
        title: 'Efficiency Boost',
        metric: '300%',
        label: 'faster processing',
        description: 'Automate manual processes and reduce task completion time dramatically with our intelligent workflow engine.',
      },
      {
        id: 'm2',
        title: 'Cost Reduction',
        metric: '$2.4M',
        label: 'annual savings',
        description: 'Save significantly through reduced operational costs and improved resource allocation across your organization.',
      },
      {
        id: 'm3',
        title: 'Error Prevention',
        metric: '99.9%',
        label: 'accuracy rate',
        description: 'Achieve near-perfect accuracy with our AI-powered error detection and automatic correction systems.',
      },
      {
        id: 'm4',
        title: 'Revenue Growth',
        metric: '47%',
        label: 'revenue increase',
        description: 'Drive substantial revenue growth through optimized processes and improved customer satisfaction scores.',
      },
    ],
    roi_metrics: [
      { id: 'r1', metric: '6 Months', label: 'Average Payback Period' },
      { id: 'r2', metric: '400%', label: 'Average ROI in Year 1' },
      { id: 'r3', metric: '$5.2M', label: 'Average 3-Year Value' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // AccordionFAQ - Expandable FAQ section (V2)
  // ─────────────────────────────────────────────────────────
  AccordionFAQ: {
    headline: 'Frequently Asked Questions',
    subheadline: 'Everything you need to know about getting started with our platform.',
    faq_items: [
      {
        id: 'faq-1',
        question: 'How long does it take to set up?',
        answer: 'Most teams are up and running in under 15 minutes. Our guided onboarding walks you through connecting your existing tools, inviting teammates, and setting up your first project. No technical expertise required.'
      },
      {
        id: 'faq-2',
        question: 'Can I import data from my current tools?',
        answer: 'Absolutely. We offer one-click imports from Notion, Asana, Trello, Monday, and Jira. Your tasks, projects, and even comments transfer seamlessly. We also have a CSV import for custom data.'
      },
      {
        id: 'faq-3',
        question: 'What happens when my trial ends?',
        answer: 'Your trial gives you full access to all features for 14 days. When it ends, you can choose a paid plan to continue, or downgrade to our free tier which includes up to 3 projects and 5 team members forever.'
      },
      {
        id: 'faq-4',
        question: 'Is my data secure?',
        answer: 'Security is our top priority. We\'re SOC 2 Type II certified, use 256-bit encryption for all data, and never share your information with third parties. Enterprise plans include SSO, audit logs, and custom data retention policies.'
      },
      {
        id: 'faq-5',
        question: 'Do you offer refunds?',
        answer: 'Yes. If you\'re not completely satisfied within the first 30 days of any paid plan, we\'ll refund your payment in full—no questions asked. We want you to feel confident trying us out.'
      },
    ],
    contact_prompt: 'Still have questions?',
    cta_text: 'Contact our support team',
    supporting_text: 'We typically respond within 24 hours.',
  },

  // ─────────────────────────────────────────────────────────
  // TwoColumnFAQ - Two-column FAQ layout (V2)
  // ─────────────────────────────────────────────────────────
  TwoColumnFAQ: {
    headline: 'Frequently Asked Questions',
    subheadline: 'Quick answers to help you get started with our platform.',
    faq_items: [
      {
        id: 'faq-1',
        question: 'How quickly can I get started?',
        answer: 'Most users launch their first project within 10 minutes. Our setup wizard guides you through connecting accounts, importing existing data, and configuring your workspace.'
      },
      {
        id: 'faq-2',
        question: 'What integrations do you support?',
        answer: 'We integrate with 50+ tools including Slack, Notion, Google Workspace, Microsoft Teams, Zapier, and all major CRMs. Custom API access is available on Pro plans.'
      },
      {
        id: 'faq-3',
        question: 'Can I try before I buy?',
        answer: 'Absolutely. Our 14-day free trial includes full access to all features. No credit card required to start, and you can upgrade or cancel anytime.'
      },
      {
        id: 'faq-4',
        question: 'How does billing work?',
        answer: 'We offer monthly and annual plans. Annual billing saves you 20%. All plans include unlimited projects, and you only pay for active team members.'
      },
      {
        id: 'faq-5',
        question: 'What kind of support do you offer?',
        answer: 'All plans include email support with 24-hour response time. Pro and Enterprise plans add live chat, phone support, and a dedicated success manager.'
      },
      {
        id: 'faq-6',
        question: 'Is my data secure and private?',
        answer: 'Yes. We\'re SOC 2 Type II certified and GDPR compliant. All data is encrypted at rest and in transit. We never share or sell your information.'
      },
    ],
    contact_prompt: 'Still have questions?',
    cta_text: 'Contact our support team',
    supporting_text: 'We typically respond within 24 hours.',
  },

  // ─────────────────────────────────────────────────────────
  // InlineQnAList - Simple inline FAQ list (V2)
  // ─────────────────────────────────────────────────────────
  InlineQnAList: {
    headline: 'Quick Questions & Answers',
    subheadline: 'Get instant answers to the most common questions about our platform.',
    faq_items: [
      {
        id: 'faq-1',
        question: 'What is your product?',
        answer: 'We\'re a no-code automation platform that helps you streamline your business processes without writing a single line of code.'
      },
      {
        id: 'faq-2',
        question: 'How much does it cost?',
        answer: 'We offer flexible pricing starting at $29/month. See our pricing page for detailed plans and enterprise options.'
      },
      {
        id: 'faq-3',
        question: 'Do I need technical knowledge?',
        answer: 'Not at all! Our platform is designed for non-technical users. If you can use email, you can use our product.'
      },
      {
        id: 'faq-4',
        question: 'How quickly can I get started?',
        answer: 'You can get started in under 5 minutes. Just sign up, connect your tools, and start automating.'
      },
    ],
    contact_prompt: 'Still have questions?',
    cta_text: 'Contact our support team',
    supporting_text: 'We typically respond within 24 hours.',
  },

  // ─────────────────────────────────────────────────────────
  // SegmentedFAQTabs - Tabbed FAQ by category (V2)
  // ─────────────────────────────────────────────────────────
  SegmentedFAQTabs: {
    headline: 'Everything You Need to Know',
    subheadline: 'Find answers organized by topic for easy navigation.',
    tabs: [
      {
        id: 'tab-1',
        label: 'Getting Started',
        items: [
          { id: 'tab-1-faq-1', question: 'How do I sign up?', answer: 'Simply click "Start Free Trial" and follow the guided setup process. It takes less than 2 minutes and no credit card is required.' },
          { id: 'tab-1-faq-2', question: 'What\'s included in the free trial?', answer: 'Full access to all features, unlimited users, and priority support for 14 days. No restrictions or hidden limitations.' },
          { id: 'tab-1-faq-3', question: 'How long does setup take?', answer: 'Most teams are up and running in under 10 minutes. We provide templates and a setup wizard to get you started quickly.' },
        ]
      },
      {
        id: 'tab-2',
        label: 'Technical Details',
        items: [
          { id: 'tab-2-faq-1', question: 'What\'s your uptime guarantee?', answer: 'We guarantee 99.9% uptime with redundant infrastructure across multiple regions. Real-time status is available at status.example.com.' },
          { id: 'tab-2-faq-2', question: 'How is data encrypted?', answer: 'All data is encrypted using AES-256 at rest and TLS 1.3 in transit. We\'re SOC 2 Type II certified and GDPR compliant.' },
          { id: 'tab-2-faq-3', question: 'Can I export my data?', answer: 'Yes, you can export all your data anytime in JSON, CSV, or SQL format. We believe in data portability and no vendor lock-in.' },
        ]
      },
      {
        id: 'tab-3',
        label: 'Billing & Support',
        items: [
          { id: 'tab-3-faq-1', question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, ACH transfers, and wire transfers for enterprise customers. Invoicing is available for annual plans.' },
          { id: 'tab-3-faq-2', question: 'Can I change plans anytime?', answer: 'Yes, upgrade or downgrade anytime. Changes are prorated to your billing cycle. No long-term contracts required.' },
          { id: 'tab-3-faq-3', question: 'How do I contact support?', answer: '24/7 support via live chat, email at support@example.com, or schedule a call with our team. Enterprise plans include a dedicated success manager.' },
        ]
      }
    ],
    contact_prompt: 'Still have questions?',
    cta_text: 'Contact our support team',
    supporting_text: 'We typically respond within 24 hours.',
  },

  // ─────────────────────────────────────────────────────────
  // Carousel - Interactive feature showcase carousel (V2)
  // ─────────────────────────────────────────────────────────
  Carousel: {
    headline: 'Powerful Features, Beautifully Designed',
    subheadline: 'Explore the tools that make our platform the choice of creative professionals.',
    supporting_text: 'Used by 50,000+ designers and creative teams worldwide.',
    auto_play: false,
    benefit_1: 'No learning curve',
    benefit_2: 'Instant results',
    benefit_icon_1: '✅',
    benefit_icon_2: '⚡',
    features: [
      {
        id: 'f1',
        title: 'Intuitive Visual Editor',
        description: 'Design like a pro with our drag-and-drop canvas. No code required. Real-time preview shows exactly what visitors will see.',
        visual: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
        tag: 'Most Popular',
      },
      {
        id: 'f2',
        title: 'Smart Templates Library',
        description: 'Start with 200+ professionally designed templates. Customize colors, fonts, and layout to match your brand in minutes.',
        visual: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=600&fit=crop',
        tag: 'Time Saver',
      },
      {
        id: 'f3',
        title: 'AI-Powered Copy Assistant',
        description: 'Generate compelling headlines and descriptions with one click. Our AI understands your brand voice and audience.',
        visual: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
        tag: 'AI Magic',
      },
      {
        id: 'f4',
        title: 'One-Click Publishing',
        description: 'Go live instantly with custom domains and SSL included. No hosting setup or technical knowledge needed.',
        visual: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
        tag: 'Easy Setup',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // TierCards - Pricing tier comparison cards (V2)
  // ─────────────────────────────────────────────────────────
  TierCards: {
    headline: 'Simple, Transparent Pricing',
    subheadline: 'Choose the plan that fits your team. All plans include a 14-day free trial.',
    badge_text: 'Pricing',
    billing_note: 'Billed annually. Monthly billing also available.',
    guarantee_text: '30-day money-back guarantee. No questions asked.',
    highlighted_label: 'Best Value',
    tiers: [
      {
        id: 'tier-1',
        name: 'Starter',
        price: '$9',
        period: '/month',
        description: 'Perfect for individuals and small teams getting started.',
        features: [
          'Up to 5 team members',
          '10GB storage',
          'Basic analytics',
          'Email support',
          'Core integrations',
        ],
        cta_text: 'Start Free Trial',
        highlighted: false,
      },
      {
        id: 'tier-2',
        name: 'Professional',
        price: '$29',
        period: '/month',
        description: 'For growing teams that need more power and flexibility.',
        features: [
          'Up to 25 team members',
          '100GB storage',
          'Advanced analytics',
          'Priority support',
          'All integrations',
          'Custom workflows',
          'API access',
        ],
        cta_text: 'Start Free Trial',
        highlighted: true,
      },
      {
        id: 'tier-3',
        name: 'Enterprise',
        price: '$99',
        period: '/month',
        description: 'Custom solutions for large organizations with advanced needs.',
        features: [
          'Unlimited team members',
          'Unlimited storage',
          'Enterprise analytics',
          'Dedicated support',
          'Custom integrations',
          'Advanced security',
          'SLA guarantee',
          'White-label options',
        ],
        cta_text: 'Contact Sales',
        highlighted: false,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // QuoteGrid - Testimonial quote cards (V2) - B2B focused
  // ─────────────────────────────────────────────────────────
  QuoteGrid: {
    headline: 'What Our Customers Are Saying',
    subheadline: 'Join 10,000+ happy customers who transformed their workflow.',
    verification_message: 'All testimonials from verified customers',
    testimonials: [
      {
        id: 't1',
        quote: 'This platform completely transformed how we handle our daily operations. What used to take hours now takes minutes, and our team can focus on what really matters.',
        customer_name: 'Sarah Johnson',
        customer_title: 'Operations Director',
        customer_company: 'TechFlow Inc',
        rating_value: '5',
      },
      {
        id: 't2',
        quote: 'The ROI was immediate and significant. Within the first month, we had already saved more than the annual subscription cost through improved efficiency.',
        customer_name: 'Michael Chen',
        customer_title: 'CTO',
        customer_company: 'DataWorks',
        rating_value: '5',
      },
      {
        id: 't3',
        quote: 'Outstanding customer support and a product that actually delivers on its promises. Rare to find both in one solution.',
        customer_name: 'Emma Rodriguez',
        customer_title: 'Marketing Manager',
        customer_company: 'GrowthLab',
        rating_value: '5',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // PullQuoteStack - B2C testimonials with masonry layout (V2)
  // Personal stories, relatable experiences, casual tone
  // ─────────────────────────────────────────────────────────
  PullQuoteStack: {
    headline: 'Real People, Real Results',
    subheadline: 'Hear from people who made the switch and never looked back.',
    testimonials: [
      {
        id: 't1',
        quote: 'I used to spend my entire Sunday meal prepping. Now I have that time back with my kids. This app genuinely changed our family weekends.',
        customer_name: 'Sarah M.',
        customer_title: 'Busy Mom of 3',
        customer_location: 'Austin, TX',
        avatar_url: '',
      },
      {
        id: 't2',
        quote: 'After years of trying different fitness apps, this is the only one that stuck. No complicated routines, just results I can actually see.',
        customer_name: 'Mike R.',
        customer_title: 'Night Shift Nurse',
        customer_location: 'Chicago, IL',
        avatar_url: '',
      },
      {
        id: 't3',
        quote: 'I was skeptical—I\'ve been burned by subscription services before. Three months in and I genuinely look forward to using this every morning.',
        customer_name: 'Jennifer L.',
        customer_title: 'Remote Worker',
        customer_location: 'Seattle, WA',
        avatar_url: '',
      },
      {
        id: 't4',
        quote: 'My husband says I\'m a different person since I started using this. Less stressed, more present. It\'s the little things that add up.',
        customer_name: 'Amanda K.',
        customer_title: 'First-time Mom',
        customer_location: 'Denver, CO',
        avatar_url: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // VideoTestimonials - Video testimonial cards (V2)
  // ─────────────────────────────────────────────────────────
  VideoTestimonials: {
    headline: 'See What Our Customers Are Saying',
    subheadline: 'Video testimonials from real customers who transformed their business.',
    video_testimonials: [
      {
        id: 'vt-1',
        title: 'How We Transformed Our Operations',
        description: 'Learn how our platform helped TechCorp streamline their entire workflow and reduce operational costs by 60% in just 3 months.',
        customer_name: 'Sarah Mitchell',
        customer_title: 'VP of Operations',
        customer_company: 'TechCorp Industries',
        video_url: '',
        thumbnail: '',
      },
      {
        id: 'vt-2',
        title: '500% ROI in First Quarter',
        description: 'Discover the strategies and implementation process that delivered immediate results for this growing enterprise team.',
        customer_name: 'James Rodriguez',
        customer_title: 'Chief Technology Officer',
        customer_company: 'Global Dynamics',
        video_url: '',
        thumbnail: '',
      },
      {
        id: 'vt-3',
        title: 'Seamless Enterprise Integration',
        description: 'See the technical integration process and how our API seamlessly connected with their existing enterprise systems.',
        customer_name: 'Anna Chen',
        customer_title: 'Director of IT',
        customer_company: 'InnovateSoft',
        video_url: '',
        thumbnail: '',
      },
      {
        id: 'vt-4',
        title: 'From Manual to Automated in 30 Days',
        description: 'Watch the complete transformation journey from manual processes to full automation with measurable outcomes.',
        customer_name: 'Michael Thompson',
        customer_title: 'Head of Digital Transformation',
        customer_company: 'Enterprise Solutions Inc',
        video_url: '',
        thumbnail: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // CallToQuotePlan - Enterprise custom quote contact section
  // ─────────────────────────────────────────────────────────
  CallToQuotePlan: {
    headline: 'Let\'s Build Your Custom Solution',
    subheadline: 'Enterprise-grade features tailored to your organization\'s unique requirements.',
    value_proposition: 'Every business is different. That\'s why we work with you to create a pricing plan that fits your team size, usage patterns, and growth trajectory. No surprises, just transparent partnership.',
    supporting_text: 'Trusted by Fortune 500 companies and fast-growing startups alike.',
    response_time: 'We respond within 4 business hours',
    contact_cards: [
      {
        id: 'cc-1',
        title: 'Schedule a Demo',
        description: 'See the platform in action with a personalized walkthrough tailored to your use case.',
        cta: 'Book Demo',
        icon: 'lucide:calendar',
      },
      {
        id: 'cc-2',
        title: 'Request a Quote',
        description: 'Get a custom pricing proposal based on your team size and requirements.',
        cta: 'Get Quote',
        icon: 'lucide:dollar-sign',
      },
      {
        id: 'cc-3',
        title: 'Talk to Sales',
        description: 'Have questions? Our enterprise team is ready to help you find the right solution.',
        cta: 'Contact Sales',
        icon: 'lucide:phone',
      },
    ],
    trust_items: [
      { id: 'ti-1', text: 'No commitment required' },
      { id: 'ti-2', text: 'Free consultation' },
      { id: 'ti-3', text: 'Custom implementation support' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // StatBlocks - Results statistics display (V2)
  // ─────────────────────────────────────────────────────────
  StatBlocks: {
    headline: 'Real Results from Real Customers',
    subheadline: 'Numbers that speak for themselves. See what teams like yours have achieved.',
    achievement_footer: 'Results measured across 2,500+ enterprise implementations',
    stats: [
      {
        id: 's1',
        value: '10,000+',
        label: 'Happy Customers',
        description: 'Growing 40% year-over-year across 50+ countries',
      },
      {
        id: 's2',
        value: '98%',
        label: 'Customer Satisfaction',
        description: 'Based on quarterly NPS surveys and support ratings',
      },
      {
        id: 's3',
        value: '2.5x',
        label: 'Average ROI',
        description: 'Return on investment within the first 6 months',
      },
      {
        id: 's4',
        value: '24/7',
        label: 'Support Available',
        description: 'Dedicated team across 3 time zones, always ready',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // StackedWinsList - Achievement/wins checklist (V2)
  // ─────────────────────────────────────────────────────────
  StackedWinsList: {
    headline: 'Quick Wins You\'ll Start Seeing Immediately',
    subheadline: 'These aren\'t someday-maybe promises. Our customers report these wins in their first 30 days.',
    footer_text: 'Each small win makes the next one easier. That\'s how teams go from overwhelmed to unstoppable.',
    wins: [
      {
        id: 'win-1',
        win: 'Reclaim 6+ hours every week from manual reporting',
        description: 'Automated dashboards mean no more Sunday night scrambles to build status updates.',
        category: 'Time Savings',
      },
      {
        id: 'win-2',
        win: 'Cut meeting time by 40% with async updates',
        description: 'Everyone stays aligned without the calendar bloat. Status syncs happen in the background.',
        category: 'Productivity',
      },
      {
        id: 'win-3',
        win: 'Eliminate the "which version is this?" confusion',
        description: 'Single source of truth for all your work. No more hunting through Slack or email.',
        category: 'Organization',
      },
      {
        id: 'win-4',
        win: 'Onboard new team members in days, not weeks',
        description: 'Everything they need is documented and discoverable. Self-serve context, instant productivity.',
        category: 'Scaling',
      },
      {
        id: 'win-5',
        win: 'Spot blockers before they become crises',
        description: 'Visual workflows surface stuck work early. Intervene while problems are still small.',
        category: 'Risk Management',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ResultsGallery - Visual results gallery for image tools (V2)
  // ─────────────────────────────────────────────────────────
  ResultsGallery: {
    headline: 'See What You Can Create',
    subheadline: 'AI-generated results from our users in the last 30 days.',
    gallery_items: [
      {
        id: 'g1',
        image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop',
        caption: 'Abstract landscape by Sarah M.',
      },
      {
        id: 'g2',
        image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=600&fit=crop',
        caption: 'Portrait study by James K.',
      },
      {
        id: 'g3',
        image_url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&h=600&fit=crop',
        caption: 'Digital art by Maria L.',
      },
      {
        id: 'g4',
        image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&h=600&fit=crop',
        caption: 'Concept illustration by Alex T.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // BeforeAfterQuote - Transformation testimonials (V2)
  // ─────────────────────────────────────────────────────────
  BeforeAfterQuote: {
    headline: 'Real Results from Real Customers',
    subheadline: 'See the transformations that convinced them to switch.',
    before_icon: '❌',
    after_icon: '✅',
    transformations: [
      {
        id: 't-1',
        before_situation: 'Spending 12+ hours weekly manually entering data into spreadsheets, constantly fixing formula errors',
        after_outcome: 'Automated data sync runs in background. Team reclaimed 12 hours weekly for strategic work',
        testimonial_quote: 'I used to dread Monday mornings because of the data entry backlog. Now I actually look forward to checking our real-time dashboard.',
        customer_name: 'Sarah Chen',
        customer_title: 'Operations Director',
        customer_company: 'TechFlow Solutions',
        before_icon: '😰',
        after_icon: '😊',
        avatar_url: '',
      },
      {
        id: 't-2',
        before_situation: 'Customer support tickets piling up with 48-hour average response time, frustrated customers churning',
        after_outcome: 'AI-assisted routing cut response time to 4 hours. Customer satisfaction jumped from 72% to 94%',
        testimonial_quote: 'Our support team went from firefighting to actually building relationships with customers. The difference is night and day.',
        customer_name: 'Marcus Johnson',
        customer_title: 'VP of Customer Success',
        customer_company: 'GrowthBase',
        before_icon: '📧',
        after_icon: '🚀',
        avatar_url: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ThreeStepHorizontal - Process/How it works (V2)
  // ─────────────────────────────────────────────────────────
  ThreeStepHorizontal: {
    headline: 'Ship Your Landing Page in 3 Steps',
    subheadline: 'From blank canvas to live page in under 15 minutes. No design skills required.',
    conclusion_text: 'Most founders launch their first page within an hour of signing up.',
    steps: [
      {
        id: 's1',
        title: 'Tell Us About Your Product',
        description: 'Answer a few questions about what you\'re building and who it\'s for. Our AI analyzes your market and competitors to craft positioning that actually resonates.',
      },
      {
        id: 's2',
        title: 'Pick Your Strategy',
        description: 'Choose from proven landing page frameworks—each optimized for different goals. Whether you\'re capturing leads or driving purchases, we\'ve got you covered.',
      },
      {
        id: 's3',
        title: 'Customize & Launch',
        description: 'Fine-tune your copy, swap colors, and hit publish. Your page goes live on a custom domain with built-in analytics to track every conversion.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // AccordionSteps - Detailed technical process with expandable details (V2)
  // ─────────────────────────────────────────────────────────
  AccordionSteps: {
    headline: 'Enterprise Integration Made Simple',
    subheadline: 'Follow our proven 4-step process to get your team up and running in under a week.',
    conclusion_text: 'Average implementation time: 3.5 days. Our team supports you every step of the way.',
    steps: [
      {
        id: 's1',
        title: 'Connect Your Data Sources',
        description: 'Link your existing tools with our pre-built integrations. We support Salesforce, HubSpot, Stripe, and 50+ more platforms out of the box.',
        details: 'Our integration engine uses OAuth 2.0 for secure authentication. Data syncs happen in real-time via webhooks, with fallback polling every 5 minutes. All connections are encrypted with AES-256 and monitored 24/7.',
      },
      {
        id: 's2',
        title: 'Configure Your Workflows',
        description: 'Set up automated workflows using our visual builder. No code required—just drag, drop, and connect the dots.',
        details: 'The workflow builder supports conditional logic, loops, and parallel execution paths. You can trigger workflows on schedules, events, or manual actions. Version control keeps track of all changes.',
      },
      {
        id: 's3',
        title: 'Test in Sandbox',
        description: 'Run your workflows in our isolated sandbox environment. Catch issues before they reach production.',
        details: 'Sandbox mirrors your production setup exactly. You can simulate edge cases, test error handling, and validate data transformations. Full audit logs track every action for debugging.',
      },
      {
        id: 's4',
        title: 'Deploy & Monitor',
        description: 'Push to production with one click. Real-time dashboards show you exactly what\'s happening.',
        details: 'Blue-green deployment ensures zero downtime. Automatic rollback triggers if error rates spike. Alerting integrates with Slack, PagerDuty, and email. SLA-backed uptime guarantee of 99.95%.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // VerticalTimeline - Vertical process timeline (V2)
  // ─────────────────────────────────────────────────────────
  VerticalTimeline: {
    headline: 'Get Started in Minutes',
    subheadline: 'A simple 4-step process to transform your workflow. No technical expertise required.',
    process_summary_text: 'Total setup time: under 20 minutes',
    steps: [
      {
        id: 's1',
        title: 'Create Your Account',
        description: 'Sign up with your email in under a minute. No credit card required—start your 14-day free trial instantly.',
        duration: '1 min',
      },
      {
        id: 's2',
        title: 'Connect Your Tools',
        description: 'Link your existing apps with our one-click integrations. We support Slack, Notion, Google Workspace, and 50+ more.',
        duration: '5 min',
      },
      {
        id: 's3',
        title: 'Configure Workflows',
        description: 'Set up automated workflows using our visual builder. Drag, drop, and connect—no code required.',
        duration: '10 min',
      },
      {
        id: 's4',
        title: 'Go Live',
        description: 'Launch your optimized workflows and start seeing results immediately. Real-time monitoring included.',
        duration: 'Instant',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // VideoWalkthrough - Video demo with stats and info (V2)
  // ─────────────────────────────────────────────────────────
  VideoWalkthrough: {
    headline: 'See Lessgo in Action',
    subheadline: 'Watch how founders build high-converting landing pages in under 15 minutes.',
    video_title: 'Complete Platform Walkthrough',
    video_description: 'Follow along as we build a real landing page from scratch—from strategy to publish. See exactly how the AI generates copy, how to customize designs, and how to launch in minutes.',
    video_url: '',
    video_thumbnail: '',
    video_duration: '12:34',
    demo_stats_heading: 'What You\'ll Learn',
    demo_stats: [
      { id: 'ds1', label: 'Strategy First', description: 'How AI picks the perfect page structure' },
      { id: 'ds2', label: 'Smart Copy', description: 'Watch conversion-focused copy generate live' },
      { id: 'ds3', label: 'One-Click Launch', description: 'From editor to live page in seconds' },
    ],
    video_info: [
      { id: 'vi1', text: 'Live demo walkthrough' },
      { id: 'vi2', text: '12 min watch' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // MythVsRealityGrid - Objection handling myth busting (V2)
  // ─────────────────────────────────────────────────────────
  MythVsRealityGrid: {
    headline: 'Separating Myth from Reality',
    subheadline: 'Let\'s address the common misconceptions about modern project management.',
    pairs: [
      {
        id: 'p1',
        myth: 'This is too complex for small teams',
        reality: 'Our platform is designed for teams of any size, with setup taking less than 5 minutes.',
      },
      {
        id: 'p2',
        myth: 'AI tools replace human creativity',
        reality: 'Our AI enhances your creativity by handling repetitive tasks so you can focus on strategy.',
      },
      {
        id: 'p3',
        myth: 'Implementation takes months',
        reality: 'Most customers see results within the first week—no IT support required.',
      },
      {
        id: 'p4',
        myth: 'It won\'t integrate with our existing tools',
        reality: 'We connect seamlessly with 500+ popular business tools including Slack, Notion, and Jira.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // VisualObjectionTiles - Objection handling visual tiles (V2)
  // ─────────────────────────────────────────────────────────
  VisualObjectionTiles: {
    headline: 'We Get It—Change Is Hard',
    subheadline: 'Here are the concerns we hear most, and why they shouldn\'t hold you back.',
    objections: [
      {
        id: 'o1',
        question: '"It\'s too expensive for our budget"',
        response: 'Plans start at $10/mo with no hidden fees. Most teams see ROI within 30 days.',
        label: 'Pricing',
        icon: 'lucide:dollar-sign',
      },
      {
        id: 'o2',
        question: '"We don\'t have time for another tool"',
        response: 'Setup takes under 10 minutes. No IT required. You\'ll save more time than you spend.',
        label: 'Time',
        icon: 'lucide:clock',
      },
      {
        id: 'o3',
        question: '"Our team won\'t adopt it"',
        response: 'Designed for simplicity—if they can use email, they can use this. 94% adoption rate.',
        label: 'Adoption',
        icon: 'lucide:users',
      },
      {
        id: 'o4',
        question: '"What if it doesn\'t work for us?"',
        response: '30-day money-back guarantee. No questions asked. Zero risk to try.',
        label: 'Risk',
        icon: 'lucide:shield-check',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // IndustryUseCaseGrid - Industry-specific use cases (V2)
  // ─────────────────────────────────────────────────────────
  IndustryUseCaseGrid: {
    headline: 'Trusted Across Industries',
    subheadline: 'See how leading companies leverage our platform to transform their operations.',
    industries: [
      {
        id: 'ind1',
        name: 'Healthcare',
        description: 'Streamline patient records and optimize treatment workflows with HIPAA-compliant automation.',
        icon: 'lucide:hospital',
      },
      {
        id: 'ind2',
        name: 'Financial Services',
        description: 'Accelerate compliance workflows and reduce fraud risk with intelligent monitoring.',
        icon: 'lucide:landmark',
      },
      {
        id: 'ind3',
        name: 'Manufacturing',
        description: 'Improve quality control and gain real-time supply chain visibility across facilities.',
        icon: 'lucide:factory',
      },
      {
        id: 'ind4',
        name: 'Retail & E-commerce',
        description: 'Personalize customer experiences and optimize inventory management at scale.',
        icon: 'lucide:shopping-bag',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // PersonaGrid - User persona showcase (V2)
  // ─────────────────────────────────────────────────────────
  PersonaGrid: {
    headline: 'Built for Every Team Member',
    subheadline: 'See how different roles leverage our platform to achieve their goals.',
    footer_text: 'Whatever your role, we help you work smarter and deliver results faster.',
    personas: [
      {
        id: 'p1',
        name: 'Marketing Manager',
        description: 'Track campaign performance, manage content calendars, and coordinate cross-team marketing initiatives with real-time visibility into ROI and engagement metrics.',
      },
      {
        id: 'p2',
        name: 'Sales Director',
        description: 'Monitor sales pipeline, forecast revenue, and optimize team performance while maintaining clear visibility into customer interactions and deal progression.',
      },
      {
        id: 'p3',
        name: 'Product Manager',
        description: 'Coordinate product development, manage feature requests, and track user feedback while keeping stakeholders aligned on roadmap priorities.',
      },
      {
        id: 'p4',
        name: 'Customer Success',
        description: 'Manage customer relationships, track satisfaction metrics, and proactively address issues while ensuring seamless onboarding and retention.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // RoleBasedScenarios - Role-based use cases (V2)
  // ─────────────────────────────────────────────────────────
  RoleBasedScenarios: {
    headline: 'Perfect for Every Role',
    subheadline: 'Tailored experiences for your entire team.',
    footer_text: 'No matter your role, we help you achieve more with less effort.',
    scenarios: [
      { id: 'sc1', role: 'CEO', scenario: 'Executive dashboards with strategic KPIs and board-ready reports.' },
      { id: 'sc2', role: 'CTO', scenario: 'System health monitoring, technical debt tracking, and architecture insights.' },
      { id: 'sc3', role: 'Marketing Manager', scenario: 'Campaign analytics, lead attribution, and content performance metrics.' },
      { id: 'sc4', role: 'Sales Director', scenario: 'Pipeline visibility, forecast accuracy, and rep performance tracking.' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // MethodologyBreakdown - Unique mechanism with principles (V2)
  // ─────────────────────────────────────────────────────────
  MethodologyBreakdown: {
    headline: 'The Science Behind Our Success',
    methodology_name: 'Adaptive Intelligence Framework™',
    methodology_description: 'Our proprietary methodology combines machine learning, behavioral psychology, and real-time optimization to deliver unprecedented results.',
    subheadline: 'A proven approach refined over 500+ implementations.',
    results_title: 'Proven Results',
    methodology_icon: 'lucide:brain',
    principles: [
      {
        id: 'p1',
        name: 'Continuous Learning',
        description: 'Our system continuously learns from new data and user interactions, getting smarter with every engagement.',
        icon: 'lucide:refresh-cw',
      },
      {
        id: 'p2',
        name: 'Adaptive Optimization',
        description: 'Algorithms automatically adjust strategies based on real-time performance metrics and market conditions.',
        icon: 'lucide:settings',
      },
      {
        id: 'p3',
        name: 'Data-Driven Decisions',
        description: 'Every recommendation is backed by comprehensive data analysis, eliminating guesswork from your strategy.',
        icon: 'lucide:bar-chart-3',
      },
    ],
    results: [
      { id: 'r1', metric: '300%', label: 'Performance Increase' },
      { id: 'r2', metric: '85%', label: 'Time Saved' },
      { id: 'r3', metric: '99.7%', label: 'Accuracy Rate' },
      { id: 'r4', metric: '24/7', label: 'Autonomous Operation' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ProcessFlowDiagram - Visual process flow with benefits (V2)
  // ─────────────────────────────────────────────────────────
  ProcessFlowDiagram: {
    headline: 'How Our Unique Process Works',
    subheadline: 'Our proprietary methodology delivers results in 4 simple steps.',
    benefits_title: 'Why This Process Works',
    steps: [
      { id: 's1', title: 'Data Ingestion', description: 'Secure data collection from multiple sources with real-time validation.' },
      { id: 's2', title: 'AI Analysis', description: 'Advanced machine learning algorithms analyze patterns and trends.' },
      { id: 's3', title: 'Pattern Recognition', description: 'Proprietary AI identifies unique insights and opportunities.' },
      { id: 's4', title: 'Results Delivery', description: 'Actionable insights delivered through intuitive dashboards.' },
    ],
    benefits: [
      { id: 'b1', title: '10x Faster', description: 'Automated processing reduces time from days to hours.', icon: 'lucide:zap' },
      { id: 'b2', title: '99% Accurate', description: 'AI-powered validation ensures exceptional precision.', icon: 'lucide:target' },
      { id: 'b3', title: 'Fully Customizable', description: 'Adapts to your unique business requirements.', icon: 'lucide:settings' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // SecretSauceReveal - Unique differentiators (V2)
  // ─────────────────────────────────────────────────────────
  SecretSauceReveal: {
    headline: 'Our Secret Sauce Revealed',
    subheadline: 'The proprietary methods that power your success.',
    secrets: [
      {
        id: 's1',
        title: 'Quantum Machine Learning',
        description: 'Our proprietary algorithms process data 100x faster than traditional methods.',
        icon: 'lucide:cpu',
      },
      {
        id: 's2',
        title: 'Adaptive Intelligence',
        description: 'The system learns your patterns and continuously optimizes for your goals.',
        icon: 'lucide:brain',
      },
      {
        id: 's3',
        title: 'Predictive Engine',
        description: 'Anticipate market trends before they happen with 94% accuracy.',
        icon: 'lucide:trending-up',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // StackedHighlights - Unique mechanism highlights (V2)
  // ─────────────────────────────────────────────────────────
  StackedHighlights: {
    headline: 'Our Proprietary SmartFlow System™',
    subheadline: 'Three unique capabilities that set us apart.',
    mechanism_name: 'SmartFlow Engine',
    footer_text: 'Technology you won\'t find anywhere else.',
    highlights: [
      {
        id: 'h1',
        title: 'Intelligent Auto-Prioritization',
        description: 'Our AI analyzes your workflow patterns and automatically surfaces what matters most, ensuring critical work never falls through the cracks.',
        icon: 'lucide:brain',
      },
      {
        id: 'h2',
        title: 'Dynamic Context Switching',
        description: 'The system adapts to changing priorities without losing your place, maintaining efficiency even when focus needs to shift between projects.',
        icon: 'lucide:refresh-cw',
      },
      {
        id: 'h3',
        title: 'Predictive Resource Allocation',
        description: 'Advanced algorithms predict resource needs before bottlenecks occur, automatically optimizing team capacity across all initiatives.',
        icon: 'lucide:trending-up',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // TechnicalAdvantage - Technical superiority points (V2)
  // ─────────────────────────────────────────────────────────
  TechnicalAdvantage: {
    headline: 'Technical Superiority Built-In',
    subheadline: 'Enterprise-grade technology that powers your success.',
    advantages: [
      {
        id: 'a1',
        title: '99.99% Uptime SLA',
        description: 'Enterprise-grade infrastructure with automatic failover and redundancy.',
        icon: 'lucide:server'
      },
      {
        id: 'a2',
        title: 'Sub-100ms Response',
        description: 'Globally distributed edge network ensures lightning-fast performance.',
        icon: 'lucide:zap'
      },
      {
        id: 'a3',
        title: 'SOC 2 Type II Certified',
        description: 'Bank-level security with end-to-end encryption and compliance.',
        icon: 'lucide:shield-check'
      },
      {
        id: 'a4',
        title: 'Infinite Scalability',
        description: 'Auto-scaling architecture handles millions of requests seamlessly.',
        icon: 'lucide:trending-up'
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // PropertyComparisonMatrix - Competitor comparison table (V2)
  // ─────────────────────────────────────────────────────────
  PropertyComparisonMatrix: {
    headline: 'See How We Compare',
    subheadline: 'A transparent look at what sets us apart.',
    feature_header: 'Feature',
    us_header: 'Our Platform',
    competitors_header: 'Others',
    footer_text: 'Ready to experience the difference?',
    comparison_rows: [
      { id: 'r1', property: 'Real-time Analytics', us_value: '✓ Included', competitor_value: 'Premium only' },
      { id: 'r2', property: 'API Access', us_value: 'Unlimited', competitor_value: 'Rate limited' },
      { id: 'r3', property: 'Customer Support', us_value: '24/7 Live Chat', competitor_value: 'Email only' },
      { id: 'r4', property: 'Data Export', us_value: 'All formats', competitor_value: 'CSV only' },
      { id: 'r5', property: 'Team Members', us_value: 'Unlimited', competitor_value: 'Up to 5' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // CenteredHeadlineCTA - High-conversion CTA section (V2)
  // ─────────────────────────────────────────────────────────
  CenteredHeadlineCTA: {
    headline: 'Ready to 10x Your Productivity?',
    subheadline: 'Join 50,000+ professionals who\'ve transformed their workflow with our AI-powered tools.',
    cta_text: 'Start Free Trial',
    secondary_cta_text: 'Watch Demo',
    urgency_text: '🔥 Limited Time: 50% Off First Month',
    customer_count: '50,000+',
    customer_label: 'Happy users',
    rating_stat: '4.9/5 stars',
    uptime_stat: '99.99%',
    uptime_label: 'Uptime SLA',
    trust_items: [
      { id: 't1', text: 'Free 14-day trial' },
      { id: 't2', text: 'No credit card required' },
      { id: 't3', text: 'Cancel anytime' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ValueStackCTA - Value reinforcement CTA (V2)
  // ─────────────────────────────────────────────────────────
  ValueStackCTA: {
    headline: 'Everything You Get With Your Account',
    subheadline: 'One subscription, unlimited value',
    cta_text: 'Start Free Trial',
    secondary_cta_text: 'Compare Plans',
    final_cta_headline: 'Ready to Transform Your Workflow?',
    final_cta_description: 'Join 10,000+ teams already saving time every day',
    guarantee_text: '30-day money-back guarantee',
    value_items: [
      { id: 'v1', text: 'Save 20+ hours per week on repetitive tasks' },
      { id: 'v2', text: 'Increase team productivity by 40%' },
      { id: 'v3', text: 'Real-time analytics and reporting' },
      { id: 'v4', text: 'Unlimited team members included' },
      { id: 'v5', text: 'Priority 24/7 customer support' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // VisualCTAWithMockup - CTA with product mockup (V2)
  // ─────────────────────────────────────────────────────────
  VisualCTAWithMockup: {
    headline: 'See It in Action',
    subheadline: 'Experience the power of our platform with a live demo. No installation required.',
    cta_text: 'Start Free Trial',
    secondary_cta: 'Watch Demo',
    urgency_text: '🔥 Limited Time: 50% Off First Month',
    mockup_image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    trust_items: [
      { id: 't1', text: 'Free 14-day trial' },
      { id: 't2', text: 'No credit card required' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LogoWall - Tiered social proof (V2)
  // PRIMARY: logos | SECONDARY: press | TERTIARY: certs + stats
  // ─────────────────────────────────────────────────────────
  LogoWall: {
    headline: 'Trusted by Industry Leaders',
    subheadline: 'Join 10,000+ companies that rely on our platform.',
    show_press: true,
    show_badges: true,

    companies: [
      { id: 'c1', name: 'Microsoft', logo_url: '' },
      { id: 'c2', name: 'Google', logo_url: '' },
      { id: 'c3', name: 'Stripe', logo_url: '' },
      { id: 'c4', name: 'Shopify', logo_url: '' },
      { id: 'c5', name: 'Notion', logo_url: '' },
      { id: 'c6', name: 'Figma', logo_url: '' },
    ],

    media_mentions: [
      { id: 'm1', name: 'TechCrunch', quote: '' },
      { id: 'm2', name: 'Forbes', quote: '' },
    ],

    certifications: [
      { id: 'cert1', code: 'SOC2', label: 'SOC 2 Type II' },
      { id: 'cert2', code: 'GDPR', label: 'GDPR Compliant' },
    ],

    stats: [
      { id: 's1', value: '10,000+', label: 'companies' },
      { id: 's2', value: '50+', label: 'countries' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // MinimalNavHeader - Compact nav header (V2)
  // Note: Navigation managed via store.navigationConfig in editor
  // ─────────────────────────────────────────────────────────
  MinimalNavHeader: {
    nav_items: [
      { id: 'nav-1', label: 'Home', link: '#' },
      { id: 'nav-2', label: 'Features', link: '#features' },
      { id: 'nav-3', label: 'Pricing', link: '#pricing' },
      { id: 'nav-4', label: 'Contact', link: '#contact' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ContactFooter - Footer with contact info and social links (V2)
  // ─────────────────────────────────────────────────────────
  ContactFooter: {
    footer_style: 'dark',
    copyright: `© ${new Date().getFullYear()} FlowTrack Inc. All rights reserved.`,
    newsletter_title: 'Stay in the Loop',
    newsletter_description: 'Get product updates, tips, and exclusive offers delivered straight to your inbox.',
    newsletter_cta: 'Subscribe',
    email: 'hello@flowtrack.io',
    phone: '+1 (555) 234-5678',
    address: '123 Innovation Way, San Francisco, CA 94105',
    social_links: [
      { id: 'social-1', platform: 'Twitter/X', url: 'https://twitter.com/flowtrack', icon: 'FaTwitter' },
      { id: 'social-2', platform: 'LinkedIn', url: 'https://linkedin.com/company/flowtrack', icon: 'FaLinkedin' },
      { id: 'social-3', platform: 'GitHub', url: 'https://github.com/flowtrack', icon: 'FaGithub' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Hero - LeftCopyRightImage (camelCase key per componentRegistry)
  // ─────────────────────────────────────────────────────────
  leftCopyRightImage: {
    headline: 'Ship Landing Pages That Actually Convert',
    subheadline: 'AI-powered copywriting meets beautiful design. Launch in minutes, not weeks.',
    cta_text: 'Start Free Trial',
    secondary_cta_text: 'Watch Demo',
    supporting_text: 'No credit card required • 14-day free trial',
    hero_image: '',
    badge_text: 'New',
    customer_count: '10,000+ founders',
    rating_value: '4.9/5',
    rating_count: 'from 2,500+ reviews',
    trust_items: [
      { id: 'ti1', text: 'Free 14-day trial' },
      { id: 'ti2', text: 'No credit card required' },
      { id: 'ti3', text: 'Cancel anytime' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Hero - CenterStacked (camelCase key per componentRegistry)
  // ─────────────────────────────────────────────────────────
  centerStacked: {
    headline: 'The Fastest Way to Launch Your Product',
    subheadline: 'From idea to live landing page in under 15 minutes. AI handles the copywriting while you focus on your product.',
    cta_text: 'Get Started Free',
    secondary_cta_text: 'See Examples',
    supporting_text: 'Join 10,000+ founders who launched this week',
    center_hero_image: '',
    badge_text: 'Limited Beta',
    customer_count: '10,000+',
    rating_value: '4.8/5',
    rating_count: 'from 1,200+ reviews',
    trust_items: [
      { id: 'ti1', text: 'Setup in 5 minutes' },
      { id: 'ti2', text: 'AI-powered copy' },
      { id: 'ti3', text: 'Beautiful templates' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Hero - SplitScreen (camelCase key per componentRegistry)
  // ─────────────────────────────────────────────────────────
  splitScreen: {
    headline: 'Build. Launch. Convert.',
    subheadline: 'Professional landing pages with conversion-optimized copy, ready in minutes.',
    cta_text: 'Start Building',
    secondary_cta_text: 'View Templates',
    supporting_text: 'Trusted by 50,000+ product teams worldwide',
    split_hero_image: '',
    badge_text: 'Pro',
    value_proposition: 'The complete toolkit for modern founders',
    customer_count: '50,000+',
    rating_value: '4.9/5',
    rating_count: 'from 3,000+ reviews',
    trust_items: [
      { id: 'ti1', text: 'Enterprise security' },
      { id: 'ti2', text: 'SOC 2 certified' },
      { id: 'ti3', text: '99.9% uptime' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Hero - ImageFirst (camelCase key per componentRegistry)
  // ─────────────────────────────────────────────────────────
  imageFirst: {
    headline: 'See Your Product in Action',
    subheadline: 'Let your product speak for itself with stunning hero visuals and compelling copy.',
    cta_text: 'Try It Free',
    secondary_cta_text: 'Learn More',
    supporting_text: 'Trusted by 5,000+ product teams',
    image_first_hero_image: '',
    badge_text: 'Featured',
    customer_count: '5,000+',
    rating_value: '4.7/5',
    rating_count: 'from 800+ reviews',
    trust_items: [
      { id: 'ti1', text: 'Easy integration' },
      { id: 'ti2', text: '24/7 support' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Pricing - ToggleableMonthlyYearly
  // ─────────────────────────────────────────────────────────
  ToggleableMonthlyYearly: {
    headline: 'Simple, Transparent Pricing',
    subheadline: 'Choose the plan that fits your needs. Switch between monthly and yearly anytime.',
    annual_discount_label: 'Save 20% with annual billing',
    billing_note: 'All prices in USD. Cancel anytime.',
    tiers: [
      {
        id: 'tier-1',
        name: 'Starter',
        monthly_price: '$19',
        yearly_price: '$15',
        description: 'Perfect for individuals and small teams getting started.',
        features: [
          'Up to 5 landing pages',
          'Basic analytics',
          'Email support',
          'Custom domain',
        ],
        cta_text: 'Start Free Trial',
        is_popular: false,
      },
      {
        id: 'tier-2',
        name: 'Professional',
        monthly_price: '$49',
        yearly_price: '$39',
        description: 'For growing teams that need more power and flexibility.',
        features: [
          'Unlimited landing pages',
          'Advanced analytics',
          'Priority support',
          'A/B testing',
          'Custom integrations',
          'Team collaboration',
        ],
        cta_text: 'Start Free Trial',
        is_popular: true,
      },
      {
        id: 'tier-3',
        name: 'Enterprise',
        monthly_price: '$149',
        yearly_price: '$119',
        description: 'Custom solutions for large organizations.',
        features: [
          'Everything in Pro',
          'Dedicated account manager',
          'Custom SLA',
          'SSO & advanced security',
          'Audit logs',
          'White-label options',
          'API access',
        ],
        cta_text: 'Contact Sales',
        is_popular: false,
      },
    ],
  },
};

// Placeholder text by element key patterns
const placeholderText: Record<string, string> = {
  headline: 'Transform Your Business with Smart Automation',
  subheadline: 'Streamline workflows, boost productivity, and scale effortlessly with our intelligent platform.',
  cta_text: 'Start Free Trial',
  secondary_cta_text: 'Watch Demo',
  supporting_text: 'Join 10,000+ teams already using our platform.',
  badge_text: 'New Feature',
  customer_count: '500+ happy customers',
  rating_value: '4.9/5',
  rating_count: 'from 127 reviews',
  title: 'Feature Title',
  description: 'A brief description of this feature and its benefits.',
  text: 'Trust indicator text',
  name: 'Customer Name',
  question: 'What is the most frequently asked question?',
  answer: 'Here is a helpful and informative answer to the question.',
  quote: '"This product changed everything for our team. Highly recommended!"',
  author: 'Jane Smith',
  role: 'CEO at TechCorp',
  company: 'TechCorp',
  stat_value: '99%',
  stat_label: 'Customer Satisfaction',
  price: '$29',
  period: '/month',
  plan_name: 'Pro Plan',
  // LetterStyleBlock
  letter_header: 'A Personal Note from Our Founder',
  letter_greeting: 'Dear Fellow Builder,',
  letter_body: 'Three years ago, I sat exactly where you are now—staring at a landing page that just wouldn\'t convert.\n\nI\'d tried everything. Hired expensive copywriters. A/B tested until my eyes crossed. Read every marketing book I could find.\n\nThen it hit me: the problem wasn\'t my copy. It was the process. Great landing pages need great strategy first.\n\nThat\'s why I built Lessgo. To give founders like us the strategic foundation we need before writing a single word.',
  letter_signature: 'Sushant Jain',
  founder_title: 'Founder',
  company_name: 'Lessgo',
  date_text: 'January 2025',
  ps_text: 'P.S. Every founder who joins gets a personal strategy review from me. Just reply to your welcome email.',
  founder_image: '/images/founder.jpg',
};

// Get placeholder text for an element key
function getPlaceholderForKey(key: string, type: 'string' | 'boolean' | 'number' | 'string[]' | 'array'): any {
  if (type === 'boolean') return true;
  if (type === 'number') return 0;
  if (type === 'string[]') return [];
  if (type === 'array') return [];

  // Try exact match first
  if (placeholderText[key]) return placeholderText[key];

  // Try partial matches
  for (const [pattern, value] of Object.entries(placeholderText)) {
    if (key.toLowerCase().includes(pattern.toLowerCase())) {
      return value;
    }
  }

  // Default fallback
  return `Sample ${key.replace(/_/g, ' ')}`;
}

// Generate items for a collection
function generateMockCollection(
  collectionName: string,
  collection: CollectionDef,
  count: number
): Array<Record<string, any>> {
  const items: Array<Record<string, any>> = [];

  for (let i = 0; i < count; i++) {
    const item: Record<string, any> = {};

    for (const [fieldKey, fieldDef] of Object.entries(collection.fields)) {
      if (fieldDef.fillMode === 'system') {
        // Generate system ID
        item[fieldKey] = `${collectionName.charAt(0)}${i + 1}`;
      } else if (fieldDef.default !== undefined) {
        item[fieldKey] = fieldDef.default;
      } else {
        item[fieldKey] = getPlaceholderForKey(fieldKey, fieldDef.type);
      }
    }

    items.push(item);
  }

  return items;
}

/**
 * Generate mock data from a V2 schema
 * Uses realistic mock data overrides when available
 */
export function generateMockFromSchema(layoutName: string): Record<string, any> {
  // Check for hand-crafted realistic mock data first
  if (realisticMockData[layoutName]) {
    return { ...realisticMockData[layoutName] };
  }

  const schema = layoutElementSchema[layoutName];
  if (!schema) {
    console.warn(`[MockDataGenerator] No schema found for layout: ${layoutName}`);
    return {};
  }

  if (!isV2Schema(schema)) {
    console.warn(`[MockDataGenerator] Schema is not V2 format for layout: ${layoutName}`);
    // Return minimal fallback for legacy schemas
    return {
      headline: placeholderText.headline,
      subheadline: placeholderText.subheadline,
      cta_text: placeholderText.cta_text,
    };
  }

  const result: Record<string, any> = {};

  // Generate element values
  for (const [key, def] of Object.entries(schema.elements)) {
    if (def.fillMode === 'system') continue;

    if (def.default !== undefined) {
      result[key] = def.default;
    } else {
      result[key] = getPlaceholderForKey(key, def.type);
    }
  }

  // Generate collection items
  if (schema.collections) {
    for (const [collectionName, collection] of Object.entries(schema.collections)) {
      // Generate between min and optimal number of items
      const count = Math.max(collection.constraints.min, 2);
      result[collectionName] = generateMockCollection(collectionName, collection, count);
    }
  }

  return result;
}

/**
 * Get mock data with a specific scenario (minimal, full, etc.)
 * For 'default' and 'full' scenarios, uses realistic mock data when available
 */
export function getMockScenario(
  layoutName: string,
  scenario: 'default' | 'minimal' | 'full' = 'default'
): Record<string, any> {
  // For default/full scenarios, use realistic mock data if available
  if ((scenario === 'default' || scenario === 'full') && realisticMockData[layoutName]) {
    return { ...realisticMockData[layoutName] };
  }

  const schema = layoutElementSchema[layoutName];
  if (!schema || !isV2Schema(schema)) {
    return generateMockFromSchema(layoutName);
  }

  const result: Record<string, any> = {};

  // Generate based on scenario
  for (const [key, def] of Object.entries(schema.elements)) {
    if (def.fillMode === 'system') continue;

    const isRequired = def.requirement === 'required';
    const isOptional = def.requirement === 'optional';

    if (scenario === 'minimal') {
      // Only required elements
      if (isRequired) {
        result[key] = def.default ?? getPlaceholderForKey(key, def.type);
      }
    } else if (scenario === 'full') {
      // All elements including optional
      result[key] = def.default ?? getPlaceholderForKey(key, def.type);
    } else {
      // Default: required + some optional
      if (isRequired || (isOptional && Math.random() > 0.3)) {
        result[key] = def.default ?? getPlaceholderForKey(key, def.type);
      }
    }
  }

  // Handle collections
  if (schema.collections) {
    for (const [collectionName, collection] of Object.entries(schema.collections)) {
      let count: number;

      if (scenario === 'minimal') {
        count = collection.constraints.min;
      } else if (scenario === 'full') {
        count = collection.constraints.max;
      } else {
        count = Math.max(collection.constraints.min, 2);
      }

      if (count > 0 || scenario !== 'minimal') {
        result[collectionName] = generateMockCollection(collectionName, collection, count);
      }
    }
  }

  return result;
}
