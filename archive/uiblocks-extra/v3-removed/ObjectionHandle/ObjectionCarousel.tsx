// components/layout/ObjectionCarousel.tsx - Objection UIBlock with carousel format
// Interactive carousel for browsing through multiple objections and answers

import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface ObjectionCarouselContent {
  headline: string;
  subheadline?: string;
  // Individual objection slides (up to 6 slides)
  objection_1: string;
  answer_1: string;
  icon_1: string;
  objection_2: string;
  answer_2: string;
  icon_2: string;
  objection_3: string;
  answer_3: string;
  icon_3: string;
  objection_4: string;
  answer_4: string;
  icon_4: string;
  objection_5: string;
  answer_5: string;
  icon_5: string;
  objection_6: string;
  answer_6: string;
  icon_6: string;
  autoplay_button_text?: string;
  // Legacy field for backward compatibility
  objection_slides?: string;
}

// Content schema - defines structure and defaults
const CONTENT_SCHEMA = {
  headline: { 
    type: 'string' as const, 
    default: 'Your Questions, Answered' 
  },
  subheadline: { 
    type: 'string' as const, 
    default: 'Browse through the most common questions and concerns from people just like you.' 
  },
  // Individual objection slides
  objection_1: { type: 'string' as const, default: 'Is this really worth the investment?' },
  answer_1: { type: 'string' as const, default: 'We understand budget concerns. Most customers save 10x their investment within 3 months through improved efficiency.' },
  icon_1: { type: 'string' as const, default: '🤔' },
  objection_2: { type: 'string' as const, default: 'Will this integrate with our existing tools?' },
  answer_2: { type: 'string' as const, default: 'Absolutely! We have pre-built integrations with 500+ popular tools, plus a robust API for custom connections.' },
  icon_2: { type: 'string' as const, default: '🔗' },
  objection_3: { type: 'string' as const, default: 'How long does implementation take?' },
  answer_3: { type: 'string' as const, default: 'Most teams are up and running in under 24 hours. Our onboarding team guides you through every step.' },
  icon_3: { type: 'string' as const, default: '⚡' },
  objection_4: { type: 'string' as const, default: 'What if we need support or have issues?' },
  answer_4: { type: 'string' as const, default: 'You get dedicated support with response times under 2 hours. Plus, our 99.9% uptime guarantee means reliability you can count on.' },
  icon_4: { type: 'string' as const, default: '🛠️' },
  objection_5: { type: 'string' as const, default: 'Is our data secure with your platform?' },
  answer_5: { type: 'string' as const, default: 'Security is our top priority. We\'re SOC 2 compliant, GDPR ready, and use enterprise-grade encryption for all data.' },
  icon_5: { type: 'string' as const, default: '🔒' },
  objection_6: { type: 'string' as const, default: 'What if it doesn\'t work for our specific use case?' },
  answer_6: { type: 'string' as const, default: 'Every business is unique. We offer a 30-day money-back guarantee and custom configuration to ensure it fits your exact needs.' },
  icon_6: { type: 'string' as const, default: '✨' },
  // Legacy field for backward compatibility
  objection_slides: {
    type: 'string' as const,
    default: 'Is this really worth the investment?|We understand budget concerns. Most customers save 10x their investment within 3 months through improved efficiency.|🤔|Will this integrate with our existing tools?|Absolutely! We have pre-built integrations with 500+ popular tools, plus a robust API for custom connections.|🔗|How long does implementation take?|Most teams are up and running in under 24 hours. Our onboarding team guides you through every step.|⚡|What if we need support or have issues?|You get dedicated support with response times under 2 hours. Plus, our 99.9% uptime guarantee means reliability you can count on.|🛠️|Is our data secure with your platform?|Security is our top priority. We\'re SOC 2 compliant, GDPR ready, and use enterprise-grade encryption for all data.|🔒|What if it doesn\'t work for our specific use case?|Every business is unique. We offer a 30-day money-back guarantee and custom configuration to ensure it fits your exact needs.|✨'
  },
  autoplay_button_text: {
    type: 'string' as const,
    default: '▶️ Auto-play for 15 seconds'
  }
};

