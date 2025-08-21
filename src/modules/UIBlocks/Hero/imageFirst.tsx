import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useImageToolbar } from '@/hooks/useImageToolbar';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText, 
  AccentBadge 
} from '@/components/layout/EditableContent';
import { 
  CTAButton, 
  TrustIndicators 
} from '@/components/layout/ComponentRegistry';
import EditableTrustIndicators from '@/components/layout/EditableTrustIndicators';
import AvatarEditableComponent from '@/components/ui/AvatarEditableComponent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { createCTAClickHandler } from '@/utils/ctaHandler';
import { 
  parseCustomerAvatarData, 
  getCustomerAvatarUrl, 
  updateAvatarUrls,
  parsePipeData 
} from '@/utils/dataParsingUtils';

interface ImageFirstContent {
  headline: string;
  cta_text: string;
  subheadline?: string;
  supporting_text?: string;
  badge_text?: string;
  trust_items?: string;
  trust_item_1?: string;
  trust_item_2?: string;
  trust_item_3?: string;
  trust_item_4?: string;
  trust_item_5?: string;
  image_first_hero_image?: string;
  customer_count?: string;
  rating_value?: string;
  rating_count?: string;
  show_social_proof?: boolean;
  show_customer_avatars?: boolean;
  avatar_count?: number;
  // Dynamic avatar system
  customer_names?: string;
  avatar_urls?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Transform Your Business with Smart Automation' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Free Trial' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Streamline workflows, boost productivity, and scale effortlessly with our intelligent automation platform.' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: 'Save 20+ hours per week with automated workflows that just work.' 
  },
  badge_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: 'Free 14-day trial|No credit card required|Cancel anytime' 
  },
  trust_item_1: { 
    type: 'string' as const, 
    default: 'Free 14-day trial' 
  },
  trust_item_2: { 
    type: 'string' as const, 
    default: 'No credit card required' 
  },
  trust_item_3: { 
    type: 'string' as const, 
    default: 'Cancel anytime' 
  },
  trust_item_4: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_item_5: { 
    type: 'string' as const, 
    default: '' 
  },
  image_first_hero_image: { 
    type: 'string' as const, 
    default: '/hero-placeholder.jpg' 
  },
  customer_count: { 
    type: 'string' as const, 
    default: '500+ happy customers' 
  },
  rating_value: { 
    type: 'string' as const, 
    default: '4.9/5' 
  },
  rating_count: { 
    type: 'string' as const, 
    default: 'from 127 reviews' 
  },
  show_social_proof: { 
    type: 'boolean' as const, 
    default: true 
  },
  show_customer_avatars: { 
    type: 'boolean' as const, 
    default: true 
  },
  avatar_count: { 
    type: 'number' as const, 
    default: 4 
  },
  customer_names: { 
    type: 'string' as const, 
    default: 'Sarah Chen|Alex Rivera|Jordan Kim|Maya Patel' 
  },
  avatar_urls: { 
    type: 'string' as const, 
    default: '{}' 
  }
};

