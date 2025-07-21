import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
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
import { LayoutComponentProps } from '@/types/storeTypes';

interface CenterStackedContent {
  headline: string;
  cta_text: string;
  subheadline?: string;
  supporting_text?: string;
  badge_text?: string;
  trust_items?: string;
  hero_image?: string;
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
    default: 'Join 10,000+ businesses already saving 20+ hours per week with automated workflows that just work.' 
  },
  badge_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: 'Free 14-day trial|No credit card required|Cancel anytime' 
  },
  hero_image: { 
    type: 'string' as const, 
    default: '/hero-placeholder.jpg' 
  }
};

const HeroImagePlaceholder = React.memo(() => (
  <div className="relative w-full h-full min-h-[400px] max-w-3xl mx-auto">
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

        <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
          
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

export default function CenterStacked(props: LayoutComponentProps) {
  
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
  } = useLayoutComponent<CenterStackedContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : ['Free trial', 'No credit card'];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;
  
  const showImageToolbar = useEditStore((state) => state.showImageToolbar);

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="CenterStacked"
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex flex-col items-center space-y-8 min-h-[600px] justify-center">
          
          {(blockContent.badge_text || mode === 'edit') && (
            <div>
              <AccentBadge
                mode={mode}
                value={blockContent.badge_text || ''}
                onEdit={(value) => handleContentUpdate('badge_text', value)}
                colorTokens={colorTokens}
                textStyle={getTextStyle('body-sm')}
                placeholder="🎉 New Feature Launch"
                sectionId={sectionId}
                elementKey="badge_text"
                sectionBackground={sectionBackground}
              />
            </div>
          )}

          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h1"
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h1')}
            className="leading-tight max-w-3xl"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {(blockContent.subheadline || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
              className="text-lg lg:text-xl leading-relaxed max-w-2xl"
              placeholder="Add a compelling subheadline that supports your main message and explains the key benefit..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          <div className="flex flex-col sm:flex-row items-center gap-6">
            
            <CTAButton
              text={blockContent.cta_text}
              colorTokens={colorTokens}
              textStyle={getTextStyle('body-lg')}
              className="shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              variant="primary"
              sectionId={sectionId}
              elementKey="cta_text"
            />

            <TrustIndicators 
              items={trustItems}
              colorClass={mutedTextColor}
              iconColor="text-green-500"
            />
          </div>

          {(blockContent.supporting_text || mode === 'edit') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.supporting_text || ''}
              onEdit={(value) => handleContentUpdate('supporting_text', value)}
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body')}
              className="leading-relaxed max-w-xl"
              placeholder="Add supporting text with social proof, customer count, or key metrics..."
              sectionId={sectionId}
              elementKey="supporting_text"
              sectionBackground={sectionBackground}
            />
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 pt-4">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <span className={`text-sm ${mutedTextColor}`}>
                10,000+ happy customers
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className={`text-sm ${mutedTextColor} ml-2`}>
                4.9/5 rating
              </span>
            </div>
          </div>

          <div className="w-full pt-8">
            {blockContent.hero_image && blockContent.hero_image !== '' ? (
              <div className="relative w-full h-full min-h-[400px] max-w-3xl mx-auto">
                <img
                  src={blockContent.hero_image}
                  alt="Hero"
                  className="w-full h-full object-cover rounded-2xl shadow-2xl cursor-pointer"
                  data-image-id={`${sectionId}-hero-image`}
                  onMouseUp={(e) => {
                    if (mode === 'edit') {
                      e.stopPropagation();
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      showImageToolbar(`${sectionId}-hero-image`, {
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
        </div>
      </div>
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'CenterStacked',
  category: 'Hero Sections',
  description: 'Hero section with all content stacked vertically in center. Perfect for early-stage products and simple messaging.',
  tags: ['hero', 'cta', 'centered', 'stacked', 'simple'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'simple',
  estimatedBuildTime: '10 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'cta_text', label: 'CTA Button Text', type: 'text', required: true },
    { key: 'badge_text', label: 'Badge Text (uses accent colors)', type: 'text', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'hero_image', label: 'Hero Image', type: 'image', required: false }
  ],
  
  features: [
    'Centered vertical layout for simple, focused messaging',
    'Automatic text color adaptation based on background type',
    'CTA buttons use generated accent colors from design system',
    'Badge component uses brand accent colors',
    'Trust indicators adapt to background contrast',
    'Responsive design with mobile-first approach'
  ],
  
  useCases: [
    'Early-stage product launches with waitlist signup',
    'Simple messaging for unaware audiences',
    'MVP announcements with clear value proposition',
    'Community building and early access campaigns',
    'Focused conversion goals with minimal distraction'
  ]
};