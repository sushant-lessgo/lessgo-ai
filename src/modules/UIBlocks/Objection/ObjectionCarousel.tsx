// components/layout/ObjectionCarousel.tsx - Objection UIBlock with carousel format
// Interactive carousel for browsing through multiple objections and answers

import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';

// Content interface for type safety
interface ObjectionCarouselContent {
  headline: string;
  subheadline?: string;
  objection_slides: string;
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
  objection_slides: { 
    type: 'string' as const, 
    default: 'Is this really worth the investment?|We understand budget concerns. Most customers save 10x their investment within 3 months through improved efficiency.|🤔|Will this integrate with our existing tools?|Absolutely! We have pre-built integrations with 500+ popular tools, plus a robust API for custom connections.|🔗|How long does implementation take?|Most teams are up and running in under 24 hours. Our onboarding team guides you through every step.|⚡|What if we need support or have issues?|You get dedicated support with response times under 2 hours. Plus, our 99.9% uptime guarantee means reliability you can count on.|🛠️|Is our data secure with your platform?|Security is our top priority. We\'re SOC 2 compliant, GDPR ready, and use enterprise-grade encryption for all data.|🔒|What if it doesn\'t work for our specific use case?|Every business is unique. We offer a 30-day money-back guarantee and custom configuration to ensure it fits your exact needs.|✨' 
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

  // Parse objection slides from pipe-separated string
  const objectionSlides = blockContent.objection_slides 
    ? blockContent.objection_slides.split('|').reduce((slides, item, index) => {
        if (index % 3 === 0) {
          slides.push({ question: item.trim(), answer: '', icon: '' });
        } else if (index % 3 === 1) {
          slides[slides.length - 1].answer = item.trim();
        } else {
          slides[slides.length - 1].icon = item.trim();
        }
        return slides;
      }, [] as Array<{question: string, answer: string, icon: string}>)
    : [];

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
      backgroundType={props.backgroundType || 'primary'}
      sectionBackground={sectionBackground}
      mode={mode}
      className={props.className}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={props.backgroundType || 'primary'}
            colorTokens={colorTokens}
            textStyle={getTextStyle('h2')}
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
              backgroundType={props.backgroundType || 'primary'}
              colorTokens={colorTokens}
              variant="body"
              textStyle={getTextStyle('body-lg')}
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
                        {slide.icon}
                      </div>

                      {/* Question */}
                      <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8 leading-tight">
                        {slide.question}
                      </h3>

                      {/* Answer */}
                      <p className="text-lg lg:text-xl text-gray-700 leading-relaxed">
                        {slide.answer}
                      </p>
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
                <span className="text-2xl">{slide.icon}</span>
                <span className="text-sm font-medium text-gray-500">
                  Question {index + 1}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                {slide.question.length > 60 ? slide.question.substring(0, 60) + '...' : slide.question}
              </h4>
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
            ▶️ Auto-play for 15 seconds
          </button>
        </div>

        {/* Edit Mode: Instructions */}
        {mode === 'edit' && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Edit Objection Slides:</strong> Use format "[question]|[answer]|[emoji]|[next question]|[next answer]|[next emoji]"
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
    { key: 'objection_slides', label: 'Objection Slides (pipe separated: question|answer|icon)', type: 'textarea', required: true }
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