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
  // QuoteGrid - Testimonial quote cards (V2)
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
        icon: 'calendar',
      },
      {
        id: 'cc-2',
        title: 'Request a Quote',
        description: 'Get a custom pricing proposal based on your team size and requirements.',
        cta: 'Get Quote',
        icon: 'dollar-sign',
      },
      {
        id: 'cc-3',
        title: 'Talk to Sales',
        description: 'Have questions? Our enterprise team is ready to help you find the right solution.',
        cta: 'Contact Sales',
        icon: 'phone',
      },
    ],
    trust_items: [
      { id: 'ti-1', text: 'No commitment required' },
      { id: 'ti-2', text: 'Free consultation' },
      { id: 'ti-3', text: 'Custom implementation support' },
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
