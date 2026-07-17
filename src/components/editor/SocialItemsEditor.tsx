'use client';

// src/components/editor/SocialItemsEditor.tsx
// toolbar-standard-beta phase 4 (t5) — THE manage-items editor for the project's
// SITE-LEVEL social profiles (`socialMediaConfig.items`). Replaces
// `src/components/social/SocialMediaEditor.tsx`, which is DELETED.
//
// ⚠️ HONESTY NOTE (read before believing the plan's honesty table). That table
// lists Social as "Manage items (NEW, t5) — add/remove/reorder/edit", i.e. the one
// genuinely new CAPABILITY in Beta. That is WRONG, and phase 4 verified it:
// `SocialMediaEditor` ALREADY had add / edit / remove / move-up / move-down / cap
// enforcement, and it was ALREADY reachable from the app header menu
// (GlobalAppHeader.tsx:188 → showSocialModal). So this is a RESKIN + a new ENTRY
// POINT (the footer toolbar), not a new capability. Nothing here is a behaviour
// change: every store call below is carried over verbatim.
//
// WHAT IS ACTUALLY NEW IN PHASE 4:
//   1. the t5 look (app-chrome tokens from ui-foundation, replacing ad-hoc greys);
//   2. `data-testid` hooks so the reorder invariant is assertable from e2e at all
//      (the old editor exposed no stable DOM contract);
//   3. reachability from the FOOTER toolbar's "Manage social" action.
//
// TWO DIFFERENT "SOCIAL"s — DO NOT CONFLATE (this bit phase 4):
//   - `socialMediaConfig` (THIS file): the store-level, site-wide profile list.
//     It is the source for the LinkPicker's derived Social options and the
//     Brief↔config bridge (persistenceActions). It is NOT rendered by any block.
//   - `social_links` (NOT this file): per-template footer BLOCK CONTENT (e.g.
//     hearth ContactFooterRich:24,35), edited INLINE via `data-element-key`
//     (`social_platform_<id>`). That is what a visitor actually sees in a footer.
// Wiring one to the other is a published-output change ⇒ out of scope, own spec.
//
// NO ORIENTATION (plan D-2): `SocialMediaConfig` (state.ts:141-145) has no
// orientation field; adding one = new store field + both published renderers must
// read it. It ships as a GREYED PLACEHOLDER on the footer toolbar (ruling 9)
// instead — deliberately NOT here, because there is nothing to render behind it.
//
// Store convention: selector for state, `useEditStoreApi()` for actions (CLAUDE.md).
// Props keep the `isVisible`/`onClose` surface EXACTLY — `GlobalModals.tsx:95`
// mounts this through `SocialProfilesPanel` and is not in phase 4's files-touched.

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEditStore, useEditStoreApi } from '@/hooks/useEditStore';
import type { SocialMediaItem } from '@/types/store/state';
import {
  FaTwitter,
  FaLinkedin,
  FaGithub,
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaDiscord,
  FaMedium,
  FaDribbble,
  FaGlobe,
} from 'react-icons/fa';
import { processSocialMediaUrl, getDisplayUrl } from '@/utils/urlHelpers';

interface SocialItemsEditorProps {
  isVisible: boolean;
  onClose: () => void;
}

interface SocialFormData {
  platform: string;
  url: string;
  icon: string;
}

/**
 * Predefined platforms. Carried over VERBATIM from SocialMediaEditor — the `icon`
 * strings are persisted in `socialMediaConfig.items[].icon` and re-read by
 * `getIconComponent`, so renaming one silently breaks every saved project.
 */
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

