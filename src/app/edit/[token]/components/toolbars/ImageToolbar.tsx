// app/edit/[token]/components/toolbars/ImageToolbar.tsx - Complete Image Toolbar
import React, { useState, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore } from '@/hooks/useEditStore';

import { confirmDialog } from '@/components/ui/ConfirmDialog';
import { SimpleImageEditor } from '@/components/ui/SimpleImageEditor';
import { isForbiddenImageSrc } from '@/hooks/editStore/imageWriteGuard';
// The media picker replaces BOTH the old bare `<input type=file>` Replace action and
// the in-file StockPhotosPanel — one implementation, not two. Its Stock tab carries
// the panel's palette-enriched queries / category buttons / curated-on-mount forward.
import { MediaPickerModal, type MediaPickerTab } from '../ui/MediaPickerModal';
import { ToolbarButton, ToolbarDivider, ToolbarLabel } from './ToolbarButton';

interface ImageToolbarProps {
  targetId: string;
}

// Phase-3: the ToolbarShell decides visibility and owns positioning. This
// component is a dumb child of the shell's floating container.
export function ImageToolbar({ targetId }: ImageToolbarProps) {
  const [showUploader, setShowUploader] = useState(false);
  // Picker open/tab state is LOCAL to the toolbar (useModalManager is the
  // onboarding-oriented queue) — StyleBrowserModal/ElementToggleModal precedent.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<MediaPickerTab>('library');
  const [showEditor, setShowEditor] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const uploaderRef = useRef<HTMLInputElement>(null);

  // Narrow selector: pull ONLY the fields/actions this toolbar reads (actions are
  // stable refs). `uploadImageFromObjectUrl` is a store adapter that uploads an
  // ephemeral data:/blob: URL to permanent storage (delegates to uploadImage);
  // accessed via cast — its type declaration lives in the store types module,
  // which is out of this phase's edit scope. `audienceType` was destructured but
  // never used by the main component (StockPhotosPanel reads it separately) → dropped.
  const {
    updateElementContent,
    replaceImage,
    hideElementToolbar,
    tokenId,
    uploadImageFromObjectUrl,
  } = useEditStore(
    useShallow((s) => ({
      updateElementContent: s.updateElementContent,
      replaceImage: s.replaceImage,
      hideElementToolbar: s.hideElementToolbar,
      tokenId: s.tokenId,
      uploadImageFromObjectUrl: (s as any).uploadImageFromObjectUrl as (
        objectUrl: string,
        targetElement: { sectionId: string; elementKey: string },
      ) => Promise<string>,
    })),
  );

  // Helper function to parse targetId and extract section/element info
  const parseTargetId = (targetId: string) => {
    
    // Check if targetId follows the "sectionId.elementKey" format (from showToolbar)
    if (targetId.includes('.')) {
      const [sectionId, elementKey] = targetId.split('.');
      
      // Handle step-visual pattern for ZigZagImageSteps (e.g., "howItWorks.step-visual-0")
      if (elementKey.startsWith('step-visual-')) {
        const stepIndex = elementKey.replace('step-visual-', '');
        const result = { sectionId, elementKey: `step_visual_${stepIndex}` };
        return result;
      }
      
      // Handle timestamp in elementKey for dot format (e.g., "beforeAfter.1757338395540-before-visual")
      const timestampPattern = /^(\d{10,})-(.+)$/;
      const match = elementKey.match(timestampPattern);
      if (match) {
        // elementKey contains timestamp-field, reconstruct properly
        const finalSectionId = `${sectionId}-${match[1]}`;  // Add timestamp to sectionId
        const finalElementKey = match[2].replace(/-/g, '_'); // Convert field name dashes to underscores
        const result = { sectionId: finalSectionId, elementKey: finalElementKey };
        return result;
      }
      
      // Fallback: original dot logic for non-timestamped cases
      const result = { sectionId, elementKey };
      return result;
    }
    
    // For hero images, targetId format is: sectionId-hero-image
    // For other images, targetId format might be: sectionId-elementKey
    const parts = targetId.split('-');
    
    // Check most specific patterns first (longest matches)
    if (parts.length >= 5 && parts[parts.length - 4] === 'image' && parts[parts.length - 3] === 'first' && parts[parts.length - 2] === 'hero') {
      // Image first hero case: "section123-image-first-hero-image" -> sectionId: "section123", elementKey: "image_first_hero_image"
      const sectionId = parts.slice(0, -4).join('-');
      const result = { sectionId, elementKey: 'image_first_hero_image' };
      return result;
    } else if (parts.length >= 4 && parts[parts.length - 3] === 'center' && parts[parts.length - 2] === 'hero') {
      // Center hero image case: "section123-center-hero-image" -> sectionId: "section123", elementKey: "center_hero_image"
      const sectionId = parts.slice(0, -3).join('-');
      const result = { sectionId, elementKey: 'center_hero_image' };
      return result;
    } else if (parts.length >= 4 && parts[parts.length - 3] === 'split' && parts[parts.length - 2] === 'hero') {
      // Split hero image case: "section123-split-hero-image" -> sectionId: "section123", elementKey: "split_hero_image"
      const sectionId = parts.slice(0, -3).join('-');
      const result = { sectionId, elementKey: 'split_hero_image' };
      return result;
    } else if (parts.length >= 3 && parts[parts.length - 2] === 'hero') {
      // Standard hero image case: "section123-hero-image" -> sectionId: "section123", elementKey: "hero_image"
      const sectionId = parts.slice(0, -2).join('-');
      const result = { sectionId, elementKey: 'hero_image' };
      return result;
    } else if (parts.length >= 2) {
      // Other image cases - improved logic to handle timestamped section IDs
      
      // PRIORITY 1: Check for step-visual pattern (ZigZagImageSteps)
      // Format: sectionId-step-visual-0 -> { sectionId, elementKey: 'step_visual_0' }
      const stepVisualPattern = /^(.+?)-step-visual-(\d+)$/;
      const stepMatch = targetId.match(stepVisualPattern);
      if (stepMatch) {
        const sectionId = stepMatch[1];
        const stepIndex = stepMatch[2];
        const elementKey = `step_visual_${stepIndex}`;
        const result = { sectionId, elementKey };
        return result;
      }
      
      // PRIORITY 2: Check for timestamp pattern (more specific)
      const timestampPattern = /^(.+?)-(\d{10,})-(.+)$/;
      const match = targetId.match(timestampPattern);
      if (match) {
        // match[1] is the section type (e.g., "beforeAfter")
        // match[2] is the timestamp (e.g., "1757310502405") 
        // match[3] is the image field (e.g., "before-visual" or "persona-avatar")
        const sectionId = `${match[1]}-${match[2]}`;
        const elementKey = match[3].replace(/-/g, '_'); // Convert dashes to underscores for field name
        const result = { sectionId, elementKey };
        return result;
      }
      
      // PRIORITY 3: Check if the last parts form a known image field
      const commonImageFields = [
        // BeforeAfter components
        'persona_avatar', 'before_visual', 'after_visual', 
        // Hero and feature components  
        'mockup_image', 'product_image', 'feature_image', 'center_hero_image',
        'split_image', 'split_visual', 'center_visual',
        // Other common fields
        'logo_image', 'team_image', 'testimonial_image', 'company_logo',
        'background_image', 'icon_image', 'gallery_image'
      ];
      
      for (let i = 1; i <= Math.min(3, parts.length - 1); i++) {
        const possibleField = parts.slice(-i).join('_');
        if (commonImageFields.includes(possibleField)) {
          const sectionId = parts.slice(0, -i).join('-');
          const result = { sectionId, elementKey: possibleField };
          return result;
        }
      }
      
      // PRIORITY 3: Final fallback - original logic (for simple non-timestamped sections)
      const sectionId = parts[0];
      const elementKey = parts.slice(1).join('-');
      const result = { sectionId, elementKey };
      return result;
    }
    return null;
  };

  // The target image node — used to seed the image editor with the current src/alt.
  const targetElement = typeof document !== 'undefined'
    ? document.querySelector(`[data-image-id="${targetId}"]`)
    : null;

  // (`handleFileUpload` retired with the bare file-input Replace action: the picker's
  // Library/Upload tab posts to /api/upload-image itself and hands the URL back through
  // onPick. Keeping the old helper would have left an unreachable second upload path.)

  // Open the picker on a given tab. Both the Replace and Stock Photos actions land here —
  // one picker, two entry tabs.
  const openPicker = (tab: MediaPickerTab) => {
    setPickerTab(tab);
    setPickerOpen(true);
  };

  // The toolbar only holds `targetId`; replaceImage takes (sectionId, elementKey, url) —
  // so route through parseTargetId, mirroring handleFileUpload. replaceImage already
  // delegates to updateElementContent AND pushes an undo entry; autosave picks the change
  // up like any other content edit → NO extra save() call here, deliberately.
  const handlePick = (url: string) => {
    const targetInfo = parseTargetId(targetId);
    if (!targetInfo) {
      setUploadError('Invalid target element');
      return;
    }
    replaceImage(targetInfo.sectionId, targetInfo.elementKey, url);
  };

  // Handle image editing
  const handleImageEditor = () => {
    setShowEditor(true);
  };

  const handleImageEditorSave = async (editedImageUrl: string) => {
    const targetInfo = parseTargetId(targetId);
    setShowEditor(false);

    if (!targetInfo) {
      // console.error('❌ Could not parse targetId for edited image:', targetId);
      return;
    }

    // SimpleImageEditor hands back an ephemeral blob: object URL (canvas.toBlob).
    // Persisting that directly dies on reload, so upload it to permanent storage
    // via the store adapter — uploadImage writes the permanent URL back through
    // updateElementContent. Non-forbidden (https/relative) srcs pass straight
    // through. Keep the old value on failure and surface an error toast.
    if (isForbiddenImageSrc(editedImageUrl)) {
      setUploadError(null);
      setIsUploading(true);
      try {
        await uploadImageFromObjectUrl(editedImageUrl, {
          sectionId: targetInfo.sectionId,
          elementKey: targetInfo.elementKey,
        });
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : 'Failed to save edited image. Please try again.',
        );
      } finally {
        setIsUploading(false);
      }
      return;
    }

    updateElementContent(targetInfo.sectionId, targetInfo.elementKey, editedImageUrl);
  };

  // MVP Actions - Essential & Important only
  const primaryActions = [
    {
      id: 'replace-image',
      label: 'Replace',
      icon: 'upload',
      // Was a bare dynamic <input type=file>; now opens the picker's Library/Upload tab
      // (upload still available there — re-pointed, not removed).
      handler: () => openPicker('library'),
    },
    {
      id: 'stock-photos',
      label: 'Stock Photos',
      icon: 'search',
      handler: () => openPicker('stock'),
    },
    {
      id: 'edit-image',
      label: 'Edit',
      icon: 'edit',
      handler: handleImageEditor,
    },
    {
      id: 'delete-image',
      label: 'Delete',
      icon: 'trash',
      variant: 'danger' as const,
      handler: async () => {
        if (await confirmDialog({ title: 'Delete image', message: 'Are you sure you want to delete this image?', confirmLabel: 'Delete', destructive: true })) {
          // Remove image by setting empty content
          const targetInfo = parseTargetId(targetId);
          if (targetInfo) {
            updateElementContent(targetInfo.sectionId, targetInfo.elementKey, '');
          }
          
          // Also remove from DOM to provide immediate feedback
          const targetElement = document.querySelector(`[data-image-id="${targetId}"]`);
          if (targetElement) {
            targetElement.remove();
          }
          
          
          // Hide toolbar since image is deleted
          hideElementToolbar();
        }
      },
    }
  ];

  // Removed advanced actions for MVP - keeping toolbar simple




  return (
    <>
      {/* The t2 chrome box (bg/border/radius/shadow) is the SHELL's now — this
          body only supplies the label chip + the action row. Reskin ONLY: the
          Replace/Stock (MediaPickerModal) and Edit (SimpleImageEditor) wiring
          below is byte-for-byte the media-library-picker's, and no Image → Link
          action is added (deferred — plan ruling 5: no published-consumed
          image-link field exists). */}
      <div ref={toolbarRef} className="flex items-center gap-0.5">
        <ToolbarLabel dotClassName="bg-orange-400" text="Image" />

        {/* Primary Actions */}
        {primaryActions.map((action, index) => (
          <React.Fragment key={action.id}>
            {index > 0 && <ToolbarDivider />}
            <ToolbarButton
              data-action={action.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent event bubbling
                action.handler();
              }}
              variant={(action as any).variant === 'danger' ? 'danger' : 'default'}
              icon={<ImageIcon icon={action.icon} />}
              label={action.label}
            />
          </React.Fragment>
        ))}
      </div>


      {/* Removed advanced actions menu for MVP */}

      {/* Media picker — Library/Upload + Stock (replaces the old file input + StockPhotosPanel) */}
      <MediaPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialTab={pickerTab}
        tokenId={tokenId}
        onPick={handlePick}
      />

      {/* Upload Progress */}
      {isUploading && (
        <div className="absolute z-60 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
          style={{
            top: '100%',
            left: 0,
            marginTop: 8,
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
        <div className="absolute z-60 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3"
          style={{
            top: '100%',
            left: 0,
            marginTop: 8,
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

      {/* Image Editor */}
      {showEditor && (
        <SimpleImageEditor
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          imageUrl={targetElement?.getAttribute('src') || ''}
          onSave={handleImageEditorSave}
          alt={targetElement?.getAttribute('alt') || ''}
        />
      )}

    </>
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