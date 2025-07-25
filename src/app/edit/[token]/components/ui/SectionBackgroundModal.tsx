// components/ui/SectionBackgroundModal.tsx - Enhanced section background customization modal
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { SolidColorPicker } from './ColorPicker/SolidColorPicker';
import { GradientPicker } from './ColorPicker/GradientPicker';
import { validateBackgroundAccessibility } from '@/utils/contrastValidator';
import { 
  BackgroundType, 
  SectionBackground, 
  CustomBackground,
  BackgroundPickerMode,
  BackgroundPickerState,
  BackgroundValidation
} from '@/types/core';

interface SectionBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
}

export function SectionBackgroundModal({ isOpen, onClose, sectionId }: SectionBackgroundModalProps) {
  console.log('SectionBackgroundModal rendered with:', { isOpen, sectionId });
  const { content, setBackgroundType, setSectionBackground, theme } = useEditStore();
  
  // Check if setSectionBackground exists
  if (!setSectionBackground) {
    console.error('setSectionBackground function not found in store');
  }
  
  console.log('Modal rendering with props:', { isOpen, sectionId, theme: !!theme });
  
  // Add DOM debugging - MUST be called before any early returns
  React.useEffect(() => {
    if (isOpen) {
      console.log('Modal is open, checking DOM...');
      setTimeout(() => {
        // Look for our specific test elements
        const testElement = document.getElementById('test-element-123');
        const ultraSimpleTest = document.getElementById('ultra-simple-test');
        console.log('Test element found:', testElement);
        console.log('Ultra simple test found:', ultraSimpleTest);
        
        if (testElement) {
          const rect = testElement.getBoundingClientRect();
          console.log('✅ Test element position and size:', rect);
          console.log('✅ Test element computed styles:', window.getComputedStyle(testElement));
        } else {
          console.error('❌ Test element not found in DOM!');
          
          // Check if the element might be somewhere else
          const allDivs = document.querySelectorAll('div');
          console.log('Total divs in document:', allDivs.length);
          
          // Look for any element with our text content
          const elementWithText = Array.from(allDivs).find(div => 
            div.textContent && div.textContent.includes('SIMPLE TEST MODAL')
          );
          console.log('Element with test text:', elementWithText);
        }
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) {
    console.log('Modal not open, isOpen:', isOpen);
    return null;
  }
  
  // Try the absolute simplest possible JSX first
  console.log('Creating modal content...');
  
  const modalContent = (
    <>
      <div id="test-element-123" style={{
        position: 'fixed',
        top: '50px',
        left: '50px',
        width: '300px',
        height: '200px',
        backgroundColor: 'red',
        border: '5px solid black',
        zIndex: 999999,
        color: 'white',
        padding: '20px'
      }}>
        SIMPLE TEST MODAL - Click to close
        <br />
        Section: {sectionId}
        <br />
        <button 
          onClick={onClose}
          style={{ 
            marginTop: '10px', 
            padding: '5px 10px', 
            backgroundColor: 'blue', 
            color: 'white', 
            border: 'none' 
          }}
        >
          Close
        </button>
      </div>
    </>
  );
  
  // Try both portal and non-portal versions for debugging
  console.log('About to render modal, window available:', typeof window !== 'undefined');
  console.log('Modal content to return:', modalContent);
  
  // Test: Try returning something even simpler
  console.log('Returning JSX...');
  return (
    <div 
      id="ultra-simple-test" 
      style={{
        position: 'fixed',
        top: '100px',
        left: '100px',
        width: '200px',
        height: '100px',
        backgroundColor: 'green',
        zIndex: 999999,
        color: 'white',
        padding: '10px'
      }}
    >
      DIRECT RETURN TEST {sectionId}
    </div>
  );
  
  // Commented out portal version for now
  // if (typeof window !== 'undefined') {
  //   return createPortal(modalContent, document.body);
  // }
  // return null;
}