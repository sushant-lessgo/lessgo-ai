// /app/edit/[token]/components/layout/GlobalAppHeader.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditStore } from '@/hooks/useEditStore';

interface GlobalAppHeaderProps {
  tokenId: string;
}

export function GlobalAppHeader({ tokenId }: GlobalAppHeaderProps) {
  const router = useRouter();
  const { getColorTokens } = useEditStore();
  const colorTokens = getColorTokens();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);

  const handleLogoClick = () => {
    // Navigate to dashboard or home
    router.push('/dashboard');
  };

  const handleHelpClick = () => {
    setShowHelpMenu(!showHelpMenu);
  };

  const handleUserClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-40">
      {/* Left Section - Logo */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLogoClick}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          aria-label="Go to dashboard"
        >
          <div className={`w-8 h-8 rounded-lg ${colorTokens.accent} flex items-center justify-center`}>
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">
            LessGo.ai
          </span>
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

      {/* Right Section - Actions */}
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

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={handleUserClick}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm hover:shadow-md transition-shadow"
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            U
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">user@example.com</p>
                <p className="text-xs text-gray-500">Pro Plan</p>
              </div>
              
              <div className="py-1">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7" />
                  </svg>
                  <span>Dashboard</span>
                </button>
                
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Account Settings</span>
                </button>
                
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Billing</span>
                </button>
                
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* App Menu (Hamburger for mobile) */}
        <button
          className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors lg:hidden"
          onClick={() => useEditStore.getState().toggleLeftPanel()}
          aria-label="Toggle navigation menu"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showHelpMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false);
            setShowHelpMenu(false);
          }}
        />
      )}
    </header>
  );
}