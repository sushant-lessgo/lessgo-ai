// EnhancedAddSection.tsx - Complete multi-step section addition flow
"use client";

import React, { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SectionTypeSelector } from './SectionTypeSelector';
import { LayoutSelector } from './LayoutSelector';
import { layoutElementSchema } from '@/modules/sections/layoutElementSchema';
import { sectionList } from '@/modules/sections/sectionList';
import type { EditableElement } from '@/types/core/content';

interface EnhancedAddSectionProps {
  position: 'between' | 'end';
  afterSectionId?: string;
  existingSections: string[];
  onAddSection: (
    sectionType: string,
    layoutId: string,
    elements: Record<string, EditableElement>,
    position?: number
  ) => void;
  className?: string;
}

export function EnhancedAddSection({
  position,
  afterSectionId,
  existingSections,
  onAddSection,
  className
}: EnhancedAddSectionProps) {
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Handle section type selection
  const handleSectionSelect = useCallback((sectionType: string) => {
    setSelectedSection(sectionType);
    setShowSectionSelector(false);
    setShowLayoutSelector(true);
  }, []);

  // Mapping from sectionList IDs to layoutRegistry keys (same as LayoutSelector)
  const sectionToRegistryKey = (sectionId: string): string => {
    const mapping: Record<string, string> = {
      'beforeAfter': 'BeforeAfter',
      'closeSection': 'Close', 
      'comparisonTable': 'Comparison',
      'cta': 'CTA',
      'features': 'Features',
      'faq': 'FAQ',
      'founderNote': 'FounderNote',
      'hero': 'Hero',
      'howItWorks': 'HowItWorks',
      'integrations': 'Integration',
      'objectionHandling': 'Objection',
      'pricing': 'Pricing',
      'problem': 'Problem',
      'results': 'Results',
      'security': 'Security',
      'socialProof': 'SocialProof',
      'testimonials': 'Testimonial',
      'uniqueMechanism': 'UniqueMechanism',
      'useCases': 'UseCase',
    };
    return mapping[sectionId] || sectionId;
  };

  // Handle layout selection and create section
  const handleLayoutSelect = useCallback((layoutId: string) => {
    if (!selectedSection) return;

    // Get elements for this layout using the correct registry key
    const registryKey = sectionToRegistryKey(selectedSection);
    const schemaKey = `${registryKey}/${layoutId}` as keyof typeof layoutElementSchema;
    const elementDefs = layoutElementSchema[schemaKey] || [];
    
    // Get section info for default content
    const sectionInfo = sectionList.find(s => s.id === selectedSection);
    
    // Create elements object with all mandatory and optional elements
    const elements: Record<string, EditableElement> = {};
    
    elementDefs.forEach(({ element, mandatory }) => {
      // Generate default content based on element name
      const defaultContent = getDefaultContent(selectedSection, element, sectionInfo?.label || '');
      
      // Determine element type
      const elementType = getElementType(element);
      
      elements[element] = {
        content: defaultContent,
        type: elementType,
        isEditable: true,
        editMode: 'inline',
        validation: mandatory ? {
          required: true,
          minLength: elementType === 'headline' ? 10 : 5,
        } : undefined,
        aiContext: {
          generationType: 'creative',
          contextElements: [element],
          instructions: `This is the ${element} for the ${sectionInfo?.label} section`,
          generateVariations: false,
        },
      };
    });

    // Calculate position
    const insertPosition = afterSectionId 
      ? existingSections.indexOf(afterSectionId) + 1 
      : existingSections.length;

    // Call the add section handler with ORIGINAL section name (not mapped)
    onAddSection(selectedSection, layoutId, elements, insertPosition);

    // Reset state
    setShowLayoutSelector(false);
    setSelectedSection(null);
  }, [selectedSection, afterSectionId, existingSections, onAddSection]);

  // Close handlers
  const handleCloseSectionSelector = () => {
    setShowSectionSelector(false);
    setSelectedSection(null);
  };

  const handleCloseLayoutSelector = () => {
    setShowLayoutSelector(false);
    setSelectedSection(null);
  };

  return (
    <>
      {position === 'between' ? (
        // Between sections - show on hover with better visibility
        <div className="group relative py-8 -my-4">
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="bg-background border-2 border-dashed border-primary/30 rounded-lg px-8 py-4 shadow-lg">
              <Button
                variant="outline"
                size="sm"
                className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => setShowSectionSelector(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section Here
              </Button>
            </div>
          </div>
          <div className="h-px bg-border opacity-20 group-hover:opacity-60 transition-opacity" />
        </div>
      ) : (
        // End section - always visible with prominent styling
        <div className="flex justify-center py-12">
          <Button
            variant="outline"
            size="lg"
            className={cn(
              "border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10",
              "text-primary hover:border-primary/60 transition-all duration-200",
              "px-8 py-6 text-base font-medium rounded-xl shadow-sm hover:shadow-md",
              className
            )}
            onClick={() => setShowSectionSelector(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Section
          </Button>
        </div>
      )}

      <SectionTypeSelector
        isOpen={showSectionSelector}
        onClose={handleCloseSectionSelector}
        existingSections={existingSections}
        onSectionSelect={handleSectionSelect}
      />

      <LayoutSelector
        isOpen={showLayoutSelector}
        onClose={handleCloseLayoutSelector}
        sectionType={selectedSection}
        onLayoutSelect={handleLayoutSelect}
      />
    </>
  );
}

// Helper function to generate default content
function getDefaultContent(sectionType: string, element: string, sectionName: string): string | string[] {
  const defaults: Record<string, Record<string, string | string[]>> = {
    hero: {
      headline: 'Transform Your Business Today',
      subheadline: 'Discover how our solution can help you achieve your goals',
      supporting_text: 'Join thousands of satisfied customers',
      badge_text: 'New',
      cta_text: 'Get Started',
      cta_secondary: 'Learn More',
    },
    features: {
      headline: 'Powerful Features',
      subheadline: 'Everything you need to succeed',
      feature_titles: ['Feature One', 'Feature Two', 'Feature Three'],
      feature_descriptions: [
        'Description of feature one benefits',
        'Description of feature two benefits',
        'Description of feature three benefits'
      ],
    },
    testimonials: {
      headline: 'What Our Customers Say',
      subheadline: 'Real stories from real users',
      quotes: [
        'This product changed how we work',
        'Incredible results in just weeks',
        'Best investment we ever made'
      ],
      authors: ['John Doe', 'Jane Smith', 'Mike Johnson'],
      companies: ['Acme Corp', 'Tech Inc', 'Growth Co'],
      roles: ['CEO', 'CTO', 'Marketing Director'],
    },
    pricing: {
      headline: 'Simple, Transparent Pricing',
      subheadline: 'Choose the plan that works for you',
      tier_names: ['Starter', 'Professional', 'Enterprise'],
      tier_prices: ['$9/mo', '$29/mo', 'Custom'],
      tier_descriptions: [
        'Perfect for individuals',
        'Great for growing teams',
        'Tailored for large organizations'
      ],
    },
    faq: {
      headline: 'Frequently Asked Questions',
      subheadline: 'Get answers to common questions',
      questions: [
        'How does it work?',
        'What are the key features?',
        'How much does it cost?'
      ],
      answers: [
        'Our solution works by...',
        'Key features include...',
        'We offer flexible pricing...'
      ],
    },
  };

  // Return specific default or generic based on section/element
  return defaults[sectionType]?.[element] || 
    (element.includes('list') || element.includes('array') ? [] : `${element.charAt(0).toUpperCase() + element.slice(1)} content here`);
}

// Helper function to determine element type
function getElementType(element: string): EditableElement['type'] {
  if (element.includes('headline')) return 'headline';
  if (element.includes('subheadline')) return 'subheadline';
  if (element.includes('cta') || element.includes('button')) return 'button';
  if (element.includes('description') || element.includes('text')) return 'text';
  if (element.includes('list') || element.includes('array')) return 'list';
  if (element.includes('image')) return 'image';
  if (element.includes('number') || element.includes('price')) return 'number';
  return 'text';
}