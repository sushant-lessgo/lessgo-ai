"use client";

import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

interface PageRevealAnimationProps {
  children: React.ReactNode;
  sectionsCount?: number;
}

export default function PageRevealAnimation({ children, sectionsCount = 6 }: PageRevealAnimationProps) {
  const [isRevealing, setIsRevealing] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const hasTriggeredConfetti = useRef(false);
  
  useEffect(() => {
    // Start reveal animation
    const revealTimer = setTimeout(() => {
      setIsRevealing(false);
    }, 100);

    // Trigger confetti after sections animate in
    const confettiTimer = setTimeout(() => {
      if (!hasTriggeredConfetti.current) {
        hasTriggeredConfetti.current = true;
        triggerCelebration();
        setShowToast(true);
      }
    }, 1500);

    // Hide toast after 4 seconds
    const toastTimer = setTimeout(() => {
      setShowToast(false);
    }, 5500);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(confettiTimer);
      clearTimeout(toastTimer);
    };
  }, []);

  const triggerCelebration = () => {
    // Fire confetti from bottom left
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 1 },
      colors: ['#FF6B35', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
    });

    // Fire confetti from bottom right
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 1 },
      colors: ['#FF6B35', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
    });

    // Add some delayed bursts for extra magic
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 90,
        spread: 100,
        origin: { x: 0.5, y: 0.9 },
        colors: ['#FF6B35', '#4ECDC4', '#45B7D1'],
      });
    }, 250);
  };

  return (
    <>
      {/* Success Toast */}
      <div
        className={`
          fixed top-8 left-1/2 -translate-x-1/2 z-[100]
          bg-white shadow-2xl rounded-full px-8 py-4
          border-2 border-green-500
          transition-all duration-500 ease-out
          ${showToast 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl animate-bounce">🎉</span>
          <span className="text-lg font-semibold text-gray-800">
            Your page is ready!
          </span>
          <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎊</span>
        </div>
      </div>

      {/* Animated Content Wrapper */}
      <div className={`page-reveal-container ${isRevealing ? 'revealing' : 'revealed'}`}>
        {children}
      </div>

      {/* Animation Styles */}
      <style jsx global>{`
        .page-reveal-container {
          position: relative;
        }

        /* Initial state - sections are hidden */
        .page-reveal-container.revealing > div > * {
          opacity: 0;
          transform: translateY(20px);
          filter: blur(4px);
        }

        /* Revealed state - sections animate in */
        .page-reveal-container.revealed > div > * {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Stagger the animations for each section */
        .page-reveal-container.revealed > div > *:nth-child(1) { transition-delay: 0ms; }
        .page-reveal-container.revealed > div > *:nth-child(2) { transition-delay: 150ms; }
        .page-reveal-container.revealed > div > *:nth-child(3) { transition-delay: 300ms; }
        .page-reveal-container.revealed > div > *:nth-child(4) { transition-delay: 450ms; }
        .page-reveal-container.revealed > div > *:nth-child(5) { transition-delay: 600ms; }
        .page-reveal-container.revealed > div > *:nth-child(6) { transition-delay: 750ms; }
        .page-reveal-container.revealed > div > *:nth-child(7) { transition-delay: 900ms; }
        .page-reveal-container.revealed > div > *:nth-child(8) { transition-delay: 1050ms; }

        /* Add shimmer effect to sections while loading */
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .page-reveal-container.revealing > div > * {
          position: relative;
          overflow: hidden;
        }

        .page-reveal-container.revealing > div > *::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          animation: shimmer 2s infinite;
          pointer-events: none;
        }
      `}</style>
    </>
  );
}