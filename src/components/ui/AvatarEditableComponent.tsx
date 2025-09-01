// components/ui/AvatarEditableComponent.tsx
// Customer avatar editing component following LogoEditableComponent pattern

import React, { useState, useRef } from 'react';
import { logger } from '@/lib/logger';

interface AvatarEditableComponentProps {
  mode: 'edit' | 'preview';
  avatarUrl?: string;
  onAvatarChange: (url: string) => void;
  customerName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AvatarEditableComponent: React.FC<AvatarEditableComponentProps> = ({
  mode,
  avatarUrl,
  onAvatarChange,
  customerName,
  size = 'md',
  className = ''
}) => {
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size classes for avatars (circular)
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  // Generate customer initials and colors
  const generateCustomerPlaceholder = (name: string) => {
    const words = name.trim().split(' ').filter(Boolean);
    const initials = words.length === 1 
      ? name.substring(0, 2).toUpperCase()
      : words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
    
    // Customer-friendly avatar colors (more diverse and professional)
    const colors = [
      'from-blue-400 to-indigo-500',    // Blue
      'from-emerald-400 to-teal-500',   // Green
      'from-purple-400 to-violet-500',  // Purple
      'from-pink-400 to-rose-500',      // Pink
      'from-amber-400 to-orange-500',   // Orange
      'from-cyan-400 to-blue-500',      // Cyan
      'from-red-400 to-pink-500',       // Red
      'from-indigo-400 to-purple-500'   // Indigo
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorClass = colors[hash % colors.length];
    
    return { initials, colorClass };
  };

  const { initials, colorClass } = generateCustomerPlaceholder(customerName);

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
      onAvatarChange(previewUrl);
    } catch (error) {
      logger.error('Error uploading avatar:', () => error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    if (confirm(`Remove ${customerName}'s photo?`)) {
      onAvatarChange('');
    }
  };

  if (mode === 'preview') {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-full overflow-hidden border-2 border-white shadow-sm`}>
        {avatarUrl ? (
          <img 
            src={avatarUrl}
            alt={`${customerName} avatar`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-xs`}>
            {initials}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${className} relative group/avatar`}
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
      
      {/* Avatar display */}
      <div 
        className="w-full h-full flex items-center justify-center rounded-full overflow-hidden border-2 border-white shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={handleUploadClick}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl}
            alt={`${customerName} avatar`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-xs`}>
            {isUploading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              initials
            )}
          </div>
        )}
        
        {/* Overlay for upload hint */}
        {mode === 'edit' && showUploadButton && (
          <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-200 flex items-center justify-center rounded-full">
            <div className="text-white text-center">
              <svg className="w-4 h-4 mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs">Photo</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Action buttons - only show when avatar exists */}
      {avatarUrl && showUploadButton && (
        <div className="absolute -top-1 -right-1 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUploadClick();
            }}
            className="w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow-sm"
            title="Replace photo"
          >
            ↻
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveAvatar();
            }}
            className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow-sm"
            title="Remove photo"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default AvatarEditableComponent;