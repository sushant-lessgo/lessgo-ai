import React, { useEffect, useState } from 'react';

interface GenerationAnimationProps {
  currentStep: number;
  currentLabel: string;
  wireframeVisible: boolean;
  sectionsGenerated: string[];
  layoutsVisible: boolean;
  copyStreaming: boolean;
  isGenerating: boolean;
}

const SECTION_POSITIONS = {
  hero: { top: '10%', height: '20%' },
  problem: { top: '32%', height: '12%' },
  features: { top: '46%', height: '15%' },
  testimonials: { top: '63%', height: '12%' },
  pricing: { top: '77%', height: '10%' },
  cta: { top: '89%', height: '8%' }
};

export default function GenerationAnimation({
  currentStep,
  currentLabel,
  wireframeVisible,
  sectionsGenerated,
  layoutsVisible,
  copyStreaming,
  isGenerating
}: GenerationAnimationProps) {
  const [typingText, setTypingText] = useState('');
  const [visibleSections, setVisibleSections] = useState<string[]>([]);

  // Animate sections appearing
  useEffect(() => {
    if (sectionsGenerated.length > 0) {
      sectionsGenerated.forEach((section, index) => {
        setTimeout(() => {
          setVisibleSections(prev => [...prev, section]);
        }, index * 300);
      });
    }
  }, [sectionsGenerated]);

  // Typing animation for copy streaming
  useEffect(() => {
    if (copyStreaming) {
      const sampleText = "Transform your business with our innovative solution. Join thousands of companies already seeing results.";
      let currentIndex = 0;
      
      const typingInterval = setInterval(() => {
        if (currentIndex < sampleText.length) {
          setTypingText(sampleText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 50);

      return () => clearInterval(typingInterval);
    }
  }, [copyStreaming]);

  if (!isGenerating) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-700 font-medium">{currentLabel}</span>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Step {currentStep} of 7
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-8">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>

        {/* Wireframe Animation */}
        <div className="relative bg-gray-50 rounded-lg p-6 min-h-[400px] border-2 border-dashed border-gray-300">
          {/* Browser Chrome */}
          <div className="absolute top-2 left-2 flex space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>

          {/* Wireframe Sections */}
          {wireframeVisible && (
            <div className="mt-8 space-y-4">
              {visibleSections.map((sectionId, index) => {
                const position = SECTION_POSITIONS[sectionId as keyof typeof SECTION_POSITIONS];
                const isActive = sectionsGenerated.includes(sectionId);
                
                return (
                  <div
                    key={sectionId}
                    className={`
                      relative border-2 border-dashed rounded-lg p-4 transition-all duration-500
                      ${isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'}
                      transform ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'}
                    `}
                    style={{
                      animationDelay: `${index * 300}ms`,
                      minHeight: '80px'
                    }}
                  >
                    {/* Section Label */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-sm font-medium capitalize ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                        {sectionId}
                      </span>
                    </div>

                    {/* Layout Grid (when layouts are visible) */}
                    {layoutsVisible && isActive && (
                      <div className="grid grid-cols-12 gap-2 mt-3">
                        <div className="col-span-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="col-span-4 h-12 bg-gray-300 rounded animate-pulse"></div>
                        <div className="col-span-6 h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="col-span-4 h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="col-span-2 h-6 bg-blue-300 rounded animate-pulse"></div>
                      </div>
                    )}

                    {/* Copy Streaming Effect */}
                    {copyStreaming && sectionId === 'hero' && (
                      <div className="mt-3 space-y-2">
                        <div className="h-6 bg-gradient-to-r from-blue-500 to-transparent rounded relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                        </div>
                        <div className="text-sm text-gray-700 font-mono">
                          {typingText}
                          <span className="animate-pulse">|</span>
                        </div>
                      </div>
                    )}

                    {/* Success Animation */}
                    {currentStep >= 6 && isActive && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!wireframeVisible && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Preparing your landing page...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Sections</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Layouts</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Copy</span>
            </div>
          </div>
          
          {currentStep >= 7 && (
            <div className="mt-4 text-green-600 font-medium">
              🎉 Your landing page is ready! Redirecting to preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}