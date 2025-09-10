import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { 
  CTAButton,
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import { LayoutComponentProps } from '@/types/storeTypes';

interface FeatureTestimonialContent {
  headline: string;
  feature_titles: string;
  feature_descriptions: string;
  testimonial_quotes: string;
  testimonial_names: string;
  testimonial_roles: string;
  testimonial_avatars?: string;
  // Individual feature icon fields
  feature_icon_1?: string;
  feature_icon_2?: string;
  feature_icon_3?: string;
  feature_icon_4?: string;
  feature_icon_5?: string;
  feature_icon_6?: string;
  // Individual testimonial avatar fields for image toolbar support
  testimonial_avatar_0?: string;
  testimonial_avatar_1?: string;
  testimonial_avatar_2?: string;
  testimonial_avatar_3?: string;
  testimonial_avatar_4?: string;
  testimonial_avatar_5?: string;
  subheadline?: string;
  supporting_text?: string;
  cta_text?: string;
  trust_items?: string;
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  trust_item_5?: string;
  // Trust Banner Fields
  trust_banner_title?: string;
  trust_metric_1?: string;
  trust_label_1?: string;
  trust_metric_2?: string;
  trust_label_2?: string;
  trust_metric_3?: string;
  trust_label_3?: string;
  trust_metric_4?: string;
  trust_label_4?: string;
  show_trust_banner?: boolean;
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
  },
  trust_item_1: { 
    type: 'string' as const, 
    default: 'SOC 2 Type II certified' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: '99.99% uptime SLA' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: '24/7 dedicated support' 
  },
  trust_item_4: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_item_5: { 
    type: 'string' as const, 
    default: '' 
  },
  // Individual feature icon fields
  feature_icon_1: { 
    type: 'string' as const, 
    default: '✨' 
  },
  feature_icon_2: { 
    type: 'string' as const, 
    default: '🔒' 
  },
  feature_icon_3: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  feature_icon_4: { 
    type: 'string' as const, 
    default: '🔗' 
  },
  feature_icon_5: { 
    type: 'string' as const, 
    default: '📊' 
  },
  feature_icon_6: { 
    type: 'string' as const, 
    default: '🎯' 
  },
  // Individual testimonial avatar fields for image toolbar support
  testimonial_avatar_0: { 
    type: 'string' as const, 
    default: '' 
  },
  testimonial_avatar_1: { 
    type: 'string' as const, 
    default: '' 
  },
  testimonial_avatar_2: { 
    type: 'string' as const, 
    default: '' 
  },
  testimonial_avatar_3: { 
    type: 'string' as const, 
    default: '' 
  },
  testimonial_avatar_4: { 
    type: 'string' as const, 
    default: '' 
  },
  testimonial_avatar_5: { 
    type: 'string' as const, 
    default: '' 
  },
  // Trust Banner Schema
  trust_banner_title: { 
    type: 'string' as const, 
    default: 'Trusted by 10,000+ Enterprise Teams' 
  },
  trust_metric_1: { 
    type: 'string' as const, 
    default: '99.99%' 
  },
  trust_label_1: { 
    type: 'string' as const, 
    default: 'Uptime SLA' 
  },
  trust_metric_2: { 
    type: 'string' as const, 
    default: 'SOC 2' 
  },
  trust_label_2: { 
    type: 'string' as const, 
    default: 'Type II Certified' 
  },
  trust_metric_3: { 
    type: 'string' as const, 
    default: '24/7' 
  },
  trust_label_3: { 
    type: 'string' as const, 
    default: 'Enterprise Support' 
  },
  trust_metric_4: { 
    type: 'string' as const, 
    default: 'GDPR' 
  },
  trust_label_4: { 
    type: 'string' as const, 
    default: 'Compliant' 
  },
  show_trust_banner: { 
    type: 'boolean' as const, 
    default: true 
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
  mutedTextColor,
  h3Style,
  handleContentUpdate,
  backgroundType,
  sectionBackground,
  blockContent,
  onRemove,
  handleImageToolbar
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
  h3Style: React.CSSProperties;
  handleContentUpdate: (key: any, value: string) => void;
  backgroundType: any;
  sectionBackground?: any;
  blockContent: FeatureTestimonialContent;
  onRemove?: () => void;
  handleImageToolbar: (imageId: string, position: { x: number; y: number }) => void;
}) => {
  
  const AvatarPlaceholder = React.memo(({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
    <div 
      className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer hover:bg-gradient-to-br hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
      onClick={onClick}
    >
      <span className="text-white font-bold text-lg">
        {name.split(' ').map(n => n[0]).join('')}
      </span>
      {mode === 'edit' && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
          Click to add avatar
        </div>
      )}
    </div>
  ));

  // Get the individual icon for this feature
  const getFeatureIcon = (): string => {
    const iconField = `feature_icon_${index + 1}` as keyof FeatureTestimonialContent;
    return (blockContent[iconField] as string) || '✨';
  };

  // Get individual avatar for this testimonial
  const getTestimonialAvatar = (): string => {
    const avatarField = `testimonial_avatar_${index}` as keyof FeatureTestimonialContent;
    return (blockContent[avatarField] as string) || avatar || '';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col group relative">
      
      <div className="mb-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${colorTokens.ctaBg} flex items-center justify-center shadow-lg`}>
            <IconEditableText
              mode={mode as 'edit' | 'preview'}
              value={getFeatureIcon()}
              onEdit={(value) => {
                const iconField = `feature_icon_${index + 1}` as keyof FeatureTestimonialContent;
                handleContentUpdate(iconField, value);
              }}
              backgroundType={backgroundType as any}
              colorTokens={colorTokens}
              iconSize="md"
              className="text-white text-2xl"
              sectionId={sectionId}
              elementKey={`feature_icon_${index + 1}`}
            />
          </div>
          <div className="flex-1 relative">
            {/* Editable Feature Title */}
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const featureTitles = blockContent.feature_titles ? blockContent.feature_titles.split('|') : [];
                  featureTitles[index] = e.currentTarget.textContent || '';
                  handleContentUpdate('feature_titles', featureTitles.join('|'));
                }}
                className="text-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[32px]"
                data-placeholder="Feature title"
                style={h3Style}
              >
                {title}
              </div>
            ) : (
              <h3 style={h3Style} className="text-xl font-bold text-gray-900">{title}</h3>
            )}
          </div>
        </div>
        
        {/* Editable Feature Description */}
        {mode !== 'preview' ? (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const featureDescriptions = blockContent.feature_descriptions ? blockContent.feature_descriptions.split('|') : [];
              featureDescriptions[index] = e.currentTarget.textContent || '';
              handleContentUpdate('feature_descriptions', featureDescriptions.join('|'));
            }}
            className="text-gray-600 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[60px]"
            data-placeholder="Feature description"
          >
            {description}
          </div>
        ) : (
          <p className="text-gray-600 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100">
        <blockquote className="mb-4">
          {/* Editable Testimonial Quote */}
          {mode !== 'preview' ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const testimonialQuotes = blockContent.testimonial_quotes ? blockContent.testimonial_quotes.split('|') : [];
                testimonialQuotes[index] = e.currentTarget.textContent || '';
                handleContentUpdate('testimonial_quotes', testimonialQuotes.join('|'));
              }}
              className={`text-sm italic ${mutedTextColor} leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 cursor-text hover:bg-gray-50 min-h-[40px]`}
              data-placeholder="Testimonial quote"
            >
              "{quote}"
            </div>
          ) : (
            <p className={`text-sm italic ${mutedTextColor} leading-relaxed`}>
              "{quote}"
            </p>
          )}
        </blockquote>
        
        <div className="flex items-center space-x-3">
          {/* Editable Testimonial Avatar with Image Toolbar */}
          {getTestimonialAvatar() && getTestimonialAvatar() !== '' ? (
            <img
              src={getTestimonialAvatar()}
              alt={name}
              className="w-12 h-12 rounded-full object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-400 transition-colors duration-200"
              data-image-id={`${sectionId}.testimonial_avatar_${index}`}
              onMouseUp={(e) => {
                if (mode === 'edit') {
                  e.stopPropagation();
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const imageId = `${sectionId}.testimonial_avatar_${index}`;
                  const position = {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  };
                  handleImageToolbar(imageId, position);
                }
              }}
              onClick={(e) => {
                if (mode === 'edit') {
                  e.stopPropagation();
                  e.preventDefault();
                }
              }}
            />
          ) : (
            <AvatarPlaceholder 
              onClick={(e) => {
                if (mode === 'edit') {
                  e.stopPropagation();
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const imageId = `${sectionId}.testimonial_avatar_${index}`;
                  const position = {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  };
                  handleImageToolbar(imageId, position);
                }
              }}
            />
          )}
          
          <div className="flex-1">
            {/* Editable Testimonial Name */}
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const testimonialNames = blockContent.testimonial_names ? blockContent.testimonial_names.split('|') : [];
                  testimonialNames[index] = e.currentTarget.textContent || '';
                  handleContentUpdate('testimonial_names', testimonialNames.join('|'));
                }}
                className="text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 py-0.5 cursor-text hover:bg-gray-50 min-h-[24px]"
                data-placeholder="Testimonial name"
              >
                {name}
              </div>
            ) : (
              <div className="text-sm font-semibold text-gray-900">{name}</div>
            )}
            
            {/* Editable Testimonial Role */}
            {mode !== 'preview' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const testimonialRoles = blockContent.testimonial_roles ? blockContent.testimonial_roles.split('|') : [];
                  testimonialRoles[index] = e.currentTarget.textContent || '';
                  handleContentUpdate('testimonial_roles', testimonialRoles.join('|'));
                }}
                className={`text-xs ${mutedTextColor} outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 py-0.5 cursor-text hover:bg-gray-50 min-h-[20px]`}
                data-placeholder="Testimonial role"
              >
                {role}
              </div>
            ) : (
              <div className={`text-xs ${mutedTextColor}`}>{role}</div>
            )}
          </div>
        </div>
      </div>

      {/* Remove Feature Button - only in edit mode */}
      {mode === 'edit' && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 text-red-500 hover:text-red-700 transition-opacity duration-200 z-10 bg-white rounded-full p-1 shadow-md"
          title="Remove this feature"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});
