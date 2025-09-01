import React, { useState, useRef } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';

interface HeaderLogoProps {
  mode: 'edit' | 'preview';
  className?: string;
}

const HeaderLogo: React.FC<HeaderLogoProps> = ({ 
  mode, 
  className = 'h-12 w-auto'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get logo from Zustand store
  const { globalSettings, setLogoUrl } = useEditStore();
  const logoUrl = globalSettings?.logoUrl || '';

  // Simple placeholder SVG that shows "LOGO" text
  const PlaceholderLogo = () => (
    <svg 
      width="80" 
      height="32" 
      viewBox="0 0 80 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-auto"
    >
      <rect x="0.5" y="0.5" width="79" height="31" rx="5.5" fill="#F3F4F6" stroke="#D1D5DB"/>
      <text 
        x="50%" 
        y="50%" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fill="#6B7280" 
        fontSize="12" 
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="500"
      >
        LOGO
      </text>
    </svg>
  );

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
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoUrl(previewUrl);
    } catch (error) {
      alert('Failed to upload logo. Please try again.');
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
      setLogoUrl('');
    }
  };

  // In edit mode, show editable logo with upload functionality
  if (mode === 'edit') {
    return (
      <div 
        className={`${className} relative cursor-pointer`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleUploadClick}
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
        <div className="relative">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className={className}
              onError={() => setLogoUrl('')}
            />
          ) : (
            <PlaceholderLogo />
          )}
          
          {/* Hover overlay */}
          {isHovered && !isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded flex items-center justify-center">
              <div className="text-white text-center">
                <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">{logoUrl ? 'Replace' : 'Upload'}</span>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-40 rounded flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {/* Remove button */}
        {logoUrl && isHovered && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveLogo();
            }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            title="Remove logo"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  // In preview mode, only show logo if it exists (no placeholder)
  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt="Logo" 
        className={className}
        onError={(e) => {
          // If image fails to load, hide it
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // In preview mode with no logo, return nothing
  return null;
};

export default HeaderLogo;