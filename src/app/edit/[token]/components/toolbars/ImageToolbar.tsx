// app/edit/[token]/components/toolbars/ImageToolbar.tsx - Complete Image Toolbar
import React, { useState, useRef, useEffect } from 'react';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useToolbarActions } from '@/hooks/useToolbarActions';
import { calculateArrowPosition } from '@/utils/toolbarPositioning';
import { AdvancedActionsMenu } from './AdvancedActionsMenu';
import { pexelsApi, type StockPhoto } from '@/services/pexelsApi';
import { TextInputModal } from '../modals/TextInputModal';
import { SimpleImageEditor } from '@/components/ui/SimpleImageEditor';

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
  const [showAltTextModal, setShowAltTextModal] = useState(false);
  const [currentAltText, setCurrentAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);
  const uploaderRef = useRef<HTMLInputElement>(null);

  const {
    images,
    updateImageAsset,
    removeImageAsset,
    hideElementToolbar,
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
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image file must be smaller than 10MB');
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        try {
          // Update image asset with actual dimensions
          updateImageAsset(targetId, {
            id: targetId,
            url: previewUrl,
            alt: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for alt text
            source: 'upload' as any,
            urls: { original: previewUrl },
            metadata: {
              file: {
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: Date.now(),
              },
              image: {
                width: img.width,
                height: img.height,
                aspectRatio: img.width / img.height,
                format: file.type.split('/')[1] as any,
                colorDepth: 24,
                hasTransparency: file.type === 'image/png' || file.type === 'image/gif',
              },
            },
            tags: [],
            timestamps: {
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });

          announceLiveRegion('Image uploaded successfully');
          setIsUploading(false);
        } catch (error) {
          console.error('Error updating image asset:', error);
          setUploadError('Failed to update image. Please try again.');
          setIsUploading(false);
        }
      };

      img.onerror = () => {
        setUploadError('Invalid image file. Please select a different image.');
        setIsUploading(false);
      };

      img.src = previewUrl;
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      setIsUploading(false);
    }

    // Reset input
    event.target.value = '';
  };

  // Handle stock photo search
  const handleStockPhotos = () => {
    setShowStockPhotos(true);
    announceLiveRegion('Opening stock photo search');
  };

  // Handle image editing
  const handleImageEditor = () => {
    setShowEditor(true);
    announceLiveRegion('Opening image editor');
  };

  const handleImageEditorSave = (editedImageUrl: string) => {
    // Update the image with the edited version
    const targetElement = document.querySelector(`[data-image-id="${targetId}"]`) as HTMLImageElement;
    const currentAlt = targetElement?.getAttribute('alt') || '';
    
    updateImageAsset(targetId, {
      id: targetId,
      url: editedImageUrl,
      alt: currentAlt,
      source: 'upload' as any,
      urls: { original: editedImageUrl },
      metadata: {
        file: {
          name: `edited-${targetId}.jpg`,
          size: 0, // Size unknown after editing
          type: 'image/jpeg',
          uploadedAt: Date.now(),
        },
        image: {
          width: 0, // Will be updated after loading
          height: 0,
          aspectRatio: 0,
          format: 'jpeg',
          colorDepth: 24,
          hasTransparency: false,
        },
      },
      tags: ['edited'],
      timestamps: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    setShowEditor(false);
    announceLiveRegion('Image edited successfully');
  };

  // Handle alt text editing
  const handleAltText = () => {
    const currentAlt = targetElement?.getAttribute('alt') || '';
    setCurrentAltText(currentAlt);
    setShowAltTextModal(true);
  };

  const handleAltTextSave = (newAltText: string) => {
    executeAction('update-alt-text', { imageId: targetId, altText: newAltText });
    announceLiveRegion('Alt text updated');
    setShowAltTextModal(false);
  };

  // MVP Actions - Essential & Important only
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
          // Remove from store
          removeImageAsset(targetId);
          
          // Also remove from DOM to provide immediate feedback
          const targetElement = document.querySelector(`[data-image-id="${targetId}"]`);
          if (targetElement) {
            targetElement.remove();
          }
          
          announceLiveRegion('Image deleted');
          
          // Hide toolbar since image is deleted
          hideElementToolbar();
        }
      },
    },
  ];

  // Removed advanced actions for MVP - keeping toolbar simple


  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200"
        style={{
          left: position.x,
          top: position.y,
          zIndex: 10000,
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
          
          {/* Removed advanced actions menu for MVP */}
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

      {/* Removed advanced actions menu for MVP */}

      {/* Stock Photos Panel */}
      {showStockPhotos && (
        <StockPhotosPanel
          position={{
            x: Math.max(10, Math.min(position.x, window.innerWidth - 420)), // Ensure it fits on screen
            y: Math.max(10, position.y + 60),
          }}
          onClose={() => setShowStockPhotos(false)}
          onSelectImage={(stockPhoto) => {
            updateImageAsset(targetId, {
              id: targetId,
              url: stockPhoto.url,
              alt: stockPhoto.alt || 'Stock photo',
              source: 'pexels' as any,
              urls: { 
                original: stockPhoto.url,
                large: stockPhoto.url,
                medium: stockPhoto.url,
                small: stockPhoto.url 
              },
              metadata: {
                file: {
                  name: `pexels-${stockPhoto.id}.jpg`,
                  size: 0,
                  type: 'image/jpeg',
                  uploadedAt: Date.now(),
                },
                image: {
                  width: stockPhoto.width || 0,
                  height: stockPhoto.height || 0,
                  aspectRatio: stockPhoto.width && stockPhoto.height ? stockPhoto.width / stockPhoto.height : 0,
                  format: 'jpeg',
                  colorDepth: 24,
                  hasTransparency: false,
                },
              },
              tags: stockPhoto.tags || [],
              licensing: stockPhoto.licensing || {
                license: 'pexels' as any,
                details: {
                  attribution: stockPhoto.attribution || 'Pexels',
                  commercialUse: true,
                  editingAllowed: true,
                  distributionAllowed: true,
                },
              },
              timestamps: {
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
            setShowStockPhotos(false);
            announceLiveRegion('Stock photo selected');
          }}
        />
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="fixed z-60 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
          style={{
            left: position.x,
            top: position.y + 60,
          }}
        >
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-700">Uploading image...</span>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="fixed z-60 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3"
          style={{
            left: position.x,
            top: position.y + 60,
            maxWidth: 280,
          }}
        >
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-700">{uploadError}</p>
              <button
                onClick={() => setUploadError(null)}
                className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alt Text Modal */}
      <TextInputModal
        isOpen={showAltTextModal}
        onClose={() => setShowAltTextModal(false)}
        onSelect={handleAltTextSave}
        currentValue={currentAltText}
        fieldName="Alt Text"
        placeholder="Describe this image for screen readers..."
        description="Alt text helps screen readers describe images to visually impaired users. Be descriptive but concise."
      />

      {/* Image Editor */}
      {showEditor && targetElement && (
        <SimpleImageEditor
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          imageUrl={targetElement.getAttribute('src') || ''}
          onSave={handleImageEditorSave}
          alt={targetElement.getAttribute('alt') || ''}
        />
      )}
    </>
  );
}

// Stock Photos Panel Component
function StockPhotosPanel({ position, onClose, onSelectImage }: {
  position: { x: number; y: number };
  onClose: () => void;
  onSelectImage: (stockPhoto: StockPhoto) => void;
}) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockPhoto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<'featured' | 'business' | 'tech' | 'people' | 'nature' | 'lifestyle'>('featured');

  // Load featured photos on mount
  useEffect(() => {
    loadFeaturedPhotos();
  }, []);

  const loadFeaturedPhotos = async () => {
    setIsSearching(true);
    setError(null);
    try {
      const photos = await pexelsApi.getFeaturedPhotos(12);
      setSearchResults(photos);
    } catch (err) {
      setError('Failed to load photos. Please check your API key.');
      console.error('Error loading featured photos:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadFeaturedPhotos();
      return;
    }

    setSearchQuery(query);
    setIsSearching(true);
    setError(null);
    
    try {
      const photos = await pexelsApi.searchPhotos({
        query: query.trim(),
        per_page: 12,
        orientation: 'landscape',
      });
      setSearchResults(photos);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Error searching photos:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategorySearch = async (category: typeof currentCategory) => {
    setCurrentCategory(category);
    setIsSearching(true);
    setError(null);
    setSearchQuery('');
    
    try {
      let photos: StockPhoto[];
      
      switch (category) {
        case 'business':
          photos = await pexelsApi.searchBusinessPhotos();
          break;
        case 'tech':
          photos = await pexelsApi.searchTechPhotos();
          break;
        case 'people':
          photos = await pexelsApi.searchPeoplePhotos();
          break;
        case 'nature':
          photos = await pexelsApi.searchNaturePhotos();
          break;
        case 'lifestyle':
          photos = await pexelsApi.searchLifestylePhotos();
          break;
        default:
          photos = await pexelsApi.getFeaturedPhotos(12);
      }
      
      setSearchResults(photos);
    } catch (err) {
      setError('Failed to load category photos.');
      console.error('Error loading category photos:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div
      className="fixed bg-white border-2 border-blue-500 rounded-lg shadow-2xl"
      style={{
        left: position.x,
        top: position.y,
        width: 400,
        height: 300,
        zIndex: 10001, // Higher than toolbar's z-index
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
        
        <div className="relative mb-3">
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
        
        {/* Category buttons */}
        <div className="flex gap-1 flex-wrap">
          {[
            { key: 'featured', label: 'Featured' },
            { key: 'business', label: 'Business' },
            { key: 'tech', label: 'Tech' },
            { key: 'people', label: 'People' },
            { key: 'nature', label: 'Nature' },
            { key: 'lifestyle', label: 'Lifestyle' },
          ].map((category) => (
            <button
              key={category.key}
              onClick={() => handleCategorySearch(category.key as any)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                currentCategory === category.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadFeaturedPhotos();
              }}
              className="mt-2 text-xs text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Show loading indicator prominently */}
        {isSearching && (
          <div className="mb-4 p-4 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading stock photos...</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          {searchResults.map((photo) => (
            <button
              key={photo.id}
              onClick={() => onSelectImage(photo)}
              className="relative group overflow-hidden rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              style={{ aspectRatio: '16/9' }}
              title={`${photo.alt} by ${photo.author}`}
            >
              <img
                src={photo.url}
                alt={photo.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              
              {/* Attribution overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-xs text-white truncate">
                  by {photo.author}
                </p>
              </div>
            </button>
          ))}
        </div>
        
        {searchResults.length === 0 && !isSearching && !error && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm text-gray-500">No photos found</p>
          </div>
        )}
        
        {isSearching && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* Attribution footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Photos provided by{' '}
          <a
            href="https://pexels.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Pexels
          </a>
        </p>
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