const HeroImagePlaceholder = React.memo(() => (
  <div className="relative w-full h-full min-h-[500px] lg:min-h-[600px]">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 rounded-2xl shadow-2xl overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-500">
      
      <div className="absolute top-6 left-6 right-6 bottom-6 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transform -rotate-1">
        
        <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center px-6">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="ml-6 flex-1 flex items-center">
            <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-500 border">
              dashboard.yourapp.com
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-gray-50 to-white h-full">
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="w-10 h-10 bg-blue-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-1">2.4k</div>
              <div className="text-xs text-gray-600 mb-1">Active Users</div>
              <div className="text-xs text-blue-600 font-medium">+12%</div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-emerald-900 mb-1">$45k</div>
              <div className="text-xs text-gray-600 mb-1">Revenue</div>
              <div className="text-xs text-emerald-600 font-medium">+8%</div>
            </div>

            <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
              <div className="w-10 h-10 bg-violet-500 rounded-lg mb-3 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded opacity-80"></div>
              </div>
              <div className="text-2xl font-bold text-violet-900 mb-1">98.2%</div>
              <div className="text-xs text-gray-600 mb-1">Uptime</div>
              <div className="text-xs text-violet-600 font-medium">+0.1%</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Performance Overview</h3>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-end justify-between h-32 space-x-2">
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-20"></div>
                <div className="text-xs text-gray-400">1</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-24"></div>
                <div className="text-xs text-gray-400">2</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-16"></div>
                <div className="text-xs text-gray-400">3</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-28"></div>
                <div className="text-xs text-gray-400">4</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-20"></div>
                <div className="text-xs text-gray-400">5</div>
              </div>
              <div className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm h-32"></div>
                <div className="text-xs text-gray-400">6</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">🚀</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">New workflow deployed</div>
                <div className="text-xs text-gray-500">2 min ago</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">📊</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Report generated</div>
                <div className="text-xs text-gray-500">5 min ago</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg">⚡</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Automation triggered</div>
                <div className="text-xs text-gray-500">8 min ago</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg flex items-center justify-center animate-pulse">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div className="absolute bottom-8 left-8 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg flex items-center justify-center animate-bounce">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  </div>
));
HeroImagePlaceholder.displayName = 'HeroImagePlaceholder';

