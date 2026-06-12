# Pricing UIBlocks

## Overview

The Pricing UIBlocks module provides a comprehensive set of pricing components for building effective pricing sections in landing pages. These components are designed to convert visitors by clearly communicating value, offering flexible pricing options, and addressing different audience segments.

## Component Catalog

### 1. **TierCards** (`TierCards.tsx`)
**Description:** Standard pricing tier cards with feature lists and popular tier highlighting  
**Complexity:** Medium  
**Best For:** SaaS products with 2-4 pricing tiers  
**Key Features:**
- Individual feature management per tier (up to 8 features each)
- Popular tier highlighting with visual emphasis
- Trust indicators footer
- Responsive grid layout adapts to tier count
- Inline editing for all content elements

### 2. **FeatureMatrix** (`FeatureMatrix.tsx`)
**Description:** Detailed feature comparison matrix with category tabs  
**Complexity:** Complex  
**Best For:** Enterprise software with many features to compare  
**Key Features:**
- Categorized feature comparison
- Interactive category tabs
- Visual feature availability indicators (✓/✗)
- Enterprise features section
- Volume pricing support
- Feature descriptions and tooltips

### 3. **SliderPricing** (`SliderPricing.tsx`)
**Description:** Interactive pricing calculator with usage-based slider  
**Complexity:** Complex  
**Best For:** Usage-based or per-seat pricing models  
**Key Features:**
- Interactive unit slider
- Real-time price calculation
- Volume discount tiers
- Annual savings display
- Pricing breakdown component
- Quick selection presets

### 4. **ToggleableMonthlyYearly** (`ToggleableMonthlyYearly.tsx`)
**Description:** Monthly/yearly billing toggle with automatic savings calculation  
**Complexity:** Medium  
**Best For:** Subscription products with annual discounts  
**Key Features:**
- Billing cycle toggle
- Automatic savings percentage calculation
- Platform features section
- Annual discount badges
- Monthly equivalent pricing display

### 5. **MiniStackedCards** (`MiniStackedCards.tsx`)
**Description:** Compact pricing cards in a stacked layout  
**Complexity:** Simple  
**Best For:** Space-constrained designs or secondary pricing displays  
**Key Features:**
- Compact card design
- Essential feature lists
- Stacked visual hierarchy

### 6. **CallToQuotePlan** (`CallToQuotePlan.tsx`)
**Description:** Enterprise/custom pricing with contact form  
**Complexity:** Simple  
**Best For:** Enterprise solutions requiring custom quotes  
**Key Features:**
- Custom pricing messaging
- Contact sales integration
- Enterprise feature highlights

### 7. **CardWithTestimonial** (`CardWithTestimonial.tsx`)
**Description:** Pricing cards integrated with customer testimonials  
**Complexity:** Medium  
**Best For:** Building trust through social proof  
**Key Features:**
- Customer testimonial integration
- Trust-building elements
- Social proof indicators

### 8. **SegmentBasedPricing** (`SegmentBasedPricing.tsx`)
**Description:** Persona or segment-specific pricing plans  
**Complexity:** Medium  
**Best For:** Products serving distinct customer segments  
**Key Features:**
- Segment selection
- Tailored pricing per segment
- Use case highlights

## Content Structure

### Pipe-Separated Values
Most pricing components use pipe-separated values for content organization:
```
tier_names: "Starter|Professional|Enterprise"
tier_prices: "$29/month|$79/month|Contact Us"
tier_descriptions: "Perfect for small teams|For growing businesses|Custom solutions"
```

### Feature Lists
Features can be organized in multiple ways:
- **Simple lists:** Comma-separated within pipes
- **Individual fields:** `tier_1_feature_1`, `tier_1_feature_2`, etc.
- **Matrix format:** For feature availability across tiers

### Popular Tier Indicators
```
popular_tiers: "false|true|false"
```

## Implementation Guide

### Basic Usage
```tsx
import TierCards from '@/modules/UIBlocks/Pricing/TierCards';

<TierCards
  sectionId="pricing-section"
  backgroundType="neutral"
  mode={mode}
/>
```

### Content Schema
Each component defines its content schema with:
- **Required fields:** Essential content like headlines and prices
- **Optional fields:** Supporting text, trust indicators, additional features
- **Default values:** Pre-populated content for quick setup

