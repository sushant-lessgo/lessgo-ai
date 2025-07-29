// components/ui/SimpleImageEditor.tsx - Basic Image Editor for MVP
import React, { useState, useRef, useEffect } from 'react';

interface SimpleImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  alt: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SimpleImageEditor({ isOpen, onClose, imageUrl, onSave, alt }: SimpleImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [currentTool, setCurrentTool] = useState<'crop' | 'resize'>('crop');

  useEffect(() => {
    if (isOpen && imageUrl) {
      loadImage();
    }
  }, [isOpen, imageUrl]);

  const loadImage = () => {
    if (!imageUrl) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const img = new Image();
    img.onload = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to image size (max 800x600 for UI)
        const maxWidth = 800;
        const maxHeight = 600;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        
        // Initialize crop area to full image
        setCropArea({
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
        });
        
        setImageScale(scale);
        setLoadedImage(img);
      }
      setIsLoading(false);
    };
    img.src = imageUrl;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'crop') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || currentTool !== 'crop') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropArea({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y),
    });
    
    redrawCanvas();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const img = loadedImage;
    if (!canvas || !img) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw crop overlay
    if (currentTool === 'crop' && (cropArea.width > 0 || cropArea.height > 0)) {
      // Dark overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clear crop area
      ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      ctx.drawImage(
        img,
        cropArea.x / imageScale,
        cropArea.y / imageScale,
        cropArea.width / imageScale,
        cropArea.height / imageScale,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height
      );
      
      // Crop border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    }
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const img = loadedImage;
    if (!canvas || !img || cropArea.width === 0 || cropArea.height === 0) return;
    
    // Create new canvas for cropped image
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return;
    
    // Set cropped canvas size
    croppedCanvas.width = cropArea.width / imageScale;
    croppedCanvas.height = cropArea.height / imageScale;
    
    // Draw cropped portion
    croppedCtx.drawImage(
      img,
      cropArea.x / imageScale,
      cropArea.y / imageScale,
      cropArea.width / imageScale,
      cropArea.height / imageScale,
      0,
      0,
      croppedCanvas.width,
      croppedCanvas.height
    );
    
    // Convert to blob and create URL
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        onSave(croppedUrl);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleResize = (newWidth: number, newHeight: number) => {
    const img = loadedImage;
    if (!img) return;
    
    // Create new canvas for resized image
    const resizedCanvas = document.createElement('canvas');
    const resizedCtx = resizedCanvas.getContext('2d');
    if (!resizedCtx) return;
    
    // Set resized canvas size
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    
    // Draw resized image
    resizedCtx.drawImage(img, 0, 0, newWidth, newHeight);
    
    // Convert to blob and create URL
    resizedCanvas.toBlob((blob) => {
      if (blob) {
        const resizedUrl = URL.createObjectURL(blob);
        onSave(resizedUrl);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  const resetCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setCropArea({
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    });
    redrawCanvas();
  };

  useEffect(() => {
    redrawCanvas();
  }, [cropArea]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Edit Image</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tool selection */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setCurrentTool('crop')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                currentTool === 'crop'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Crop
            </button>
            <button
              onClick={() => setCurrentTool('resize')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                currentTool === 'resize'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Resize
            </button>
          </div>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 cursor-crosshair max-w-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              
              {currentTool === 'crop' && (
                <div className="mt-4 text-sm text-gray-600 text-center">
                  <p>Click and drag to select the area to crop</p>
                  <p className="mt-1">
                    Selection: {Math.round(cropArea.width / imageScale)} × {Math.round(cropArea.height / imageScale)} px
                  </p>
                </div>
              )}
              
              {currentTool === 'resize' && (
                <div className="mt-4 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Width:</label>
                    <input
                      type="number"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      defaultValue={loadedImage?.width || 0}
                      min="1"
                      id="resize-width"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Height:</label>
                    <input
                      type="number"
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      defaultValue={loadedImage?.height || 0}
                      min="1"
                      id="resize-height"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <div className="flex space-x-2">
            {currentTool === 'crop' && (
              <button
                onClick={resetCrop}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Reset Crop
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (currentTool === 'crop') {
                  handleCrop();
                } else {
                  const widthInput = document.getElementById('resize-width') as HTMLInputElement;
                  const heightInput = document.getElementById('resize-height') as HTMLInputElement;
                  const width = parseInt(widthInput.value);
                  const height = parseInt(heightInput.value);
                  if (width > 0 && height > 0) {
                    handleResize(width, height);
                  }
                }
              }}
              disabled={isLoading || (currentTool === 'crop' && cropArea.width === 0)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentTool === 'crop' ? 'Crop Image' : 'Resize Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}