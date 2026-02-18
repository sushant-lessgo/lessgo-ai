import React, { useState } from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { LayoutSection } from '@/components/layout/LayoutSection';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import { LayoutComponentProps } from '@/types/storeTypes';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaTwitter, FaLinkedin, FaGithub, FaFacebook, FaInstagram, FaYoutube, FaTiktok, FaDiscord, FaMedium, FaDribbble, FaGlobe } from 'react-icons/fa';
import HeaderLogo from '@/components/ui/HeaderLogo';
import { normalizeUrl, isValidUrl } from '@/utils/urlHelpers';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

interface ContactFooterContent {
  footer_style?: 'dark' | 'light';
  copyright?: string;
  newsletter_title?: string;
  newsletter_description?: string;
  newsletter_cta?: string;
  email?: string;
  phone?: string;
  address?: string;
  social_links?: SocialLink[];
}



const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
};

const SOCIAL_PLATFORMS = [
  { name: 'Twitter/X', icon: 'FaTwitter', placeholder: 'https://twitter.com/yourhandle' },
  { name: 'LinkedIn', icon: 'FaLinkedin', placeholder: 'https://linkedin.com/company/yourcompany' },
  { name: 'GitHub', icon: 'FaGithub', placeholder: 'https://github.com/yourusername' },
  { name: 'Facebook', icon: 'FaFacebook', placeholder: 'https://facebook.com/yourpage' },
  { name: 'Instagram', icon: 'FaInstagram', placeholder: 'https://instagram.com/youraccount' },
  { name: 'YouTube', icon: 'FaYoutube', placeholder: 'https://youtube.com/c/yourchannel' },
  { name: 'TikTok', icon: 'FaTiktok', placeholder: 'https://tiktok.com/@yourusername' },
  { name: 'Discord', icon: 'FaDiscord', placeholder: 'https://discord.gg/yourinvite' },
  { name: 'Medium', icon: 'FaMedium', placeholder: 'https://medium.com/@yourusername' },
  { name: 'Dribbble', icon: 'FaDribbble', placeholder: 'https://dribbble.com/yourusername' },
  { name: 'Website', icon: 'FaGlobe', placeholder: 'https://yourwebsite.com' },
];

