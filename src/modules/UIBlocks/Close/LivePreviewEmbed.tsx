import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
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
import { LayoutComponentProps } from '@/types/storeTypes';

interface LivePreviewEmbedContent {
  headline: string;
  preview_description: string;
  preview_type: string;
  demo_features: string;
  interactive_elements: string;
  cta_text: string;
  secondary_cta?: string;
  demo_stats?: string;
  demo_benefits?: string;
  access_note?: string;
  subheadline?: string;
  supporting_text?: string;
  trust_items?: string;
  live_demo_icon?: string;
  secure_icon?: string;
  instant_icon?: string;
  full_access_icon?: string;
}

const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'See Our Platform in Action' 
  },
  preview_description: { 
    type: 'string' as const, 
    default: 'Experience the power of our platform with this interactive demo. Click around and explore the features that will transform your workflow.' 
  },
  preview_type: { 
    type: 'string' as const, 
    default: 'Interactive Dashboard' 
  },
  demo_features: { 
    type: 'string' as const, 
    default: 'Real-time Analytics|Task Automation|Team Collaboration|Custom Reports|Integration Hub|Mobile Access' 
  },
  interactive_elements: { 
    type: 'string' as const, 
    default: 'Click any chart to drill down|Try the search functionality|Toggle between different views|Explore the settings panel|Test the notification system' 
  },
  cta_text: { 
    type: 'string' as const, 
    default: 'Start Your Free Trial' 
  },
  secondary_cta: { 
    type: 'string' as const, 
    default: 'Schedule Personal Demo' 
  },
  demo_stats: { 
    type: 'string' as const, 
    default: '2 minutes|No signup required|Full feature access|Live data simulation' 
  },
  demo_benefits: { 
    type: 'string' as const, 
    default: 'See exactly how it works|Test with your use case|No commitment required|Instant access' 
  },
  access_note: { 
    type: 'string' as const, 
    default: 'This demo runs with simulated data. Your actual setup would connect to your real systems.' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: '' 
  },
  supporting_text: { 
    type: 'string' as const, 
    default: '' 
  },
  trust_items: { 
    type: 'string' as const, 
    default: '' 
  },
  live_demo_icon: { 
    type: 'string' as const, 
    default: '🎥' 
  },
  secure_icon: { 
    type: 'string' as const, 
    default: '🔒' 
  },
  instant_icon: { 
    type: 'string' as const, 
    default: '⚡' 
  },
  full_access_icon: { 
    type: 'string' as const, 
    default: '✅' 
  }
};

