'use client';

import React, { useEffect, useState } from 'react';

interface EditTransitionModalProps {
  isOpen: boolean;
  currentStep: number;
  progress: number;
}

const steps = [
  { id: 1, label: 'Saving your changes', icon: '💾' },
  { id: 2, label: 'Preparing editor', icon: '🎨' },
  { id: 3, label: 'Loading components', icon: '🔧' },
];

export default function EditTransitionModal({ isOpen, currentStep, progress }: EditTransitionModalProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShowModal(false);
        setDisplayProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [progress, isOpen]);

  if (!showModal) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm
        transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div 
        className={`
          bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4
          transition-all duration-300 transform
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Opening Editor
          </h2>
          <p className="text-gray-600">
            Please wait while we prepare your workspace
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div
                key={step.id}
                className={`
                  flex items-center space-x-4 transition-all duration-300
                  ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'}
                `}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl
                    transition-all duration-300
                    ${isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : isActive 
                        ? 'bg-brand-accentPrimary/10 text-brand-accentPrimary animate-pulse' 
                        : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>
                <div className="flex-1">
                  <p className={`
                    font-medium transition-colors duration-300
                    ${isActive ? 'text-gray-900' : isCompleted ? 'text-green-600' : 'text-gray-500'}
                  `}>
                    {step.label}
                  </p>
                  {isActive && (
                    <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-accentPrimary transition-all duration-500 ease-out"
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-accentPrimary to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-accentPrimary"></div>
            <span className="text-sm text-gray-600">Loading editor...</span>
          </div>
        </div>
      </div>
    </div>
  );
}