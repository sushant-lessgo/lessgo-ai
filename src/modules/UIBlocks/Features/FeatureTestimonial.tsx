import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import { LayoutComponentProps } from '@/types/storeTypes';

interface FeatureTestimonialContent {
  headline: string;
  feature_titles: string;
  feature_descriptions: string;
  testimonial_quotes: string;
  testimonial_names: string;
  testimonial_roles: string;
  testimonial_avatars?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Enterprise Features Trusted by Industry Leaders' 
  },
  feature_titles: { 
    type: 'string' as const, 
    default: 'Advanced Security & Compliance|Scalable Infrastructure|Dedicated Support|Custom Integrations' 
  },
  feature_descriptions: { 
    type: 'string' as const, 
    default: 'SOC 2 Type II certified with enterprise-grade security, GDPR compliance, and advanced access controls.|Handle millions of requests with our auto-scaling infrastructure and 99.99% uptime SLA guarantee.|24/7 priority support with dedicated success managers and custom onboarding for your team.|Seamlessly integrate with your existing tech stack through our robust API and pre-built connectors.' 
  },
  testimonial_quotes: { 
    type: 'string' as const, 
    default: 'The security features gave us confidence to migrate our entire operation. Best decision we made.|Scaling from 100 to 100,000 users was seamless. The infrastructure just works.|Our dedicated support team knows our business inside out. It\'s like having an extended team.|We integrated with our 15+ tools in days, not months. The flexibility is unmatched.' 
  },
  testimonial_names: { 
    type: 'string' as const, 
    default: 'Sarah Chen|Michael Rodriguez|Emma Thompson|David Park' 
  },
  testimonial_roles: { 
    type: 'string' as const, 
    default: 'CISO at TechCorp|VP Engineering at ScaleUp|COO at Enterprise Inc|CTO at Innovation Labs' 
  },
  testimonial_avatars: { 
    type: 'string' as const, 
    default: '/avatar1.jpg|/avatar2.jpg|/avatar3.jpg|/avatar4.jpg' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  }
};

const FeatureCard = React.memo(({ 
  title, 
  description, 
  quote,
  name,
  role,
  avatar,
  index,
  showImageToolbar,
  sectionId,
  mode,
  colorTokens,
  mutedTextColor
}: {
  title: string;
  description: string;
  quote: string;
  name: string;
  role: string;
  avatar?: string;
  index: number;
  showImageToolbar: any;
  sectionId: string;
  mode: string;
  colorTokens: any;
  mutedTextColor: string;
}) => {
  
  const AvatarPlaceholder = () => (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
      <span className="text-white font-bold text-lg">
        {name.split(' ').map(n => n[0]).join('')}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      
      <div className="mb-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${colorTokens.ctaBg} flex items-center justify-center shadow-lg`}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
        </div>
        
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100">
        <blockquote className="mb-4">
          <p className={`text-sm italic ${mutedTextColor} leading-relaxed`}>
            "{quote}"
          </p>
        </blockquote>
        
        <div className="flex items-center space-x-3">
          {avatar && avatar !== '' ? (
            <img
              src={avatar}
              alt={name}
              className="w-12 h-12 rounded-full object-cover cursor-pointer border-2 border-gray-200"
              data-image-id={`${sectionId}-testimonial${index}-avatar`}
              onMouseUp={(e) => {
                if (mode === 'edit') {
                  e.stopPropagation();
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  showImageToolbar(`${sectionId}-testimonial${index}-avatar`, {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  });
                }
              }}
            />
          ) : (
            <AvatarPlaceholder />
          )}
          
          <div>
            <div className="text-sm font-semibold text-gray-900">{name}</div>
            <div className={`text-xs ${mutedTextColor}`}>{role}</div>
          </div>
        </div>
      </div>
    </div>
  );
});
FeatureCard.displayName = 'FeatureCard';

