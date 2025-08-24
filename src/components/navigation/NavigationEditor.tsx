/**
 * NavigationEditor Component
 * Provides a UI for editing header navigation items
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import type { NavigationItem } from '@/types/store/state';

interface NavigationEditorProps {
  isVisible: boolean;
  onClose: () => void;
  targetHeaderId?: string;
}

interface LinkFormData {
  label: string;
  link: string;
  sectionId?: string;
}

const NavigationEditor: React.FC<NavigationEditorProps> = ({
  isVisible,
  onClose,
  targetHeaderId,
}) => {
  const store = useEditStore();
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<LinkFormData>({
    label: '',
    link: '',
    sectionId: undefined,
  });
  const [linkType, setLinkType] = useState<'section' | 'external' | 'email' | 'phone'>('section');
  
  // Refs for UX improvements
  const editFormRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll and focus when edit form appears
  useEffect(() => {
    if (showAddForm && editFormRef.current && labelInputRef.current) {
      // Smooth scroll to the edit form
      editFormRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
      
      // Focus the first input after a short delay to ensure scroll completes
      setTimeout(() => {
        labelInputRef.current?.focus();
      }, 300);
    }
  }, [showAddForm, editingItem]);

  if (!isVisible || !store.navigationConfig) return null;

  const navItems = store.navigationConfig.items;
  const availableSections = store.sections
    .filter(id => !id.includes('header') && !id.includes('footer'))
    .map(id => ({
      id,
      layout: store.sectionLayouts[id] || '',
      label: getSectionDisplayName(id, store.sectionLayouts[id] || ''),
    }));

  // Use portal to render modal at document root level to escape layout container constraints
  if (typeof document === 'undefined') return null;

  const handleSaveItem = () => {
    if (!formData.label.trim()) return;

    let finalLink = formData.link;
    if (linkType === 'section' && formData.sectionId) {
      finalLink = `#${formData.sectionId}`;
    }

    if (editingItem) {
      store.updateNavItem(editingItem.id, {
        label: formData.label,
        link: finalLink,
        sectionId: linkType === 'section' ? formData.sectionId : undefined,
      });
    } else {
      store.addNavItem(
        formData.label,
        finalLink,
        linkType === 'section' ? formData.sectionId : undefined
      );
    }

    resetForm();
  };

  const handleEditItem = (item: NavigationItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      link: item.link,
      sectionId: item.sectionId,
    });
    
    // Determine link type
    if (item.link.startsWith('#')) {
      setLinkType('section');
    } else if (item.link.startsWith('mailto:')) {
      setLinkType('email');
    } else if (item.link.startsWith('tel:')) {
      setLinkType('phone');
    } else {
      setLinkType('external');
    }
    
    setShowAddForm(true);
  };

  const handleDeleteItem = (itemId: string) => {
    store.removeNavItem(itemId);
  };

  const resetForm = () => {
    setFormData({ label: '', link: '', sectionId: undefined });
    setEditingItem(null);
    setShowAddForm(false);
    setLinkType('section');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative flex flex-col">
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Navigation Settings
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
          {/* Current Navigation Items */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Navigation</h3>
            <div className="space-y-2">
              {navItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.link}</div>
                    {item.isAutoGenerated && (
                      <div className="text-xs text-blue-600">Auto-generated</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {index > 0 && (
                      <button
                        onClick={() => {
                          const newOrder = [...navItems];
                          [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                          store.reorderNavItems(newOrder.map(item => item.id));
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {index < navItems.length - 1 && (
                      <button
                        onClick={() => {
                          const newOrder = [...navItems];
                          [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                          store.reorderNavItems(newOrder.map(item => item.id));
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
              ))}
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div ref={editFormRef} className="border-t pt-6 animate-in slide-in-from-top-2 duration-300">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {editingItem ? 'Edit Navigation Item' : 'Add Navigation Item'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    ref={labelInputRef}
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Navigation label (e.g., 'Pricing')"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link Type
                  </label>
                  <select
                    value={linkType}
                    onChange={(e) => setLinkType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="section">Section on this page</option>
                    <option value="external">External URL</option>
                    <option value="email">Email address</option>
                    <option value="phone">Phone number</option>
                  </select>
                </div>

                {linkType === 'section' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Section
                    </label>
                    <select
                      value={formData.sectionId || ''}
                      onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a section</option>
                      {availableSections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {linkType === 'external' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                {linkType === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.link.replace('mailto:', '')}
                      onChange={(e) => setFormData({ ...formData, link: `mailto:${e.target.value}` })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contact@example.com"
                    />
                  </div>
                )}

                {linkType === 'phone' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.link.replace('tel:', '')}
                      onChange={(e) => setFormData({ ...formData, link: `tel:${e.target.value}` })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1-234-567-8900"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveItem}
                    disabled={!formData.label.trim()}
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

          {!showAddForm && navItems.length < store.navigationConfig.maxItems && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              + Add Navigation Item
            </button>
          )}

          {navItems.length >= store.navigationConfig.maxItems && (
            <div className="text-sm text-gray-500 text-center py-3">
              Maximum {store.navigationConfig.maxItems} navigation items allowed for this header type.
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

/**
 * Generate a display name for a section based on its ID and layout
 */
function getSectionDisplayName(sectionId: string, layout: string): string {
  // Extract type from section ID
  const type = sectionId.split('-')[0] || '';
  
  // Map section types to display names
  const typeDisplayNames: Record<string, string> = {
    hero: 'Hero Section',
    features: 'Features',
    pricing: 'Pricing',
    testimonials: 'Testimonials',
    faq: 'FAQ',
    problem: 'Problem',
    results: 'Results',
    comparison: 'Comparison',
    howitworks: 'How It Works',
    usecase: 'Use Cases',
    integration: 'Integrations',
    security: 'Security',
    objection: 'Objections',
    socialproof: 'Social Proof',
    beforeafter: 'Before & After',
    uniquemechanism: 'Unique Mechanism',
    foundernote: 'Founder Note',
    close: 'Call to Action',
    primarycta: 'Get Started',
  };

  const baseName = typeDisplayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  
  // If there are multiple sections of the same type, show layout info
  if (layout && layout !== 'default') {
    return `${baseName} (${layout})`;
  }
  
  return baseName;
}

export default NavigationEditor;