const ContactFooter: React.FC<LayoutComponentProps> = (props) => {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<ContactFooterContent>({
    ...props,
  });

  const [showSocialEditor, setShowSocialEditor] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [newLink, setNewLink] = useState({ platform: '', url: '', icon: '' });

  const footerStyle = blockContent.footer_style || 'dark';
  const isDark = footerStyle === 'dark';

  const socialLinks: SocialLink[] = blockContent.social_links || [];

  const contactInfo = [
    { icon: FaEnvelope, text: blockContent.email, id: 'email' },
    { icon: FaPhone, text: blockContent.phone, id: 'phone' },
    { icon: FaMapMarkerAlt, text: blockContent.address, id: 'address' },
  ].filter(info => info.text);

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || FaGlobe;
  };

  const handleAddSocialLink = () => {
    if (!newLink.platform || !newLink.url) return;
    const newItem: SocialLink = {
      id: `social-${Date.now()}`,
      platform: newLink.platform,
      url: normalizeUrl(newLink.url),
      icon: newLink.icon || 'FaGlobe',
    };
    const updated = [...socialLinks, newItem];
    (handleContentUpdate as any)('social_links', updated);
    setNewLink({ platform: '', url: '', icon: '' });
  };

  const handleRemoveSocialLink = (id: string) => {
    const updated = socialLinks.filter(link => link.id !== id);
    (handleContentUpdate as any)('social_links', updated);
  };

  const handleUpdateSocialLink = (id: string, updates: Partial<SocialLink>) => {
    const updated = socialLinks.map(link =>
      link.id === id ? { ...link, ...updates } : link
    );
    (handleContentUpdate as any)('social_links', updated);
    setEditingLink(null);
  };

  const handlePlatformSelect = (platformName: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.name === platformName);
    if (platform) {
      setNewLink({ ...newLink, platform: platformName, icon: platform.icon });
    }
  };

  // Color tokens based on footer style
  const colors = {
    bg: isDark ? '#111827' : '#F9FAFB',
    text: isDark ? '#FFFFFF' : '#111827',
    textMuted: isDark ? '#9CA3AF' : '#6B7280',
    textBody: isDark ? '#D1D5DB' : '#4B5563',
    border: isDark ? '#374151' : '#E5E7EB',
    inputBg: isDark ? '#1F2937' : '#FFFFFF',
    inputBorder: isDark ? '#374151' : '#D1D5DB',
    buttonBg: isDark ? '#374151' : '#374151',
    buttonText: '#FFFFFF',
  };

  return (
    <LayoutSection
      sectionId={sectionId}
      sectionType="ContactFooter"
      backgroundType={backgroundType}
      sectionBackground={sectionBackground}
      mode={mode}
      className="!p-0"
    >
      <div style={{ backgroundColor: colors.bg, color: colors.text }} className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <div className="mb-6">
                <HeaderLogo
                  mode={mode}
                  className={`h-8 w-auto object-contain ${isDark ? 'brightness-0 invert' : ''}`}
                />
              </div>
              <div className="space-y-3">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <Icon style={{ color: colors.textMuted }} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <EditableAdaptiveText
                        mode={mode}
                        value={info.text || ''}
                        onEdit={(value) => handleContentUpdate(info.id, value)}
                        backgroundType={backgroundType}
                        colorTokens={colorTokens}
                        variant="body"
                        className="text-sm"
                        textStyle={{ color: colors.textBody }}
                        placeholder="Contact info"
                        sectionId={sectionId}
                        elementKey={info.id}
                        sectionBackground={sectionBackground}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Social Media Links */}
              {(socialLinks.length > 0 || mode === 'edit') && (
                <div style={{ borderColor: colors.border }} className="mt-6 pt-4 border-t">
                  <div className="flex items-center gap-4 flex-wrap">
                    {socialLinks.map((social) => {
                      const IconComponent = getIconComponent(social.icon);
                      const normalizedUrl = normalizeUrl(social.url);
                      const validUrl = isValidUrl(normalizedUrl) ? normalizedUrl : '#';

                      return (
                        <div key={social.id} className="relative group">
                          <a
                            href={validUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: colors.textMuted }}
                            className="hover:opacity-80 transition-opacity"
                            aria-label={social.platform}
                            onClick={(e) => mode !== 'preview' ? e.preventDefault() : undefined}
                          >
                            <IconComponent className="w-5 h-5" />
                          </a>
                          {mode === 'edit' && (
                            <button
                              onClick={() => handleRemoveSocialLink(social.id)}
                              className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {mode === 'edit' && (
                      <button
                        onClick={() => setShowSocialEditor(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                        title="Add social media link"
                      >
                        + Add Social
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 style={{ color: colors.text }} className="font-semibold mb-2">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.newsletter_title || ''}
                  onEdit={(value) => handleContentUpdate('newsletter_title', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="font-semibold"
                  textStyle={{ color: colors.text }}
                  placeholder="Newsletter title"
                  sectionId={sectionId}
                  elementKey="newsletter_title"
                  sectionBackground={sectionBackground}
                />
              </h3>
              <div style={{ color: colors.textBody }} className="text-sm mb-4">
                <EditableAdaptiveText
                  mode={mode}
                  value={blockContent.newsletter_description || ''}
                  onEdit={(value) => handleContentUpdate('newsletter_description', value)}
                  backgroundType={backgroundType}
                  colorTokens={colorTokens}
                  variant="body"
                  className="text-sm"
                  textStyle={{ color: colors.textBody }}
                  placeholder="Newsletter description"
                  sectionId={sectionId}
                  elementKey="newsletter_description"
                  sectionBackground={sectionBackground}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                    color: colors.text
                  }}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none"
                />
                <button
                  style={{
                    backgroundColor: colors.buttonBg,
                    color: colors.buttonText,
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  {blockContent.newsletter_cta || 'Subscribe'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ borderColor: colors.border }} className="pt-8 border-t text-center">
            <div style={{ color: colors.textMuted }} className="text-sm">
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.copyright || ''}
                onEdit={(value) => handleContentUpdate('copyright', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="text-sm"
                textStyle={{ color: colors.textMuted }}
                placeholder="Copyright notice"
                sectionId={sectionId}
                elementKey="copyright"
                sectionBackground={sectionBackground}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Simple Social Media Editor Modal */}
      {showSocialEditor && mode === 'edit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Social Link</h3>
              <button onClick={() => setShowSocialEditor(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  value={newLink.platform}
                  onChange={(e) => handlePlatformSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="">Select platform</option>
                  {SOCIAL_PLATFORMS.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder={SOCIAL_PLATFORMS.find(p => p.name === newLink.platform)?.placeholder || 'https://...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddSocialLink}
                  disabled={!newLink.platform || !newLink.url}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Link
                </button>
                <button
                  onClick={() => setShowSocialEditor(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </LayoutSection>
  );
};

export default ContactFooter;
