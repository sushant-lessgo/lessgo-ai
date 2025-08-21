// /app/edit/[token]/components/layout/GlobalAppHeader.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { UserButton, useUser } from '@clerk/nextjs';
import Logo from '@/components/shared/Logo';

interface GlobalAppHeaderProps {
  tokenId: string;
}

export function GlobalAppHeader({ tokenId }: GlobalAppHeaderProps) {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  
  const [showHelpMenu, setShowHelpMenu] = useState(false);

  const handleLogoClick = () => {
    // Navigate to dashboard or home
    router.push('/dashboard');
  };

  const handleHelpClick = () => {
    setShowHelpMenu(!showHelpMenu);
  };


  return (
    <header className="w-full border-b border-brand-border bg-white px-6 py-3 relative z-60">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo and breadcrumb */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogoClick}
            className="hover:opacity-80 transition-opacity"
            aria-label="Go to dashboard"
          >
            <Logo size={180} />
          </button>
          
          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
            <span>/</span>
            <span>Editor</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {tokenId.slice(0, 8)}...
            </span>
          </div>
        </div>

        {/* Right: User info and actions */}
        <div className="flex items-center space-x-4">
        {/* Help Menu */}
        <div className="relative">
          <button
            onClick={handleHelpClick}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Help and support"
            aria-expanded={showHelpMenu}
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Help Dropdown */}
          {showHelpMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="font-medium text-gray-900">Help & Support</h3>
              </div>
              
              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Editor Guide</span>
                </button>
                
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Video Tutorials</span>
                </button>
                
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Live Chat Support</span>
                </button>
                
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">⌘K</span>
                    <span>Keyboard Shortcuts</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* User Profile */}
          {isSignedIn && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-brand-mutedText font-medium">
                {user.firstName}
              </div>

              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9',
                  },
                }}
              />
            </div>
          )}

        {/* App Menu (Hamburger for mobile) */}
        <button
          className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors lg:hidden"
          onClick={() => useEditStore().toggleLeftPanel?.()}
          aria-label="Toggle navigation menu"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        </div>

        {/* Click outside to close dropdowns */}
        {showHelpMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowHelpMenu(false)}
          />
        )}
      </div>
    </header>
  );
}