export default function ObjectionCarousel(props: LayoutComponentProps) {
  
  // Use the abstraction hook with background type support
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    handleContentUpdate
  } = useLayoutComponent<ObjectionCarouselContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse objection slides from both individual and legacy formats
  const parseObjectionSlides = (content: ObjectionCarouselContent) => {
    const slides: Array<{question: string, answer: string, icon: string}> = [];

    // Check for individual fields first (preferred format)
    const individualSlides = [
      { question: content.objection_1, answer: content.answer_1, icon: content.icon_1 },
      { question: content.objection_2, answer: content.answer_2, icon: content.icon_2 },
      { question: content.objection_3, answer: content.answer_3, icon: content.icon_3 },
      { question: content.objection_4, answer: content.answer_4, icon: content.icon_4 },
      { question: content.objection_5, answer: content.answer_5, icon: content.icon_5 },
      { question: content.objection_6, answer: content.answer_6, icon: content.icon_6 }
    ];

    // Process individual fields
    individualSlides.forEach(slide => {
      if (slide.question && slide.question.trim() && slide.answer && slide.answer.trim()) {
        slides.push({
          question: slide.question.trim(),
          answer: slide.answer.trim(),
          icon: slide.icon?.trim() || '🤔'
        });
      }
    });

    // Fallback to legacy pipe-separated format if no individual fields
    if (slides.length === 0 && content.objection_slides) {
      content.objection_slides.split('|').reduce((acc, item, index) => {
        if (index % 3 === 0) {
          acc.push({ question: item.trim(), answer: '', icon: '' });
        } else if (index % 3 === 1) {
          acc[acc.length - 1].answer = item.trim();
        } else {
          acc[acc.length - 1].icon = item.trim();
        }
        return acc;
      }, slides);
    }

    return slides;
  };

  const objectionSlides = parseObjectionSlides(blockContent);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % objectionSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + objectionSlides.length) % objectionSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ObjectionCarousel"
      backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
            colorTokens={colorTokens}
            className="mb-6"
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
              className="text-lg max-w-3xl mx-auto"
              placeholder="Add a subheadline that introduces the Q&A carousel..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          
          {/* Main Carousel */}
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Carousel Content */}
            <div className="relative h-96 lg:h-80">
              {objectionSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                    index === currentSlide 
                      ? 'opacity-100 transform translate-x-0' 
                      : index < currentSlide 
                        ? 'opacity-0 transform -translate-x-full'
                        : 'opacity-0 transform translate-x-full'
                  }`}
                >
                  <div className="h-full flex items-center justify-center p-12">
                    <div className="text-center max-w-4xl">
                      
                      {/* Icon */}
                      <div className="text-6xl mb-8">
                        <IconEditableText
                          mode={mode}
                          value={slide.icon || '🤔'}
                          onEdit={(value) => {
                            const fieldName = `icon_${index + 1}` as keyof ObjectionCarouselContent;
                            handleContentUpdate(fieldName, value);
                          }}
                          backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                          colorTokens={colorTokens}
                          iconSize="xl"
                          className="text-6xl"
                          sectionId={sectionId}
                          elementKey={`slide_${index}_icon`}
                        />
                      </div>

                      {/* Question */}
                      <EditableAdaptiveText
                        mode={mode}
                        value={slide.question || ''}
                        onEdit={(value) => {
                          const fieldName = `objection_${index + 1}` as keyof ObjectionCarouselContent;
                          handleContentUpdate(fieldName, value);
                        }}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8 leading-tight"
                        placeholder="Enter question"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`slide_${index}_question`}
                      />

                      {/* Answer */}
                      <EditableAdaptiveText
                        mode={mode}
                        value={slide.answer || ''}
                        onEdit={(value) => {
                          const fieldName = `answer_${index + 1}` as keyof ObjectionCarouselContent;
                          handleContentUpdate(fieldName, value);
                        }}
                        backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-lg lg:text-xl text-gray-700 leading-relaxed"
                        placeholder="Enter answer"
                        sectionBackground={sectionBackground}
                        data-section-id={sectionId}
                        data-element-key={`slide_${index}_answer`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center justify-center space-x-3 mt-8">
            {objectionSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide 
                    ? 'bg-blue-500 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Slide Counter */}
          <div className="text-center mt-4">
            <span className="text-sm text-gray-500 font-medium">
              {currentSlide + 1} of {objectionSlides.length}
            </span>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {objectionSlides.map((slide, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                index === currentSlide 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white/50 hover:border-gray-300 hover:bg-white/80'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <IconEditableText
                  mode={mode}
                  value={slide.icon || '🤔'}
                  onEdit={(value) => {
                    const fieldName = `icon_${index + 1}` as keyof ObjectionCarouselContent;
                    handleContentUpdate(fieldName, value);
                  }}
                  backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                  colorTokens={colorTokens}
                  iconSize="md"
                  className="text-2xl"
                  sectionId={sectionId}
                  elementKey={`grid_${index}_icon`}
                />
                <span className="text-sm font-medium text-gray-500">
                  Question {index + 1}
                </span>
              </div>
              <EditableAdaptiveText
                mode={mode}
                value={slide.question.length > 60 ? slide.question.substring(0, 60) + '...' : slide.question}
                onEdit={(value) => {
                  const fieldName = `objection_${index + 1}` as keyof ObjectionCarouselContent;
                  handleContentUpdate(fieldName, value);
                }}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="font-semibold text-gray-900 text-sm leading-tight"
                placeholder="Question preview"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key={`slide_${index}_preview`}
              />
            </button>
          ))}
        </div>

        {/* Auto-play Toggle */}
        <div className="text-center mt-8">
          <button 
            onClick={() => {
              const interval = setInterval(nextSlide, 3000);
              setTimeout(() => clearInterval(interval), 15000); // Auto-stop after 15 seconds
            }}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
          >
            {mode !== 'preview' ? (
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.autoplay_button_text || ''}
                onEdit={(value) => handleContentUpdate('autoplay_button_text', value)}
                backgroundType={props.backgroundType === 'custom' ? 'secondary' : (props.backgroundType || 'primary')}
                colorTokens={colorTokens}
                variant="body"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
                placeholder="Auto-play button text"
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="autoplay_button_text"
              />
            ) : (
              blockContent.autoplay_button_text || '▶️ Auto-play for 15 seconds'
            )}
          </button>
        </div>

        {/* Edit Mode: Instructions */}
        {mode !== 'preview' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Edit Objection Slides:</strong> Each slide has individual fields for question, answer, and icon. Up to 6 slides supported.
            </p>
          </div>
        )}
      </div>
    </LayoutSection>
  );
}

// Export additional metadata for the component registry
export const componentMeta = {
  name: 'ObjectionCarousel',
  category: 'Objection Sections',
  description: 'Interactive carousel format for browsing through multiple objections and answers in an engaging way.',
  tags: ['objection', 'carousel', 'interactive', 'Q&A', 'engaging'],
  defaultBackgroundType: 'primary' as const,
  complexity: 'medium',
  estimatedBuildTime: '30 minutes',
  
  contentFields: [
    { key: 'headline', label: 'Main Headline', type: 'text', required: true },
    { key: 'subheadline', label: 'Subheadline', type: 'textarea', required: false },
    { key: 'objection_1', label: 'Objection 1', type: 'text', required: false },
    { key: 'answer_1', label: 'Answer 1', type: 'textarea', required: false },
    { key: 'icon_1', label: 'Icon 1', type: 'text', required: false },
    { key: 'objection_2', label: 'Objection 2', type: 'text', required: false },
    { key: 'answer_2', label: 'Answer 2', type: 'textarea', required: false },
    { key: 'icon_2', label: 'Icon 2', type: 'text', required: false },
    { key: 'objection_3', label: 'Objection 3', type: 'text', required: false },
    { key: 'answer_3', label: 'Answer 3', type: 'textarea', required: false },
    { key: 'icon_3', label: 'Icon 3', type: 'text', required: false },
    { key: 'objection_4', label: 'Objection 4', type: 'text', required: false },
    { key: 'answer_4', label: 'Answer 4', type: 'textarea', required: false },
    { key: 'icon_4', label: 'Icon 4', type: 'text', required: false },
    { key: 'objection_5', label: 'Objection 5', type: 'text', required: false },
    { key: 'answer_5', label: 'Answer 5', type: 'textarea', required: false },
    { key: 'icon_5', label: 'Icon 5', type: 'text', required: false },
    { key: 'objection_6', label: 'Objection 6', type: 'text', required: false },
    { key: 'answer_6', label: 'Answer 6', type: 'textarea', required: false },
    { key: 'icon_6', label: 'Icon 6', type: 'text', required: false },
    { key: 'autoplay_button_text', label: 'Auto-play Button Text', type: 'text', required: false }
  ],
  
  features: [
    'Interactive carousel with smooth transitions',
    'Navigation arrows and slide indicators',
    'Quick access grid for jumping to specific slides',
    'Auto-play functionality for demonstrations'
  ],
  
  useCases: [
    'Creative tools with multiple use case questions',
    'Consumer products with varied concerns',
    'Early-stage products building initial trust',
    'Freemium services addressing upgrade objections'
  ]
};