export default function ImageFirst(props: LayoutComponentProps) {
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
  } = useLayoutComponent<ImageFirstContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const bodyLgStyle = getTypographyStyle('body-lg');

  // Handle trust items - support both legacy pipe-separated format and individual fields
  const getTrustItems = (): string[] => {
    // Check if individual trust item fields exist
    const individualItems = [
      blockContent.trust_item_1,
      blockContent.trust_item_2, 
      blockContent.trust_item_3,
      blockContent.trust_item_4,
      blockContent.trust_item_5
    ].filter((item): item is string => Boolean(item && item.trim() !== ''));
    
    // If individual items exist, use them; otherwise fall back to legacy format
    if (individualItems.length > 0) {
      return individualItems;
    }
    
    // Legacy format fallback
    return blockContent.trust_items 
      ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
      : ['Free trial', 'No credit card'];
  };
  
  const trustItems = getTrustItems();

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Handle customer avatars - support both legacy avatar_count and new dynamic system
  const getCustomerAvatars = (): { name: string; avatarUrl: string }[] => {
    // If customer_names exists, use dynamic system
    if (blockContent.customer_names) {
      const customerData = parseCustomerAvatarData(
        blockContent.customer_names, 
        blockContent.avatar_urls || '{}'
      );
      return customerData.map(customer => ({
        name: customer.name,
        avatarUrl: customer.avatarUrl || ''
      }));
    }
    
    // Fallback to legacy system with generic names
    const avatarCount = blockContent.avatar_count || 4;
    const defaultNames = ['Sarah Chen', 'Alex Rivera', 'Jordan Kim', 'Maya Patel', 'Casey Martinez', 'Taylor Wright'];
    return Array.from({ length: Math.min(avatarCount, 6) }, (_, i) => ({
      name: defaultNames[i] || `Customer ${i + 1}`,
      avatarUrl: ''
    }));
  };

  const customerAvatars = getCustomerAvatars();

  // Handle avatar URL updates
  const handleAvatarChange = (customerName: string, avatarUrl: string) => {
    const updatedAvatarUrls = updateAvatarUrls(blockContent.avatar_urls || '{}', customerName, avatarUrl);
    handleContentUpdate('avatar_urls', updatedAvatarUrls);
  };

  // Parse rating for dynamic stars
  const parseRating = (rating: string) => {
    const match = rating?.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const renderStars = (rating: string) => {
    const ratingNum = parseRating(rating);
    const stars = [];
    
    for (let i = 0; i < 5; i++) {
      if (i < Math.floor(ratingNum)) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }
    
    return <>{stars}</>;
  };

  
  // Use robust image toolbar hook
  const handleImageToolbar = useImageToolbar();

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ImageFirst"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col space-y-12 min-h-[700px]">
          
          <div className="w-full">
            {blockContent.image_first_hero_image && blockContent.image_first_hero_image !== '' ? (
              <div className="relative w-full h-full min-h-[500px] lg:min-h-[600px]">
                <img
                  src={blockContent.image_first_hero_image}
                  alt="Hero"
                  className="w-full h-full object-cover rounded-2xl shadow-2xl cursor-pointer"
                  data-image-id={`${sectionId}-image-first-hero-image`}
                  onMouseUp={(e) => {
                    if (mode === 'edit') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleImageToolbar(`${sectionId}-image-first-hero-image`, {
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }
                  }}
                />
              </div>
            ) : (
              <HeroImagePlaceholder />
            )}
          </div>

          <div className="max-w-4xl mx-auto text-center space-y-8">
            
            {(blockContent.badge_text || mode === 'edit') && (
              <div>
                <AccentBadge
                  mode={mode}
                  value={blockContent.badge_text || ''}
                  onEdit={(value) => handleContentUpdate('badge_text', value)}
                  colorTokens={colorTokens}
                  placeholder="🎉 New Feature Launch"
                  sectionId={sectionId}
                  elementKey="badge_text"
                  sectionBackground={sectionBackground}
                />
              </div>
            )}

            <EditableAdaptiveHeadline
              mode={mode}
              value={blockContent.headline || ''}
              onEdit={(value) => handleContentUpdate('headline', value)}
              level="h1"
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              className="leading-tight max-w-3xl mx-auto"
              sectionId={sectionId}
              elementKey="headline"
              sectionBackground={sectionBackground}
            />

            {(blockContent.subheadline || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.subheadline || ''}
                onEdit={(value) => handleContentUpdate('subheadline', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="leading-relaxed max-w-2xl mx-auto"
                style={bodyLgStyle}
                placeholder="Add a compelling subheadline that supports your main message and explains the key benefit..."
                sectionId={sectionId}
                elementKey="subheadline"
                sectionBackground={sectionBackground}
              />
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              
              <CTAButton
                text={blockContent.cta_text}
                colorTokens={colorTokens}
                className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
                variant="primary"
                sectionId={sectionId}
                elementKey="cta_text"
                onClick={createCTAClickHandler(sectionId, "cta_text")}
              />

              {mode === 'edit' ? (
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
                    const fieldKey = `trust_item_${index + 1}` as keyof ImageFirstContent;
                    handleContentUpdate(fieldKey, value);
                  }}
                  onAddTrustItem={() => {
                    // Find first empty slot and add placeholder
                    const emptyIndex = [
                      blockContent.trust_item_1,
                      blockContent.trust_item_2,
                      blockContent.trust_item_3,
                      blockContent.trust_item_4,
                      blockContent.trust_item_5
                    ].findIndex(item => !item || item.trim() === '' || item === '___REMOVED___');
                    
                    if (emptyIndex !== -1) {
                      const fieldKey = `trust_item_${emptyIndex + 1}` as keyof ImageFirstContent;
                      handleContentUpdate(fieldKey, 'New trust item');
                    }
                  }}
                  onRemoveTrustItem={(index) => {
                    const fieldKey = `trust_item_${index + 1}` as keyof ImageFirstContent;
                    handleContentUpdate(fieldKey, '___REMOVED___');
                  }}
                  colorTokens={colorTokens}
                  sectionBackground={sectionBackground}
                  sectionId={sectionId}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  iconColor="text-green-500"
                  colorClass={mutedTextColor}
                />
              ) : (
                <TrustIndicators 
                  items={trustItems}
                  colorClass={mutedTextColor}
                  iconColor="text-green-500"
                />
              )}
            </div>

            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="leading-relaxed max-w-xl mx-auto"
                placeholder="Add supporting text with social proof, customer count, or key metrics..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
              />
            )}

            {(blockContent.show_social_proof !== false) && (
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-4">
                {blockContent.customer_count && blockContent.customer_count !== '___REMOVED___' && (
                  <div className="relative group/customer-item flex items-center space-x-2">
                    {blockContent.show_customer_avatars !== false && (
                      <div className="flex -space-x-2">
                        {customerAvatars.map((customer, i) => (
                          <AvatarEditableComponent
                            key={customer.name}
                            mode={mode}
                            avatarUrl={customer.avatarUrl}
                            onAvatarChange={(url) => handleAvatarChange(customer.name, url)}
                            customerName={customer.name}
                            size="sm"
                            className="cursor-default"
                          />
                        ))}
                      </div>
                    )}
                    <EditableAdaptiveText
                      mode={mode}
                      value={blockContent.customer_count || ''}
                      onEdit={(value) => handleContentUpdate('customer_count', value)}
                      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                      colorTokens={colorTokens}
                      variant="body"
                      className="text-sm"
                      placeholder="500+ happy customers"
                      sectionBackground={sectionBackground}
                      data-section-id={sectionId}
                      data-element-key="customer_count"
                    />
                    
                    {/* Remove button for customer count */}
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('customer_count', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/customer-item:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                        title="Remove customer count"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                
                {blockContent.rating_value && blockContent.rating_value !== '___REMOVED___' && (
                  <div className="relative group/rating-item flex items-center space-x-1">
                    {renderStars(blockContent.rating_value)}
                    <div className="flex items-center space-x-1 ml-2">
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.rating_value || ''}
                        onEdit={(value) => handleContentUpdate('rating_value', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm"
                        placeholder="4.9/5"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="rating_value"
                      />
                      <EditableAdaptiveText
                        mode={mode}
                        value={blockContent.rating_count || ''}
                        onEdit={(value) => handleContentUpdate('rating_count', value)}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm"
                        placeholder="from 127 reviews"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key="rating_count"
                      />
                    </div>
                    
                    {/* Remove button for rating section */}
                    {mode === 'edit' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContentUpdate('rating_value', '___REMOVED___');
                          handleContentUpdate('rating_count', '___REMOVED___');
                        }}
                        className="opacity-0 group-hover/rating-item:opacity-100 ml-2 p-1 rounded-full bg-white/80 hover:bg-white text-red-500 hover:text-red-700 transition-all duration-200 relative z-10 shadow-sm"
                        title="Remove rating section"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'ImageFirst',
  category: 'Hero Sections',
  description: 'Visual-first hero layout with prominent image at top. Perfect for design tools, demos, and product showcases.',
  tags: ['hero', 'cta', 'visual-first', 'demo', 'product-showcase'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '15 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'badge_text', label: 'Badge Text (uses accent colors)', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'trust_item_1', label: 'Trust Item 1', type: 'text', required: false },
    { key: 'trust_item_2', label: 'Trust Item 2', type: 'text', required: false },
    { key: 'trust_item_3', label: 'Trust Item 3', type: 'text', required: false },
    { key: 'trust_item_4', label: 'Trust Item 4', type: 'text', required: false },
    { key: 'trust_item_5', label: 'Trust Item 5', type: 'text', required: false },
    { key: 'customer_count', label: 'Customer Count', type: 'text', required: false },
    { key: 'rating_value', label: 'Rating (e.g., 4.9/5)', type: 'text', required: false },
    { key: 'rating_count', label: 'Review Count (e.g., from 127 reviews)', type: 'text', required: false },
    { key: 'show_social_proof', label: 'Show Social Proof', type: 'boolean', required: false },
    { key: 'show_customer_avatars', label: 'Show Customer Avatars', type: 'boolean', required: false },
    { key: 'avatar_count', label: 'Number of Avatars (1-6) - Legacy', type: 'number', required: false },
    { key: 'customer_names', label: 'Customer Names (pipe separated)', type: 'text', required: false },
    { key: 'avatar_urls', label: 'Avatar URLs (JSON format)', type: 'text', required: false },
    { key: 'image_first_hero_image', label: 'Hero Image', type: 'image', required: false }
  ],
  
  features: [
    'Large hero image prominently displayed at top',
    'Visual-first approach for product demonstrations',
    'Centered content layout below image for clear messaging',
    'Automatic text color adaptation based on background type',
    'CTA buttons use generated accent colors from design system',
    'Trust indicators and social proof below main content'
  ],
  
  useCases: [
    'Design and creative tools showcasing visual output',
    'AI tools demonstrating capabilities and results',
    'Product demos and free trial conversions',
    'No-code platforms showing built results',
    'Visual products where seeing is believing'
  ]
};