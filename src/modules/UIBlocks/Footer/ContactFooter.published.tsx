/**
 * ContactFooter - Published Version
 *
 * Server-safe footer with contact info, social links, newsletter section
 * Uses V2 array format for social_links
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { LogoPublished } from '@/components/published/LogoPublished';
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
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

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
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

export default function ContactFooterPublished(props: LayoutComponentProps) {
  const { theme } = props;

  // Extract content from props with defaults
  const footerStyle = props.footer_style || 'dark';
  const isDark = footerStyle === 'dark';
  const copyright = props.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`;
  const newsletter_title = props.newsletter_title || 'Stay Updated';
  const newsletter_description = props.newsletter_description || 'Get the latest updates and news delivered to your inbox.';
  const newsletter_cta = props.newsletter_cta || 'Subscribe';

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

  // Build contact information array
  const contactInfo = [
    { icon: FaEnvelope, text: props.email, type: 'email' },
    { icon: FaPhone, text: props.phone, type: 'phone' },
    { icon: FaMapMarkerAlt, text: props.address, type: 'address' },
  ].filter(item => item.text && item.text.trim() !== '');

  // Get social_links from V2 array format
  const socialLinks: SocialLink[] = Array.isArray(props.social_links) ? props.social_links : [];

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || FaGlobe;
  };

  return (
    <footer style={{ backgroundColor: colors.bg, color: colors.text }} className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid: Contact Info + Newsletter */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Left Column: Logo + Contact Info */}
          <div>
            <div className="mb-6">
              <LogoPublished
                logoUrl={props.logo}
                companyName={props.company_name || 'Company'}
                size="md"
                className={`h-8 ${isDark ? 'brightness-0 invert' : ''}`}
              />
            </div>

            {/* Contact Information */}
            {contactInfo.length > 0 && (
              <div className="space-y-3">
                {contactInfo.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <Icon style={{ color: colors.textMuted }} className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span style={{ color: colors.textBody }} className="text-sm">
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Social Media Links - V2 Array Format */}
            {socialLinks.length > 0 && (
              <div style={{ borderColor: colors.border }} className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-4">
                  {socialLinks.map((social) => {
                    const IconComponent = getIconComponent(social.icon);
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: colors.textMuted }}
                        className="hover:opacity-80 transition-opacity"
                        aria-label={social.platform}
                      >
                        <IconComponent className="w-5 h-5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Newsletter */}
          <div>
            <h3 style={{ color: colors.text }} className="font-semibold mb-2">
              {newsletter_title}
            </h3>
            <p style={{ color: colors.textBody }} className="text-sm mb-4">
              {newsletter_description}
            </p>

            {/* Static Newsletter Form (disabled in published) */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                disabled
                style={{
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.textMuted
                }}
                className="flex-1 px-3 py-2 text-sm border rounded-lg cursor-not-allowed"
              />
              <button
                disabled
                style={{
                  backgroundColor: colors.buttonBg,
                  color: colors.buttonText,
                  opacity: 0.7
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                {newsletter_cta}
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ borderColor: colors.border }} className="pt-8 border-t text-center">
          <p style={{ color: colors.textMuted }} className="text-sm">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
