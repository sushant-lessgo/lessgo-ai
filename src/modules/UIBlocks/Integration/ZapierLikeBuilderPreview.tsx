// Integration/ZapierLikeBuilderPreview.tsx - Visual workflow builder preview
// Production-ready integration component using abstraction system with background-aware text colors

import React, { useState, useEffect } from 'react';
import { useTypography } from '@/hooks/useTypography';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface ZapierLikeBuilderPreviewContent {
  headline: string;
  subheadline?: string;
  workflow_title: string;
  trigger_app: string;
  trigger_action: string;
  action_1_app: string;
  action_1_action: string;
  action_2_app: string;
  action_2_action: string;
  action_3_app: string;
  action_3_action: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Build Powerful Workflows Without Code' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Connect your apps and automate repetitive tasks with our visual workflow builder.' 
  },
  workflow_title: { 
    type: 'string' as const, 
    default: 'New Lead to CRM & Email Sequence' 
  },
  trigger_app: { 
    type: 'string' as const, 
    default: 'Typeform' 
  },
  trigger_action: { 
    type: 'string' as const, 
    default: 'New Form Submission' 
  },
  action_1_app: { 
    type: 'string' as const, 
    default: 'HubSpot' 
  },
  action_1_action: { 
    type: 'string' as const, 
    default: 'Create Contact' 
  },
  action_2_app: { 
    type: 'string' as const, 
    default: 'Mailchimp' 
  },
  action_2_action: { 
    type: 'string' as const, 
    default: 'Add to Sequence' 
  },
  action_3_app: { 
    type: 'string' as const, 
    default: 'Slack' 
  },
  action_3_action: { 
    type: 'string' as const, 
    default: 'Send Notification' 
  }
};