export default function FeatureTestimonial(props: LayoutComponentProps) {
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<FeatureTestimonialContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const featureTitles = blockContent.feature_titles 
    ? blockContent.feature_titles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const featureDescriptions = blockContent.feature_descriptions 
    ? blockContent.feature_descriptions.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonialQuotes = blockContent.testimonial_quotes 
    ? blockContent.testimonial_quotes.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonialNames = blockContent.testimonial_names 
    ? blockContent.testimonial_names.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonialRoles = blockContent.testimonial_roles 
    ? blockContent.testimonial_roles.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const testimonialAvatars = blockContent.testimonial_avatars 
    ? blockContent.testimonial_avatars.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const features = featureTitles.map((title, index) => ({
    title,
    description: featureDescriptions[index] || '',
    quote: testimonialQuotes[index] || '',
    name: testimonialNames[index] || '',
    role: testimonialRoles[index] || '',
    avatar: testimonialAvatars[index] || ''
  }));

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const showImageToolbar = useEditStore((state) => state.showImageToolbar);
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="FeatureTestimonial"
      backgroundType={props.backgroundType || 'neutral'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'neutral'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType || 'neutral'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your enterprise features..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Feature & Testimonial Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_titles}
                  onEdit={(value) => handleContentUpdate('feature_titles', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Feature titles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_titles"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.feature_descriptions}
                  onEdit={(value) => handleContentUpdate('feature_descriptions', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Feature descriptions (pipe separated)"
                  sectionId={sectionId}
                  elementKey="feature_descriptions"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.testimonial_quotes}
                  onEdit={(value) => handleContentUpdate('testimonial_quotes', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Testimonial quotes (pipe separated)"
                  sectionId={sectionId}
                  elementKey="testimonial_quotes"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.testimonial_names}
                  onEdit={(value) => handleContentUpdate('testimonial_names', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  className="mb-2"
                  placeholder="Testimonial names (pipe separated)"
                  sectionId={sectionId}
                  elementKey="testimonial_names"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.testimonial_roles}
                  onEdit={(value) => handleContentUpdate('testimonial_roles', value)}
                  backgroundType={props.backgroundType || 'neutral'}
                  colorTokens={colorTokens}
                  variant="body"
                  textStyle={getTextStyle('body')}
                  placeholder="Testimonial roles (pipe separated)"
                  sectionId={sectionId}
                  elementKey="testimonial_roles"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                quote={feature.quote}
                name={feature.name}
                role={feature.role}
                avatar={feature.avatar}
                index={index}
                showImageToolbar={showImageToolbar}
                sectionId={sectionId}
                mode={mode}
                colorTokens={colorTokens}
                mutedTextColor={mutedTextColor}
              />
            ))}
          </div>
        )}

        {/* Trust Banner */}
        <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Trusted by 10,000+ Enterprise Teams
            </h3>
            
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">99.99%</div>
                <div className={`text-sm ${mutedTextColor}`}>Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">SOC 2</div>
                <div className={`text-sm ${mutedTextColor}`}>Type II Certified</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">24/7</div>
                <div className={`text-sm ${mutedTextColor}`}>Enterprise Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">GDPR</div>
                <div className={`text-sm ${mutedTextColor}`}>Compliant</div>
              </div>
            </div>
          </div>
        </div>

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType || 'neutral'}
                colorTokens={colorTokens}
                variant="body"
                textStyle={getTextStyle('body-lg')}
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce enterprise trust..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(blockContent.cta_text || trustItems.length > 0) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {blockContent.cta_text && (
                  <CTAButton
                    text={blockContent.cta_text}
                    colorTokens={colorTokens}
                    textStyle={getTextStyle('body-lg')}
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />
                )}

                {trustItems.length > 0 && (
                  <TrustIndicators 
                    items={trustItems}
                    colorClass={mutedTextColor}
                    iconColor="text-green-500"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'FeatureTestimonial',
  category: 'Features',
  description: 'Features combined with testimonials for trust-building. Perfect for enterprise and established companies.',
  tags: ['features', 'testimonials', 'enterprise', 'trust', 'social-proof'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '25 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'feature_titles', label: 'Feature Titles (pipe separated)', type: 'textarea', required: true },
    { key: 'feature_descriptions', label: 'Feature Descriptions (pipe separated)', type: 'textarea', required: true },
    { key: 'testimonial_quotes', label: 'Testimonial Quotes (pipe separated)', type: 'textarea', required: true },
    { key: 'testimonial_names', label: 'Testimonial Names (pipe separated)', type: 'text', required: true },
    { key: 'testimonial_roles', label: 'Testimonial Roles (pipe separated)', type: 'text', required: true },
    { key: 'testimonial_avatars', label: 'Testimonial Avatars (pipe separated)', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'Feature cards with integrated testimonials',
    'Enterprise trust indicators',
    'Avatar support for testimonials',
    'Trust metrics banner',
    'Perfect for B2B enterprise sales',
    'Social proof integrated with features'
  ],
  
  useCases: [
    'Enterprise software features',
    'B2B platform capabilities',
    'Trust-building for established companies',
    'High-stakes decision making',
    'Growth and scale-stage startups'
  ]
};