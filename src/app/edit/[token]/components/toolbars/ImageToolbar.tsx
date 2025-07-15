// app/edit/[token]/components/toolbars/ImageToolbar.tsx - Complete Image Toolbar
import React, { useState, useRef, useEffect } from 'react';
import { useEditStore } from '@/hooks/useEditStore';
import { useToolbarActions } from '@/hooks/useToolbarActions';
import { calculateArrowPosition } from '@/utils/toolbarPositioning';
import { AdvancedActionsMenu } from './AdvancedActionsMenu';

interface ImageToolbarProps {
  targetId: string;
  position: { x: number; y: number };
  contextActions: any[];
}

export function ImageToolbar({ targetId, position, contextActions }: ImageToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showStockPhotos, setShowStockPhotos] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);
  const uploaderRef = useRef<HTMLInputElement>(null);

  const {
    images,
    // updateImageAsset,
    // toggleStockPhotoSearch,
    announceLiveRegion,
  } = useEditStore();

  const { executeAction } = useToolbarActions();

  // Calculate arrow position
  const targetElement = document.querySelector(`[data-image-id="${targetId}"]`);
  const arrowInfo = targetElement ? calculateArrowPosition(
    position,
    targetElement.getBoundingClientRect(),
    { width: 340, height: 48 }
  ) : null;

  // Close advanced menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        advancedRef.current &&
        !advancedRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowAdvanced(false);
      }
    };

    if (showAdvanced) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAdvanced]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Update image asset
      // updateImageAsset(targetId, {
      //   id: targetId,
      //   url: previewUrl,
      //   alt: file.name,
      //   width: 0, // Will be set after loading
      //   height: 0,
      //   format: file.type.split('/')[1] as any,
      //   size: file.size,
      //   isOptimized: false,
      // });

      announceLiveRegion('Image uploaded successfully');
      setShowUploader(false);
    }
  };

  // Handle stock photo search
  const handleStockPhotos = () => {
    // toggleStockPhotoSearch();
    setShowStockPhotos(true);
    announceLiveRegion('Opening stock photo search');
  };

  // Handle image editing
  const handleImageEditor = () => {
    setShowEditor(true);
    executeAction('open-image-editor', { imageId: targetId });
    announceLiveRegion('Opening image editor');
  };

  // Handle alt text editing
  const handleAltText = () => {
    const currentAlt = targetElement?.getAttribute('alt') || '';
    const newAlt = prompt('Enter alt text for accessibility:', currentAlt);
    
    if (newAlt !== null) {
      executeAction('update-alt-text', { imageId: targetId, altText: newAlt });
      announceLiveRegion('Alt text updated');
    }
  };

  // Primary Actions
  const primaryActions = [
    {
      id: 'replace-image',
      label: 'Replace',
      icon: 'upload',
      handler: () => {
        uploaderRef.current?.click();
      },
    },
    {
      id: 'stock-photos',
      label: 'Stock Photos',
      icon: 'search',
      handler: handleStockPhotos,
    },
    {
      id: 'edit-image',
      label: 'Edit',
      icon: 'edit',
      handler: handleImageEditor,
    },
    {
      id: 'alt-text',
      label: 'Alt Text',
      icon: 'accessibility',
      handler: handleAltText,
    },
    {
      id: 'delete-image',
      label: 'Delete',
      icon: 'trash',
      handler: () => {
        if (confirm('Are you sure you want to delete this image?')) {
          executeAction('delete-image', { imageId: targetId });
          announceLiveRegion('Image deleted');
        }
      },
    },
  ];

  // Advanced Actions
  const advancedActions = [
    {
      id: 'image-filters',
      label: 'Filters & Effects',
      icon: 'filter',
      handler: () => executeAction('image-filters', { imageId: targetId }),
    },
    {
      id: 'image-optimize',
      label: 'Optimize Image',
      icon: 'optimize',
      handler: () => {
        executeAction('optimize-image', { imageId: targetId });
        announceLiveRegion('Optimizing image');
      },
    },
    {
      id: 'image-lazy-loading',
      label: 'Lazy Loading',
      icon: 'lazy',
      handler: () => executeAction('toggle-lazy-loading', { imageId: targetId }),
    },
    {
      id: 'image-link',
      label: 'Add Link',
      icon: 'link',
      handler: () => executeAction('add-image-link', { imageId: targetId }),
    },
    {
      id: 'image-caption',
      label: 'Add Caption',
      icon: 'caption',
      handler: () => executeAction('add-image-caption', { imageId: targetId }),
    },
    {
      id: 'image-responsive',
      label: 'Responsive Settings',
      icon: 'responsive',
      handler: () => executeAction('image-responsive', { imageId: targetId }),
    },
    {
      id: 'image-seo',
      label: 'SEO Settings',
      icon: 'seo',
      handler: () => executeAction('image-seo', { imageId: targetId }),
    },
  ];

  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {/* Arrow */}
        {arrowInfo && (
          <div 
            className={`absolute w-2 h-2 bg-white border transform rotate-45 ${
              arrowInfo.direction === 'up' ? 'border-t-0 border-l-0 -bottom-1' :
              arrowInfo.direction === 'down' ? 'border-b-0 border-r-0 -top-1' :
              arrowInfo.direction === 'left' ? 'border-l-0 border-b-0 -right-1' :
              'border-r-0 border-t-0 -left-1'
            }`}
            style={{
              left: arrowInfo.direction === 'up' || arrowInfo.direction === 'down' ? arrowInfo.x - 4 : undefined,
              top: arrowInfo.direction === 'left' || arrowInfo.direction === 'right' ? arrowInfo.y - 4 : undefined,
            }}
          />
        )}
        
        <div className="flex items-center px-3 py-2">
          {/* Image Indicator */}
          <div className="flex items-center space-x-1 mr-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-700">Image</span>
          </div>
          
          {/* Primary Actions */}
          {primaryActions.map((action, index) => (
            <React.Fragment key={action.id}>
              {index > 0 && <div className="w-px h-6 bg-gray-200 mx-1" />}
              <button
                onClick={action.handler}
                className="flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                title={action.label}
              >
                <ImageIcon icon={action.icon} />
                <span>{action.label}</span>
              </button>
            </React.Fragment>
          ))}
          
          {/* Advanced Actions Trigger */}
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              showAdvanced 
                ? 'bg-gray-100 text-gray-900' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="More image options"
          >
            <span>⋯</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={uploaderRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Advanced Actions Menu */}
      {showAdvanced && (
        <AdvancedActionsMenu
          ref={advancedRef}
          actions={advancedActions}
          triggerElement={document.body}
          toolbarType="image"
          isVisible={showAdvanced}
          onClose={() => setShowAdvanced(false)}
        />
      )}

      {/* Stock Photos Panel */}
      {showStockPhotos && (
        <StockPhotosPanel
          position={{
            x: position.x,
            y: position.y + 60,
          }}
          onClose={() => setShowStockPhotos(false)}
          onSelectImage={(imageUrl) => {
            // updateImageAsset(targetId, {
            //   id: targetId,
            //   url: imageUrl,
            //   alt: 'Stock photo',
            //   width: 0,
            //   height: 0,
            //   format: 'jpg',
            //   size: 0,
            //   isOptimized: true,
            // });
            setShowStockPhotos(false);
            announceLiveRegion('Stock photo selected');
          }}
        />
      )}

      {/* Upload Progress */}
      {images.uploadProgress[targetId] && (
        <div className="fixed z-60 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
          style={{
            left: position.x,
            top: position.y + 60,
          }}
        >
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-700">Uploading...</span>
          </div>
          <div className="mt-2 w-40 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${images.uploadProgress[targetId]}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}

// Stock Photos Panel Component
function StockPhotosPanel({ position, onClose, onSelectImage }: {
  position: { x: number; y: number };
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock stock photos - in production this would call actual API
  const mockStockPhotos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400', alt: 'Business team' },
    { id: 2, url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400', alt: 'Office workspace' },
    { id: 3, url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400', alt: 'Technology' },
    { id: 4, url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400', alt: 'Teamwork' },
  ];

  useEffect(() => {
    setSearchResults(mockStockPhotos);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    // Mock search delay
    setTimeout(() => {
      setSearchResults(mockStockPhotos.filter(photo => 
        photo.alt.toLowerCase().includes(query.toLowerCase())
      ));
      setIsSearching(false);
    }, 500);
  };

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        width: 400,
        height: 300,
      }}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Stock Photos</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search stock photos..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 100px)' }}>
        <div className="grid grid-cols-2 gap-3">
          {searchResults.map((photo) => (
            <button
              key={photo.id}
              onClick={() => onSelectImage(photo.url)}
              className="relative group overflow-hidden rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              style={{ aspectRatio: '16/9' }}
            >
              <img
                src={photo.url}
                alt={photo.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm text-gray-500">No photos found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Image Icon Component
function ImageIcon({ icon }: { icon: string }) {
  const iconMap = {
    'upload': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    'search': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    'edit': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    'accessibility': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    'trash': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    'filter': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
    'optimize': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    'lazy': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      </svg>
    ),
    'link': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    'caption': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    'responsive': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    'seo': (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  };

  return iconMap[icon as keyof typeof iconMap] || <div className="w-3 h-3 bg-gray-400 rounded-sm" />;
}