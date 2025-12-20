// components/ui/LogoEditableComponent.tsx
// Basic logo editing component for MVP

import React, { useState, useRef } from 'react';
import { useEditStoreLegacy } from '@/hooks/useEditStoreLegacy';

interface LogoEditableComponentProps {
  mode: 'edit' | 'preview';
  logoUrl?: string;
  onLogoChange: (url: string) => void;
  companyName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  sectionId?: string;
  elementKey?: string;
}

const LogoEditableComponent: React.FC<LogoEditableComponentProps> = ({
  mode,
  logoUrl,
  onLogoChange,
  companyName,
  size = 'md',
  className = '',
  sectionId,
  elementKey
}) => {
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Conditionally access store for proper image upload
  const store = sectionId && elementKey ? useEditStoreLegacy() : null;
  const uploadImage = store?.uploadImage;

  // Size classes
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20'
  };

  // Generate placeholder logo
  const generatePlaceholder = (name: string) => {
    const words = name.split(' ');
    const initials = words.length === 1 
      ? name.substring(0, 2).toUpperCase()
      : words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
    
    const colors = [
      'from-blue-600 to-blue-700',
      'from-gray-700 to-gray-800', 
      'from-green-600 to-green-700',
      'from-purple-600 to-purple-700'
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorClass = colors[hash % colors.length];
    
    return { initials, colorClass };
  };

  const { initials, colorClass } = generatePlaceholder(companyName);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file must be smaller than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // If store integration available, use proper upload
      if (uploadImage && sectionId && elementKey) {
        const permanentUrl = await uploadImage(file, {
          sectionId,
          elementKey,
        });

        // Notify parent via callback
        onLogoChange(permanentUrl);
      } else {
        // Legacy fallback: create blob URL (temporary)
        const previewUrl = URL.createObjectURL(file);
        onLogoChange(previewUrl);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    if (confirm('Remove this logo?')) {
      onLogoChange('');
    }
  };

  if (mode === 'preview') {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-xl overflow-hidden`}>
        {logoUrl ? (
          <img 
            src={logoUrl}
            alt={`${companyName} logo`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shadow-lg`}>
            {initials}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${className} relative`}
      onMouseEnter={() => setShowUploadButton(true)}
      onMouseLeave={() => setShowUploadButton(false)}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Logo display */}
      <div className="w-full h-full flex items-center justify-center rounded-xl overflow-hidden border-2 border-transparent hover:border-blue-300 transition-all duration-200 cursor-pointer"
           onClick={handleUploadClick}>
        {logoUrl ? (
          <img 
            src={logoUrl}
            alt={`${companyName} logo`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shadow-lg`}>
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              initials
            )}
          </div>
        )}
        
        {/* Overlay for upload hint */}
        {/* Overlay for upload hint - only show on hover and in edit mode */}
        {showUploadButton && (
          <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-200 flex items-center justify-center">
            <div className="text-white text-center">
              <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">Upload Logo</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      {logoUrl && showUploadButton && (
        <div className="absolute -top-2 -right-2 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUploadClick();
            }}
            className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            title="Replace logo"
          >
            ↻
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveLogo();
            }}
            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            title="Remove logo"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default LogoEditableComponent;