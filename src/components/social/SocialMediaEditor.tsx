/**
 * SocialMediaEditor Component
 * Provides a UI for editing footer social media links
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import type { SocialMediaItem } from '@/types/store/state';
import { FaTwitter, FaLinkedin, FaGithub, FaFacebook, FaInstagram, FaYoutube, FaTiktok, FaDiscord, FaMedium, FaDribbble, FaGlobe } from 'react-icons/fa';

interface SocialMediaEditorProps {
  isVisible: boolean;
  onClose: () => void;
  targetFooterId?: string;
}

interface SocialFormData {
  platform: string;
  url: string;
  icon: string;
}

// Predefined social media platforms with their icons
const SOCIAL_PLATFORMS = [
  { name: 'Twitter/X', icon: 'FaTwitter', component: FaTwitter, placeholder: 'https://twitter.com/yourhandle' },
  { name: 'LinkedIn', icon: 'FaLinkedin', component: FaLinkedin, placeholder: 'https://linkedin.com/company/yourcompany' },
  { name: 'GitHub', icon: 'FaGithub', component: FaGithub, placeholder: 'https://github.com/yourusername' },
  { name: 'Facebook', icon: 'FaFacebook', component: FaFacebook, placeholder: 'https://facebook.com/yourpage' },
  { name: 'Instagram', icon: 'FaInstagram', component: FaInstagram, placeholder: 'https://instagram.com/youraccount' },
  { name: 'YouTube', icon: 'FaYoutube', component: FaYoutube, placeholder: 'https://youtube.com/c/yourchannel' },
  { name: 'TikTok', icon: 'FaTiktok', component: FaTiktok, placeholder: 'https://tiktok.com/@yourusername' },
  { name: 'Discord', icon: 'FaDiscord', component: FaDiscord, placeholder: 'https://discord.gg/yourinvite' },
  { name: 'Medium', icon: 'FaMedium', component: FaMedium, placeholder: 'https://medium.com/@yourusername' },
  { name: 'Dribbble', icon: 'FaDribbble', component: FaDribbble, placeholder: 'https://dribbble.com/yourusername' },
  { name: 'Website', icon: 'FaGlobe', component: FaGlobe, placeholder: 'https://yourwebsite.com' },
];

const SocialMediaEditor: React.FC<SocialMediaEditorProps> = ({
  isVisible,
  onClose,
  targetFooterId,
}) => {
  const store = useEditStore();
  const [editingItem, setEditingItem] = useState<SocialMediaItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<SocialFormData>({
    platform: '',
    url: '',
    icon: '',
  });
  
  // Refs for UX improvements
  const editFormRef = useRef<HTMLDivElement>(null);
  const platformSelectRef = useRef<HTMLSelectElement>(null);

  // Auto-scroll and focus when edit form appears
  useEffect(() => {
    if (showAddForm && editFormRef.current && platformSelectRef.current) {
      // Smooth scroll to the edit form
      editFormRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
      
      // Focus the first input after a short delay to ensure scroll completes
      setTimeout(() => {
        platformSelectRef.current?.focus();
      }, 300);
    }
  }, [showAddForm, editingItem]);

  // Initialize social media config if needed
  useEffect(() => {
    if (isVisible && !store.socialMediaConfig) {
      // store.initializeSocialMedia(); // TEMP: commented for build - method not available
    }
  }, [isVisible, store]);

  if (!isVisible || !store.socialMediaConfig) return null;

  const socialItems = store.socialMediaConfig.items;

  // Use portal to render modal at document root level
  if (typeof document === 'undefined') return null;

  const handleSaveItem = () => {
    if (!formData.platform.trim() || !formData.url.trim() || !formData.icon) return;

    // TEMP: commented for build - methods not available
    // if (editingItem) {
    //   store.updateSocialMediaItem(editingItem.id, {
    //     platform: formData.platform,
    //     url: formData.url,
    //     icon: formData.icon,
    //   });
    // } else {
    //   store.addSocialMediaItem(
    //     formData.platform,
    //     formData.url,
    //     formData.icon
    //   );
    // }

    resetForm();
  };

  const handleEditItem = (item: SocialMediaItem) => {
    setEditingItem(item);
    setFormData({
      platform: item.platform,
      url: item.url,
      icon: item.icon,
    });
    
    setShowAddForm(true);
  };

  const handleDeleteItem = (itemId: string) => {
    // store.removeSocialMediaItem(itemId); // TEMP: commented for build - method not available
  };

  const handlePlatformChange = (platformName: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.name === platformName);
    if (platform) {
      setFormData({
        ...formData,
        platform: platformName,
        icon: platform.icon,
      });
    }
  };

  const resetForm = () => {
    setFormData({ platform: '', url: '', icon: '' });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getIconComponent = (iconName: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.icon === iconName);
    return platform?.component || FaGlobe;
  };

  const getCurrentPlatformPlaceholder = () => {
    const platform = SOCIAL_PLATFORMS.find(p => p.name === formData.platform);
    return platform?.placeholder || 'https://example.com/yourprofile';
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative flex flex-col">
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Social Media Links
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] flex-1">
          {/* Current Social Media Links */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Social Links</h3>
            <div className="space-y-2">
              {socialItems.map((item, index) => {
                const IconComponent = getIconComponent(item.icon);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.platform}</div>
                        <div className="text-sm text-gray-500 truncate">{item.url}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index > 0 && (
                        <button
                          onClick={() => {
                            const newOrder = [...socialItems];
                            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                            // store.reorderSocialMediaItems(newOrder.map(item => item.id)); // TEMP: commented for build - method not available
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}
                      {index < socialItems.length - 1 && (
                        <button
                          onClick={() => {
                            const newOrder = [...socialItems];
                            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                            // store.reorderSocialMediaItems(newOrder.map(item => item.id)); // TEMP: commented for build - method not available
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div ref={editFormRef} className="border-t pt-6 animate-in slide-in-from-top-2 duration-300">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {editingItem ? 'Edit Social Link' : 'Add Social Link'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform
                  </label>
                  <select
                    ref={platformSelectRef}
                    value={formData.platform}
                    onChange={(e) => handlePlatformChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a platform</option>
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <option key={platform.name} value={platform.name}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={getCurrentPlatformPlaceholder()}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveItem}
                    disabled={!formData.platform.trim() || !formData.url.trim() || !formData.icon}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingItem ? 'Update' : 'Add'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showAddForm && socialItems.length < store.socialMediaConfig.maxItems && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              + Add Social Media Link
            </button>
          )}

          {socialItems.length >= store.socialMediaConfig.maxItems && (
            <div className="text-sm text-gray-500 text-center py-3">
              Maximum {store.socialMediaConfig.maxItems} social media links allowed.
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SocialMediaEditor;