export default function LivePreviewEmbed(props: LayoutComponentProps) {
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
  } = useLayoutComponent<LivePreviewEmbedContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });
  
  // Create typography styles
  const h2Style = getTypographyStyle('h2');
  const h3Style = getTypographyStyle('h3');
  const bodyLgStyle = getTypographyStyle('body-lg');

  const [activeDemo, setActiveDemo] = useState(0);

  const demoFeatures = blockContent.demo_features 
    ? blockContent.demo_features.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const interactiveElements = blockContent.interactive_elements 
    ? blockContent.interactive_elements.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const demoStats = blockContent.demo_stats 
    ? blockContent.demo_stats.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const demoBenefits = blockContent.demo_benefits 
    ? blockContent.demo_benefits.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const trustItems = blockContent.trust_items 
    ? blockContent.trust_items.split('|').map(item => item.trim()).filter(Boolean)
    : [];

  const mutedTextColor = dynamicTextColors?.muted || colorTokens.textMuted;

  // Filter out 'custom' background type as it's not supported by EditableContent components
  const safeBackgroundType = props.backgroundType === 'custom' ? 'neutral' : (props.backgroundType || 'neutral');

  const DemoPreview = () => (
    <div className="bg-gray-900 rounded-xl p-1 shadow-2xl">
      {/* Browser Chrome */}
      <div className="bg-gray-800 rounded-t-xl px-4 py-3 flex items-center space-x-2">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-gray-300 text-sm">
          app.yourplatform.com/dashboard
        </div>
      </div>
      
      {/* Demo Interface */}
      <div className="bg-white rounded-b-xl p-6 min-h-[400px]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h3 className="font-semibold text-gray-900" style={h3Style}>{blockContent.preview_type}</h3>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
        
        {/* Feature Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {demoFeatures.slice(0, 4).map((feature, index) => (
            <button
              key={index}
              onClick={() => setActiveDemo(index)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeDemo === index
                  ? `${colorTokens.ctaBg} text-white`
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {feature}
            </button>
          ))}
        </div>
        
        {/* Demo Content Area */}
        <div className="space-y-4">
          
          {/* Charts/Graphs Simulation */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Active Users</span>
                <span className="text-xs text-green-600">+12%</span>
              </div>
              <div className="font-bold text-blue-600" style={h2Style}>2,847</div>
              <div className="w-full h-2 bg-blue-200 rounded mt-2">
                <div className="w-3/4 h-2 bg-blue-500 rounded"></div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Revenue</span>
                <span className="text-xs text-green-600">+24%</span>
              </div>
              <div className="font-bold text-green-600" style={h2Style}>$52,840</div>
              <div className="w-full h-2 bg-green-200 rounded mt-2">
                <div className="w-4/5 h-2 bg-green-500 rounded"></div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 hover:bg-purple-100 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Efficiency</span>
                <span className="text-xs text-green-600">+8%</span>
              </div>
              <div className="font-bold text-purple-600" style={h2Style}>94%</div>
              <div className="w-full h-2 bg-purple-200 rounded mt-2">
                <div className="w-11/12 h-2 bg-purple-500 rounded"></div>
              </div>
            </div>
          </div>
          
          {/* Interactive Elements */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Recent Activity</h4>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
            </div>
            
            <div className="space-y-2">
              {['Task automation completed successfully', 'New team member added to project', 'Report generated and sent to stakeholders'].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer">
                  <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-700">{activity}</span>
                  <span className="text-xs text-gray-500 ml-auto">{index + 1}m ago</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button className={`px-4 py-2 ${colorTokens.ctaBg} text-white rounded-lg hover:opacity-90 transition-opacity`}>
              Create New Project
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="LivePreviewEmbed"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'neutral')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={safeBackgroundType}
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
              backgroundType={safeBackgroundType}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg mb-8 max-w-3xl mx-auto"
              placeholder="Add optional subheadline to introduce the live preview..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}

          <div className="max-w-4xl mx-auto">
            <p className="text-gray-700 leading-relaxed" style={bodyLgStyle}>
              {blockContent.preview_description}
            </p>
          </div>
        </div>

        {mode === 'edit' ? (
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-4">Live Preview Content</h4>
              
              <div className="space-y-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.preview_description || ''}
                  onEdit={(value) => handleContentUpdate('preview_description', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Preview description"
                  sectionId={sectionId}
                  elementKey="preview_description"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.preview_type || ''}
                  onEdit={(value) => handleContentUpdate('preview_type', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Preview type (e.g., Dashboard, App, Tool)"
                  sectionId={sectionId}
                  elementKey="preview_type"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.demo_features || ''}
                  onEdit={(value) => handleContentUpdate('demo_features', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Demo features (pipe separated)"
                  sectionId={sectionId}
                  elementKey="demo_features"
                  sectionBackground={sectionBackground}
                />
                
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.interactive_elements || ''}
                  onEdit={(value) => handleContentUpdate('interactive_elements', value)}
                  backgroundType={safeBackgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="mb-2"
                  placeholder="Interactive elements (pipe separated)"
                  sectionId={sectionId}
                  elementKey="interactive_elements"
                  sectionBackground={sectionBackground}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            
            {/* Demo Preview */}
            <div className="lg:col-span-2">
              <DemoPreview />
              
              {/* Interactive Guide */}
              <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Try These Interactive Elements:
                </h4>
                <div className="space-y-2">
                  {interactiveElements.map((element, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-blue-800 text-sm">{element}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* CTA and Benefits Sidebar */}
            <div className="space-y-6">
              
              {/* Demo Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Demo Details</h4>
                <div className="space-y-3">
                  {demoStats.map((stat, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{stat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Why Try This Demo?</h4>
                <div className="space-y-3">
                  {demoBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4">
                <CTAButton
                  text={blockContent.cta_text}
                  colorTokens={colorTokens}
                  className="w-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                  variant="primary"
                  sectionId={sectionId}
                  elementKey="cta_text"
                />
                
                {blockContent.secondary_cta && (
                  <CTAButton
                    text={blockContent.secondary_cta}
                    colorTokens={colorTokens}
                    className="w-full"
                    variant="secondary"
                    sectionId={sectionId}
                    elementKey="secondary_cta"
                  />
                )}
              </div>

              {/* Access Note */}
              {blockContent.access_note && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-yellow-800">{blockContent.access_note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Trust Elements */}
        <div className="mt-16 text-center">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                <IconEditableText
                  mode={mode}
                  value={blockContent.live_demo_icon || '🎥'}
                  onEdit={(value) => handleContentUpdate('live_demo_icon', value)}
                  className="text-blue-600 text-xl"
                />
              </div>
              <div className="font-semibold text-gray-900">Live Demo</div>
              <div className={`text-sm ${mutedTextColor}`}>Real-time simulation</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <IconEditableText
                  mode={mode}
                  value={blockContent.secure_icon || '🔒'}
                  onEdit={(value) => handleContentUpdate('secure_icon', value)}
                  className="text-green-600 text-xl"
                />
              </div>
              <div className="font-semibold text-gray-900">Secure</div>
              <div className={`text-sm ${mutedTextColor}`}>Safe to explore</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                <IconEditableText
                  mode={mode}
                  value={blockContent.instant_icon || '⚡'}
                  onEdit={(value) => handleContentUpdate('instant_icon', value)}
                  className="text-purple-600 text-xl"
                />
              </div>
              <div className="font-semibold text-gray-900">Instant</div>
              <div className={`text-sm ${mutedTextColor}`}>No waiting time</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                <IconEditableText
                  mode={mode}
                  value={blockContent.full_access_icon || '✅'}
                  onEdit={(value) => handleContentUpdate('full_access_icon', value)}
                  className="text-orange-600 text-xl"
                />
              </div>
              <div className="font-semibold text-gray-900">Full Access</div>
              <div className={`text-sm ${mutedTextColor}`}>All features available</div>
            </div>
          </div>
        </div>

        {(blockContent.supporting_text || blockContent.trust_items || mode === 'edit') && (
          <div className="text-center space-y-6">
            {(blockContent.supporting_text || mode === 'edit') && (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.supporting_text || ''}
                onEdit={(value) => handleContentUpdate('supporting_text', value)}
                backgroundType={safeBackgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="max-w-3xl mx-auto mb-8"
                placeholder="Add optional supporting text to reinforce the live preview value..."
                sectionId={sectionId}
                elementKey="supporting_text"
                sectionBackground={sectionBackground}
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
    </LayoutSection>
  );
}

export const componentMeta = {
  name: 'LivePreviewEmbed',
  category: 'Close',
  description: 'Interactive product demo with live preview simulation. Perfect for showcasing software features and user experience.',
  tags: ['demo', 'preview', 'interactive', 'software', 'simulation', 'showcase'],
  defaultBackgroundType: 'neutral' as const,
  complexity: 'complex',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'preview_description', label: 'Preview Description', type: 'textarea', required: true },
    { key: 'preview_type', label: 'Preview Type (Dashboard, App, etc.)', type: 'text', required: true },
    { key: 'demo_features', label: 'Demo Features (pipe separated)', type: 'textarea', required: true },
    { key: 'interactive_elements', label: 'Interactive Elements (pipe separated)', type: 'textarea', required: true },
    { key: 'cta_text', label: 'Primary CTA Text', type: 'text', required: true },
    { key: 'secondary_cta', label: 'Secondary CTA Text', type: 'text', required: false },
    { key: 'demo_stats', label: 'Demo Stats (pipe separated)', type: 'text', required: false },
    { key: 'demo_benefits', label: 'Demo Benefits (pipe separated)', type: 'textarea', required: false },
    { key: 'access_note', label: 'Access Note', type: 'text', required: false },
    { key: 'supporting_text', label: 'Supporting Text', type: 'textarea', required: false },
    { key: 'trust_items', label: 'Trust Indicators (pipe separated)', type: 'text', required: false },
    { key: 'live_demo_icon', label: 'Live Demo Icon', type: 'text', required: false },
    { key: 'secure_icon', label: 'Secure Icon', type: 'text', required: false },
    { key: 'instant_icon', label: 'Instant Icon', type: 'text', required: false },
    { key: 'full_access_icon', label: 'Full Access Icon', type: 'text', required: false }
  ],
  
  features: [
    'Interactive demo simulation',
    'Tabbed feature exploration',
    'Real-time data visualization',
    'Browser-like interface design',
    'Interactive elements guide',
    'Trust and benefit reinforcement'
  ],
  
  useCases: [
    'SaaS product demonstrations',
    'Software feature showcases',
    'Dashboard and analytics tools',
    'Interactive app previews',
    'Product experience simulation'
  ]
};