### Edit vs Preview Modes
- **Edit Mode:** Shows all content fields, allows inline editing, displays placeholders
- **Preview Mode:** Production-ready display, optimized layout, interactive elements active

## Best Practices

### 1. Choosing the Right Component

| Audience Awareness | Recommended Component |
|-------------------|----------------------|
| Problem-Aware | TierCards, ToggleableMonthlyYearly |
| Solution-Aware | SliderPricing, FeatureMatrix |
| Product-Aware | SegmentBasedPricing, CardWithTestimonial |
| Most-Aware | CallToQuotePlan, MiniStackedCards |

### 2. Content Guidelines
- **Clear value proposition:** Lead with benefits, not just features
- **Price anchoring:** Show savings and discounts prominently
- **Trust indicators:** Include guarantees, trial periods, cancellation policies
- **Social proof:** Add customer counts, testimonials, logos
- **Urgency elements:** Limited-time offers, bonus inclusions

### 3. Visual Hierarchy
- **Popular tier:** Always highlight the recommended option
- **Contrast:** Use color and scale to guide attention
- **White space:** Don't overcrowd pricing cards
- **Progressive disclosure:** Show details on demand

### 4. Mobile Optimization
- All components are fully responsive
- Cards stack vertically on small screens
- Touch-friendly interactive elements
- Readable typography at all sizes

## Common Patterns

### Trust Indicators
```tsx
trust_items: "14-day free trial|No credit card required|Cancel anytime"
```

### Volume Discounts
```tsx
tier_breakpoints: "1|10|25|50"
tier_discounts: "0|5|10|15"
```

### Annual Savings Calculation
Components automatically calculate and display savings when both monthly and yearly prices are provided.

### Feature Availability Matrix
```tsx
feature_availability: "✓|✓|✗;✓|✓|✓;✗|✓|✓"
// Format: tier1features;tier2features;tier3features
```

## Component Configuration

### Color Tokens
All components support dynamic color tokens:
- `colorTokens.ctaBg` - Primary CTA button background
- `colorTokens.ctaText` - CTA button text color
- `colorTokens.textPrimary` - Main text color
- `colorTokens.textMuted` - Secondary text color

### Background Types
- `primary` - Brand color background
- `secondary` - Alternative brand background
- `neutral` - Gray/white background
- `divider` - Section separator background

### Typography System
Components use the centralized typography system:
```tsx
const { getTextStyle } = useTypography();
const h2Style = getTextStyle('h2');
```

## Customization Options

### Adding Custom Features
1. Extend the content schema in the component
2. Add corresponding UI elements
3. Update the `componentMeta` export
4. Handle content updates in edit mode

### Modifying Layouts
- Grid layouts adapt based on tier count
- Card spacing and padding are customizable
- Shadow and border styles can be adjusted

### Integration with Forms
Several components support form integration:
- CallToQuotePlan for quote requests
- Contact sales CTAs
- Newsletter signups in pricing sections

## Performance Considerations

- Components lazy-load icons and images
- State updates are optimized with proper memoization
- Edit mode rendering is separated from preview mode
- Content updates use efficient partial updates

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader-friendly content organization
- Color contrast compliance

## Testing Checklist

When implementing pricing components:
- [ ] All content fields are editable
- [ ] Popular tier highlighting works correctly
- [ ] Mobile responsiveness is maintained
- [ ] Interactive elements function properly
- [ ] Annual savings calculate accurately
- [ ] Trust indicators display correctly
- [ ] CTAs link to appropriate actions
- [ ] Content saves and loads properly

## Troubleshooting

### Common Issues

1. **Missing content:** Check pipe-separated format
2. **Layout issues:** Verify tier count matches content
3. **Calculation errors:** Ensure prices are numeric
4. **Styling problems:** Check background type settings
5. **Edit mode issues:** Verify mode prop is passed correctly

## Future Enhancements

Potential improvements for pricing components:
- A/B testing support for pricing experiments
- Currency localization
- Dynamic pricing based on user segment
- Integration with payment processors
- Advanced analytics tracking
- Animated transitions between billing cycles

## Support

For issues or questions about pricing components, check:
- Component source code for implementation details
- `componentMeta` exports for configuration options
- Layout system documentation for integration
- Design system guidelines for styling