FeatureCard.displayName = 'FeatureCard';

export default function FeatureTestimonial(props: LayoutComponentProps) {
  const { getTextStyle: getTypographyStyle } = useTypography();
  
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
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');
  
  // Helper function to get feature icon
  const getFeatureIcon = (index: number) => {
    const iconField = `feature_icon_${index + 1}` as keyof FeatureTestimonialContent;
    return blockContent[iconField] || '✨';
  };

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

  // Handle trust items - support both legacy pipe-separated format and individual fields
  const getTrustItems = (): string[] => {
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2, 
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== '' && item !== '___REMOVED___'));
    
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    return blockContent.trust_items 
      ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
      : [];
  };
  
  const trustItems = getTrustItems();

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const store = useEditStore();
  const showImageToolbar = store.showImageToolbar;
  
  // Initialize image toolbar hook
  const handleImageToolbar = useImageToolbar();

  // Helper function to get individual testimonial avatar
  const getTestimonialAvatar = (index: number): string => {
    const fieldName = `testimonial_avatar_${index}` as keyof FeatureTestimonialContent;
    return (blockContent[fieldName] as string) || '';
  };

  // Migration logic: Convert pipe-separated testimonial_avatars to individual fields
  React.useEffect(() => {
    if (blockContent.testimonial_avatars && !blockContent.testimonial_avatar_0) {
      const testimonialAvatars = blockContent.testimonial_avatars.split('|').map(item => item.trim()).filter(Boolean);
      const updates: Partial<FeatureTestimonialContent> = {};
      
      testimonialAvatars.forEach((avatar, index) => {
        if (index < 6) { // Max 6 features
          const fieldName = `testimonial_avatar_${index}` as keyof FeatureTestimonialContent;
          updates[fieldName] = avatar as any;
        }
      });
      
      // Apply all updates at once
      Object.entries(updates).forEach(([key, value]) => {
        handleContentUpdate(key as keyof FeatureTestimonialContent, value as string);
      });
    }
  }, [blockContent.testimonial_avatars, blockContent.testimonial_avatar_0, handleContentUpdate]);
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="FeatureTestimonial"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
            colorTokens={colorTokens}
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
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
              colorTokens={colorTokens}
              variant="body"
              style={bodyLgStyle}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce your enterprise features..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Features Grid - Same layout for both edit and preview modes */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              quote={feature.quote}
              name={feature.name}
              role={feature.role}
              avatar={getTestimonialAvatar(index) || feature.avatar}
              index={index}
              showImageToolbar={showImageToolbar}
              sectionId={sectionId}
              mode={mode}
              colorTokens={colorTokens}
              backgroundType={backgroundType}
              mutedTextColor={mutedTextColor}
              h3Style={h3Style}
              handleContentUpdate={handleContentUpdate}
              sectionBackground={sectionBackground}
              blockContent={blockContent}
              handleImageToolbar={handleImageToolbar}
              onRemove={features.length > 1 ? () => {
                const featureTitles = blockContent.feature_titles ? blockContent.feature_titles.split('|') : [];
                const featureDescriptions = blockContent.feature_descriptions ? blockContent.feature_descriptions.split('|') : [];
                const testimonialQuotes = blockContent.testimonial_quotes ? blockContent.testimonial_quotes.split('|') : [];
                const testimonialNames = blockContent.testimonial_names ? blockContent.testimonial_names.split('|') : [];
                const testimonialRoles = blockContent.testimonial_roles ? blockContent.testimonial_roles.split('|') : [];
                
                // Remove from pipe-separated fields
                featureTitles.splice(index, 1);
                featureDescriptions.splice(index, 1);
                testimonialQuotes.splice(index, 1);
                testimonialNames.splice(index, 1);
                testimonialRoles.splice(index, 1);
                
                // Remove the avatar field for the feature being deleted and shift remaining fields
                const avatarsToShift = [];
                for (let i = 0; i < 6; i++) {
                  const fieldName = `testimonial_avatar_${i}` as keyof FeatureTestimonialContent;
                  const value = (blockContent[fieldName] as string) || '';
                  avatarsToShift.push(value);
                }
                
                // Remove the avatar at the index and shift remaining ones
                avatarsToShift.splice(index, 1);
                
                // Update all avatar fields with shifted values
                for (let i = 0; i < 6; i++) {
                  const fieldName = `testimonial_avatar_${i}` as keyof FeatureTestimonialContent;
                  const newValue = avatarsToShift[i] || '';
                  handleContentUpdate(fieldName, newValue);
                }
                
                handleContentUpdate('feature_titles', featureTitles.join('|'));
                handleContentUpdate('feature_descriptions', featureDescriptions.join('|'));
                handleContentUpdate('testimonial_quotes', testimonialQuotes.join('|'));
                handleContentUpdate('testimonial_names', testimonialNames.join('|'));
                handleContentUpdate('testimonial_roles', testimonialRoles.join('|'));
              } : undefined}
            />
          ))}
          
          {/* Add Feature Button - only in edit mode */}
          {mode === 'edit' && features.length < 6 && (
            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  const featureTitles = blockContent.feature_titles ? blockContent.feature_titles.split('|') : [];
                  const featureDescriptions = blockContent.feature_descriptions ? blockContent.feature_descriptions.split('|') : [];
                  const testimonialQuotes = blockContent.testimonial_quotes ? blockContent.testimonial_quotes.split('|') : [];
                  const testimonialNames = blockContent.testimonial_names ? blockContent.testimonial_names.split('|') : [];
                  const testimonialRoles = blockContent.testimonial_roles ? blockContent.testimonial_roles.split('|') : [];
                  
                  const newFeatureIndex = featureTitles.length;
                  featureTitles.push(`Feature ${newFeatureIndex + 1}`);
                  featureDescriptions.push('Add feature description here');
                  testimonialQuotes.push('Add testimonial quote here');
                  testimonialNames.push('Customer Name');
                  testimonialRoles.push('Title at Company');
                  
                  // Set default icon for the new feature
                  const defaultIcons = ['✨', '🔒', '⚡', '🔗', '📊', '🎯'];
                  const defaultIcon = defaultIcons[newFeatureIndex] || '✨';
                  const iconFieldName = `feature_icon_${newFeatureIndex + 1}` as keyof FeatureTestimonialContent;
                  
                  handleContentUpdate('feature_titles', featureTitles.join('|'));
                  handleContentUpdate('feature_descriptions', featureDescriptions.join('|'));
                  handleContentUpdate('testimonial_quotes', testimonialQuotes.join('|'));
                  handleContentUpdate('testimonial_names', testimonialNames.join('|'));
                  handleContentUpdate('testimonial_roles', testimonialRoles.join('|'));
                  handleContentUpdate(iconFieldName, defaultIcon);
                }}
                className="h-full min-h-[400px] w-full border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600 transition-all duration-300 flex flex-col items-center justify-center space-y-4 bg-gray-50 hover:bg-gray-100 rounded-xl"
                title="Add new feature"
              >
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium text-lg">Add Feature</span>
                <span className="text-sm text-gray-400">Click to add a new feature card</span>
              </button>
            </div>
          )}
        </div>

        {/* Trust Banner - Editable */}
        {blockContent.show_trust_banner !== false && (blockContent.trust_banner_title || mode === 'edit') && (
          <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
            <div className="text-center">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.trust_banner_title || ''}
                onEdit={(value) => handleContentUpdate('trust_banner_title', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
                textStyle={{
                  ...getTypographyStyle('h3'),
                  fontWeight: 600
                }}
                className="text-gray-900 mb-4"
                placeholder="Trust banner title..."
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="trust_banner_title"
              />
              
              <div className="flex flex-wrap justify-center gap-8">
                {/* Trust Metric 1 */}
                {(blockContent.trust_metric_1 || mode === 'edit') && blockContent.trust_metric_1 !== '___REMOVED___' && (
                  <div className="text-center group/trust-item relative">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.trust_metric_1 || ''}
                      onEdit={(value) => handleContentUpdate('trust_metric_1', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-3xl font-bold text-gray-900"
                      placeholder="Metric 1"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="trust_metric_1"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.trust_label_1 || ''}
                      onEdit={(value) => handleContentUpdate('trust_label_1', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Label 1"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="trust_label_1"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('trust_metric_1', '___REMOVED___');
                          handleContentUpdate('trust_label_1', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/trust-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove trust metric 1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {/* Trust Metric 2 */}
                {(blockContent.trust_metric_2 || mode === 'edit') && blockContent.trust_metric_2 !== '___REMOVED___' && (
                  <div className="text-center group/trust-item relative">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.trust_metric_2 || ''}
                      onEdit={(value) => handleContentUpdate('trust_metric_2', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-3xl font-bold text-gray-900"
                      placeholder="Metric 2"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="trust_metric_2"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.trust_label_2 || ''}
                      onEdit={(value) => handleContentUpdate('trust_label_2', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Label 2"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="trust_label_2"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('trust_metric_2', '___REMOVED___');
                          handleContentUpdate('trust_label_2', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/trust-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove trust metric 2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {/* Trust Metric 3 */}
                {(blockContent.trust_metric_3 || mode === 'edit') && blockContent.trust_metric_3 !== '___REMOVED___' && (
                  <div className="text-center group/trust-item relative">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.trust_metric_3 || ''}
                      onEdit={(value) => handleContentUpdate('trust_metric_3', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-3xl font-bold text-gray-900"
                      placeholder="Metric 3"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="trust_metric_3"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.trust_label_3 || ''}
                      onEdit={(value) => handleContentUpdate('trust_label_3', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Label 3"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="trust_label_3"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('trust_metric_3', '___REMOVED___');
                          handleContentUpdate('trust_label_3', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/trust-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove trust metric 3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {/* Trust Metric 4 */}
                {(blockContent.trust_metric_4 || mode === 'edit') && blockContent.trust_metric_4 !== '___REMOVED___' && (
                  <div className="text-center group/trust-item relative">
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.trust_metric_4 || ''}
                      onEdit={(value) => handleContentUpdate('trust_metric_4', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-3xl font-bold text-gray-900"
                      placeholder="Metric 4"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="trust_metric_4"
                    />
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.trust_label_4 || ''}
                      onEdit={(value) => handleContentUpdate('trust_label_4', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                      colorTokens={colorTokens}
                      variant="body"
                      className={`text-sm ${mutedTextColor}`}
                      placeholder="Label 4"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="trust_label_4"
                    />
                    {mode !== 'preview' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('trust_metric_4', '___REMOVED___');
                          handleContentUpdate('trust_label_4', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/trust-item:opacity-100 absolute -top-2 -right-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 shadow-sm"
                        title="Remove trust metric 4"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(blockContent.cta_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6 mt-16">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                colorTokens={colorTokens}
                variant="body"
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
                    className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                    variant="primary"
                    sectionId={sectionId}
                    elementKey="cta_text"
                  />
                )}

                {(trustItems.length > 0 || mode === 'edit') && (
                  <div>
                    {mode !== 'preview' ? (
                      <EditableTrustIndicators
                        mode={mode}
                        trustItems={[
                          blockContent.trust_item_1 || '',
                          blockContent.trust_item_2 || '',
                          blockContent.trust_item_3 || '',
                          blockContent.trust_item_4 || '',
                          blockContent.trust_item_5 || ''
                        ]}
                        onTrustItemChange={(index, value) => {
                          const fieldKey = `trust_item_${index + 1}` as keyof FeatureTestimonialContent;
                          handleContentUpdate(fieldKey, value);
                        }}
                        onAddTrustItem={() => {
                          const emptyIndex = [
                            blockContent.trust_item_1,
                            blockContent.trust_item_2,
                            blockContent.trust_item_3,
                            blockContent.trust_item_4,
                            blockContent.trust_item_5
                          ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                          
                          if (emptyIndex !== -1) {
                            const fieldKey = `trust_item_${emptyIndex + 1}` as keyof FeatureTestimonialContent;
                            handleContentUpdate(fieldKey, 'New trust item');
                          }
                        }}
                        onRemoveTrustItem={(index) => {
                          const fieldKey = `trust_item_${index + 1}` as keyof FeatureTestimonialContent;
                          handleContentUpdate(fieldKey, '___REMOVED___');
                        }}
                        colorTokens={colorTokens}
                        sectionBackground={sectionBackground}
                        sectionId={sectionId}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
                        iconColor="text-green-500"
                        colorClass={mutedTextColor}
                      />
                    ) : (
                      trustItems.length > 0 && (
                        <TrustIndicators 
                          items={trustItems}
                          colorClass={mutedTextColor}
                          iconColor="text-green-500"
                        />
                      )
                    )}
                  </div>
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
    { key: 'feature_icon_1', label: 'Feature 1 Icon', type: 'text', required: false },
    { key: 'feature_icon_2', label: 'Feature 2 Icon', type: 'text', required: false },
    { key: 'feature_icon_3', label: 'Feature 3 Icon', type: 'text', required: false },
    { key: 'feature_icon_4', label: 'Feature 4 Icon', type: 'text', required: false },
    { key: 'feature_icon_5', label: 'Feature 5 Icon', type: 'text', required: false },
    { key: 'feature_icon_6', label: 'Feature 6 Icon', type: 'text', required: false },
    { key: 'testimonial_avatar_0', label: 'Testimonial 1 Avatar', type: 'image', required: false },
    { key: 'testimonial_avatar_1', label: 'Testimonial 2 Avatar', type: 'image', required: false },
    { key: 'testimonial_avatar_2', label: 'Testimonial 3 Avatar', type: 'image', required: false },
    { key: 'testimonial_avatar_3', label: 'Testimonial 4 Avatar', type: 'image', required: false },
    { key: 'testimonial_avatar_4', label: 'Testimonial 5 Avatar', type: 'image', required: false },
    { key: 'testimonial_avatar_5', label: 'Testimonial 6 Avatar', type: 'image', required: false },
    { key: 'trust_banner_title', label: 'Trust Banner Title', type: 'text', required: false },
    { key: 'trust_metric_1', label: 'Trust Metric 1', type: 'text', required: false },
    { key: 'trust_label_1', label: 'Trust Label 1', type: 'text', required: false },
    { key: 'trust_metric_2', label: 'Trust Metric 2', type: 'text', required: false },
    { key: 'trust_label_2', label: 'Trust Label 2', type: 'text', required: false },
    { key: 'trust_metric_3', label: 'Trust Metric 3', type: 'text', required: false },
    { key: 'trust_label_3', label: 'Trust Label 3', type: 'text', required: false },
    { key: 'trust_metric_4', label: 'Trust Metric 4', type: 'text', required: false },
    { key: 'trust_label_4', label: 'Trust Label 4', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false }
  ],
  
  features: [
    'WYSIWYG inline editing for all content',
    'Feature cards with integrated testimonials',
    'Inline contentEditable for titles, descriptions, quotes',
    'Image toolbar support for testimonial avatars',
    'Editable icons with IconEditableText',
    'Add/remove feature cards dynamically',
    'Enterprise trust indicators',
    'Trust metrics banner',
    'Perfect for B2B enterprise sales',
    'Consistent edit and preview experience'
  ],
  
  useCases: [
    'Enterprise software features',
    'B2B platform capabilities',
    'Trust-building for established companies',
    'High-stakes decision making',
    'Growth and scale-stage startups'
  ]
};