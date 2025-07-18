// app/edit/[token]/components/modals/BaseModal.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { bodyScrollLock } from '@/utils/bodyScrollLock';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  className = '',
}: BaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key with cleanup safety
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      // Safe cleanup with error handling
      try {
        document.removeEventListener('keydown', handleEscape);
      } catch (error) {
        console.warn('Failed to remove escape key listener:', error);
      }
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus management with safety
  useEffect(() => {
    if (isOpen) {
      // Store current focus safely
      try {
        previousFocusRef.current = document.activeElement as HTMLElement;
      } catch (error) {
        console.warn('Failed to store previous focus:', error);
      }
      
      // Focus modal with error handling
      const focusTimeout = setTimeout(() => {
        try {
          if (modalRef.current) {
            const firstFocusable = modalRef.current.querySelector(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) as HTMLElement;
            
            if (firstFocusable) {
              firstFocusable.focus();
            } else {
              modalRef.current.focus();
            }
          }
        } catch (error) {
          console.warn('Failed to focus modal:', error);
        }
      }, 100);
      
      return () => clearTimeout(focusTimeout);
    } else {
      // Restore focus when modal closes
      try {
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
        }
      } catch (error) {
        console.warn('Failed to restore focus:', error);
      }
    }
  }, [isOpen]);

  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle focus trap
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!modalRef.current || e.key !== 'Tab') return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown as any);
      return () => {
        // Safe cleanup with error handling
        try {
          document.removeEventListener('keydown', handleKeyDown as any);
        } catch (error) {
          console.warn('Failed to remove focus trap listener:', error);
        }
      };
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open - using safe reference counter
  useEffect(() => {
    if (isOpen) {
      bodyScrollLock.lock();
      return () => {
        bodyScrollLock.unlock();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  const responsiveClasses = {
    small: 'mx-4 sm:mx-auto',
    medium: 'mx-4 sm:mx-auto',
    large: 'mx-4 sm:mx-auto',
    full: 'mx-4 sm:mx-8 lg:mx-auto',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative w-full ${sizeClasses[size]} ${responsiveClasses[size]}
            bg-white rounded-xl shadow-xl transform transition-all
            ${className}
          `}
          tabIndex={-1}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-gray-500">
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-4 flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document root
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

export default BaseModal;