export function SocialItemsEditor({ isVisible, onClose }: SocialItemsEditorProps) {
  // Render-read: socialMediaConfig drives the whole panel. Every mutation runs
  // through storeApi.getState() in a handler (non-reactive) — the CLAUDE.md pattern.
  const socialMediaConfig = useEditStore((s) => s.socialMediaConfig);
  const storeApi = useEditStoreApi();

  const [editingItem, setEditingItem] = useState<SocialMediaItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<SocialFormData>({ platform: '', url: '', icon: '' });
  const [urlError, setUrlError] = useState<string>('');

  const editFormRef = useRef<HTMLDivElement>(null);
  const platformSelectRef = useRef<HTMLSelectElement>(null);

  // Ported verbatim: auto-scroll + focus when the add/edit form appears.
  useEffect(() => {
    if (showAddForm && editFormRef.current && platformSelectRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const t = setTimeout(() => platformSelectRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [showAddForm, editingItem]);

  // Lazily create the config the first time the panel is opened.
  useEffect(() => {
    if (isVisible && !socialMediaConfig) {
      storeApi.getState().initializeSocialMedia();
    }
  }, [isVisible, socialMediaConfig, storeApi]);

  if (!isVisible || !socialMediaConfig) return null;
  if (typeof document === 'undefined') return null;

  const socialItems = socialMediaConfig.items;
  const atCap = socialItems.length >= socialMediaConfig.maxItems;

  const resetForm = () => {
    setFormData({ platform: '', url: '', icon: '' });
    setEditingItem(null);
    setShowAddForm(false);
    setUrlError('');
  };

  const handleSaveItem = () => {
    if (!formData.platform.trim() || !formData.url.trim() || !formData.icon) return;

    const { url: normalizedUrl, isValid } = processSocialMediaUrl(formData.url, formData.platform);
    if (!isValid) return;

    if (editingItem) {
      storeApi.getState().updateSocialMediaItem(editingItem.id, {
        platform: formData.platform,
        url: normalizedUrl,
        icon: formData.icon,
      });
    } else {
      storeApi.getState().addSocialMediaItem(formData.platform, normalizedUrl, formData.icon);
    }
    resetForm();
  };

  const handleEditItem = (item: SocialMediaItem) => {
    setEditingItem(item);
    setFormData({ platform: item.platform, url: item.url, icon: item.icon });
    setShowAddForm(true);
  };

  /**
   * Adjacent swap → `reorderSocialMediaItems(ids)` (layoutActions.ts:1229), which
   * takes the FULL id order and rewrites each item's `order` field. Plan step 1:
   * adjacent swap, NOT @dnd-kit.
   */
  const moveItem = (index: number, delta: -1 | 1) => {
    const next = [...socialItems];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    storeApi.getState().reorderSocialMediaItems(next.map((i) => i.id));
  };

  const handlePlatformChange = (platformName: string) => {
    const platform = SOCIAL_PLATFORMS.find((p) => p.name === platformName);
    if (platform) {
      setFormData({ ...formData, platform: platformName, icon: platform.icon });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getIconComponent = (iconName: string) =>
    SOCIAL_PLATFORMS.find((p) => p.icon === iconName)?.component || FaGlobe;

  const currentPlaceholder =
    SOCIAL_PLATFORMS.find((p) => p.name === formData.platform)?.placeholder ||
    'https://example.com/yourprofile';

  const saveDisabled =
    !formData.platform.trim() || !formData.url.trim() || !formData.icon || !!urlError;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        data-testid="social-items-editor"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-app-modal bg-app-surface font-app-sans shadow-app-modal"
      >
        <div className="flex-shrink-0 border-b border-app-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-app-ink">Social profiles</h2>
            <button
              onClick={handleClose}
              data-testid="social-close"
              aria-label="Close"
              className="text-app-faint transition-colors hover:text-app-body"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-xs text-app-muted">
            Used across your site wherever social links appear.
          </p>
        </div>

        <div className="max-h-[calc(90vh-180px)] flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-app-label">Current profiles</h3>
            <div className="space-y-2" data-testid="social-item-list">
              {socialItems.map((item, index) => {
                const IconComponent = getIconComponent(item.icon);
                return (
                  <div
                    key={item.id}
                    data-testid="social-item"
                    data-platform={item.platform}
                    className="flex items-center justify-between rounded-app-ctl bg-app-canvas p-3"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <IconComponent className="h-5 w-5 text-app-body" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-app-ink" data-testid="social-item-platform">
                          {item.platform}
                        </div>
                        <div className="truncate text-sm text-app-muted">{getDisplayUrl(item.url)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Move up/down are RENDERED ONLY when a move is possible —
                          carried over from SocialMediaEditor. The first row has no
                          up, the last no down. */}
                      {index > 0 && (
                        <button
                          onClick={() => moveItem(index, -1)}
                          data-testid="social-move-up"
                          className="p-1 text-app-faint transition-colors hover:text-app-body"
                          title="Move up"
                          aria-label={`Move ${item.platform} up`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}
                      {index < socialItems.length - 1 && (
                        <button
                          onClick={() => moveItem(index, 1)}
                          data-testid="social-move-down"
                          className="p-1 text-app-faint transition-colors hover:text-app-body"
                          title="Move down"
                          aria-label={`Move ${item.platform} down`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleEditItem(item)}
                        data-testid="social-edit"
                        className="p-1 text-app-faint transition-colors hover:text-app-primary"
                        title="Edit"
                        aria-label={`Edit ${item.platform}`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => storeApi.getState().removeSocialMediaItem(item.id)}
                        data-testid="social-remove"
                        className="p-1 text-app-faint transition-colors hover:text-app-danger"
                        title="Remove"
                        aria-label={`Remove ${item.platform}`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              {socialItems.length === 0 && (
                <div className="py-6 text-center text-sm text-app-muted">
                  No social profiles yet.
                </div>
              )}
            </div>
          </div>

          {showAddForm && (
            <div
              ref={editFormRef}
              data-testid="social-item-form"
              className="animate-in slide-in-from-top-2 border-t border-app-border pt-6 duration-300"
            >
              <h3 className="mb-3 text-sm font-medium text-app-label">
                {editingItem ? 'Edit profile' : 'Add profile'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-app-label">Platform</label>
                  <select
                    ref={platformSelectRef}
                    value={formData.platform}
                    data-testid="social-platform-select"
                    onChange={(e) => handlePlatformChange(e.target.value)}
                    className="w-full rounded-app-input border border-app-border-input px-3 py-2 text-app-ink focus:outline-none focus:ring-2 focus:ring-app-primary"
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
                  <label className="mb-1 block text-sm font-medium text-app-label">URL</label>
                  <input
                    type="text"
                    value={formData.url}
                    data-testid="social-url-input"
                    onChange={(e) => {
                      setFormData({ ...formData, url: e.target.value });
                      setUrlError('');
                    }}
                    onBlur={() => {
                      if (formData.url) {
                        const { isValid, error } = processSocialMediaUrl(formData.url, formData.platform);
                        setUrlError(!isValid ? error || 'Invalid URL' : '');
                      }
                    }}
                    className={`w-full rounded-app-input border px-3 py-2 text-app-ink focus:outline-none focus:ring-2 ${
                      urlError
                        ? 'border-app-danger focus:ring-app-danger'
                        : 'border-app-border-input focus:ring-app-primary'
                    }`}
                    placeholder={currentPlaceholder}
                  />
                  {urlError && <p className="mt-1 text-sm text-app-danger">{urlError}</p>}
                  {formData.url && !urlError && (
                    <p className="mt-1 text-sm text-app-muted">
                      Will be saved as: {processSocialMediaUrl(formData.url, formData.platform).url}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveItem}
                    data-testid="social-save"
                    disabled={saveDisabled}
                    className="rounded-app-ctl bg-app-primary px-4 py-2 text-white transition-colors hover:bg-app-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {editingItem ? 'Update' : 'Add'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="rounded-app-ctl border border-app-border-input px-4 py-2 text-app-body transition-colors hover:bg-app-hover"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* "+ Add" dashed affordance — hidden at the cap (ported behaviour). */}
          {!showAddForm && !atCap && (
            <button
              onClick={() => setShowAddForm(true)}
              data-testid="social-add"
              className="w-full rounded-app-ctl border-2 border-dashed border-app-border-strong p-3 text-app-muted transition-colors hover:border-app-border-soft hover:text-app-body"
            >
              + Add social profile
            </button>
          )}

          {atCap && (
            <div data-testid="social-cap-notice" className="py-3 text-center text-sm text-app-muted">
              Maximum {socialMediaConfig.maxItems} social profiles allowed.
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-app-border bg-app-canvas p-6">
          <button
            onClick={handleClose}
            className="w-full rounded-app-ctl bg-app-ink px-4 py-2 text-white transition-colors hover:bg-app-ink/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default SocialItemsEditor;