// Workflow Node Component
const WorkflowNode = React.memo(({ 
  app, 
  action, 
  type, 
  isActive, 
  colorTokens
}: { 
  app: string; 
  action: string; 
  type: 'trigger' | 'action';
  isActive: boolean;
  colorTokens: any;
}) => {
  const nodeColors = {
    trigger: 'bg-gradient-to-br from-green-500 to-green-600',
    action: 'bg-gradient-to-br from-blue-500 to-blue-600'
  };

  const iconMap: { [key: string]: string } = {
    'Typeform': '📝',
    'HubSpot': '🔄',
    'Mailchimp': '📧',
    'Slack': '💬',
    'GitHub': '⚡',
    'Airtable': '📊',
    'Google Sheets': '📈',
    'Zapier': '⚡'
  };

  return (
    <div className={`relative transition-all duration-500 ${isActive ? 'scale-105 z-10' : ''}`}>
      {/* Main Node */}
      <div className={`${nodeColors[type]} rounded-xl p-4 text-white shadow-lg min-w-[200px] ${
        isActive ? 'shadow-2xl' : ''
      }`}>
        {/* App Icon and Name */}
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
            <span className="text-lg">{iconMap[app] || '🔗'}</span>
          </div>
          <span className="font-semibold text-sm">{app}</span>
        </div>

        {/* Action */}
        <p className="text-sm opacity-90 font-medium">{action}</p>

        {/* Type Badge */}
        <div className="mt-3">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white bg-opacity-20">
            {type === 'trigger' ? '🚀 Trigger' : '⚡ Action'}
          </span>
        </div>
      </div>

      {/* Success Indicator */}
      {isActive && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
});
WorkflowNode.displayName = 'WorkflowNode';

// Connection Arrow Component
const ConnectionArrow = React.memo(({ isAnimated }: { isAnimated: boolean }) => (
  <div className="flex items-center justify-center px-4">
    <div className={`w-12 h-0.5 bg-gray-300 relative ${isAnimated ? 'bg-blue-400' : ''}`}>
      {isAnimated && (
        <div className="absolute right-0 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
      )}
    </div>
    <svg 
      className={`w-4 h-4 ml-1 ${isAnimated ? 'text-blue-400' : 'text-gray-300'}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </div>
));
ConnectionArrow.displayName = 'ConnectionArrow';

export default function ZapierLikeBuilderPreview(props: LayoutComponentProps) {
  
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<ZapierLikeBuilderPreviewContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  const [activeStep, setActiveStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Build workflow steps
  const workflowSteps = [
    {
      app: blockContent.trigger_app,
      action: blockContent.trigger_action,
      type: 'trigger' as const
    },
    {
      app: blockContent.action_1_app,
      action: blockContent.action_1_action,
      type: 'action' as const
    },
    {
      app: blockContent.action_2_app,
      action: blockContent.action_2_action,
      type: 'action' as const
    },
    {
      app: blockContent.action_3_app,
      action: blockContent.action_3_action,
      type: 'action' as const
    }
  ];

  // Animate workflow execution
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setActiveStep(prev => {
          if (prev >= workflowSteps.length - 1) {
            setIsRunning(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isRunning, workflowSteps.length]);

  const runWorkflow = () => {
    setActiveStep(0);
    setIsRunning(true);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ZapierLikeBuilderPreview"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
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
              backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
              colorTokens={colorTokens}
              variant="body"
              className="text-lg leading-relaxed max-w-3xl mx-auto"
              placeholder="Add a description of your workflow builder..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Workflow Builder Interface */}
        <div className={`p-8 rounded-2xl ${colorTokens.bgSecondary} border-gray-200 border shadow-lg`}>
          
          {/* Workflow Title */}
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-xl font-semibold ${colorTokens.textPrimary}`}>
              {blockContent.workflow_title}
            </h3>
            <button
              onClick={runWorkflow}
              disabled={isRunning}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                isRunning 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : `${colorTokens.ctaBg} ${colorTokens.ctaText} hover:opacity-90`
              }`}
            >
              {isRunning ? 'Running...' : 'Test Workflow'}
            </button>
          </div>

          {/* Workflow Visualization */}
          <div className="flex items-center justify-center overflow-x-auto pb-4">
            <div className="flex items-center space-x-0 min-w-max">
              {workflowSteps.map((step, index) => (
                <React.Fragment key={index}>
                  <WorkflowNode
                    app={step.app}
                    action={step.action}
                    type={step.type}
                    isActive={isRunning && activeStep === index}
                    colorTokens={colorTokens}
                  />
                  {index < workflowSteps.length - 1 && (
                    <ConnectionArrow isAnimated={isRunning && activeStep === index} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Workflow Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className={`text-2xl font-bold ${colorTokens.textPrimary} mb-1`}>2.3s</div>
              <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Avg. Runtime</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${colorTokens.textPrimary} mb-1`}>99.9%</div>
              <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Success Rate</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${colorTokens.textPrimary} mb-1`}>1.2k</div>
              <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Runs/Month</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${colorTokens.textPrimary} mb-1`}>4</div>
              <div className={`text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>Steps</div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className={`font-semibold mb-2 ${colorTokens.textPrimary}`}>Lightning Fast</h4>
            <p className={`text-sm ${colorTokens.textSecondary}`}>Execute workflows in milliseconds with our optimized runtime</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className={`font-semibold mb-2 ${colorTokens.textPrimary}`}>Reliable</h4>
            <p className={`text-sm ${colorTokens.textSecondary}`}>99.9% uptime with automatic retries and error handling</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M11 7V5a2 2 0 012-2m0 0V2a2 2 0 012-2h4a2 2 0 012 2v2m-6 0h6" />
              </svg>
            </div>
            <h4 className={`font-semibold mb-2 ${colorTokens.textPrimary}`}>No Code Required</h4>
            <p className={`text-sm ${colorTokens.textSecondary}`}>Visual builder makes automation accessible to everyone</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button className={`px-8 py-4 rounded-lg font-semibold text-lg ${colorTokens.ctaBg} ${colorTokens.ctaText} hover:opacity-90 transition-opacity shadow-lg`}>
            Start Building Workflows
          </button>
          <p className={`mt-4 text-sm ${dynamicTextColors?.muted || colorTokens.textMuted}`}>
            No credit card required • Free forever plan available
          </p>
        </div>
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'ZapierLikeBuilderPreview',
  category: 'Integration Sections',
  description: 'Visual workflow builder preview with animated execution and interactive demo',
  tags: ['integration', 'workflow', 'automation', 'visual-builder', 'interactive'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'complex',
  estimatedBuildTime: '45 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'workflow_title', label: 'Workflow Title', type: 'text', required: true },
    { key: 'trigger_app', label: 'Trigger App Name', type: 'text', required: true },
    { key: 'trigger_action', label: 'Trigger Action', type: 'text', required: true },
    { key: 'action_1_app', label: 'Action 1 App Name', type: 'text', required: true },
    { key: 'action_1_action', label: 'Action 1 Description', type: 'text', required: true },
    { key: 'action_2_app', label: 'Action 2 App Name', type: 'text', required: true },
    { key: 'action_2_action', label: 'Action 2 Description', type: 'text', required: true },
    { key: 'action_3_app', label: 'Action 3 App Name', type: 'text', required: true },
    { key: 'action_3_action', label: 'Action 3 Description', type: 'text', required: true }
  ],
  
  features: [
    'Animated workflow execution preview',
    'Visual node-based workflow representation',
    'Interactive test workflow functionality',
    'Performance statistics display',
    'Feature highlighting with benefits'
  ],
  
  useCases: [
    'Demonstrate no-code automation capabilities',
    'Show workflow building interface',
    'Highlight integration possibilities',
    'Build confidence in automation platform'
  ]
};