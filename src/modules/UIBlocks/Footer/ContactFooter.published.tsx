/**
 * ContactFooter - Published Version
 *
 * Server-safe footer with contact info, social links, newsletter section
 * Used by componentRegistry.published.ts for SSR rendering
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

export default function ContactFooterPublished(props: LayoutComponentProps) {
  const { theme } = props;

  // Extract content from props with defaults
  const copyright = props.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`;
  const newsletter_title = props.newsletter_title || 'Stay Updated';
  const newsletter_description = props.newsletter_description || 'Get the latest updates and news delivered to your inbox.';
  const newsletter_cta = props.newsletter_cta || 'Subscribe';

  // Build contact information array
  const contactInfo = [
    { icon: FaEnvelope, text: props.email, type: 'email' },
    { icon: FaPhone, text: props.phone, type: 'phone' },
    { icon: FaMapMarkerAlt, text: props.address, type: 'address' },
  ].filter(item => item.text && item.text !== '___REMOVED___' && item.text.trim() !== '');

  // Parse social media items from props
  // Format: "platform|url" (e.g., "twitter|https://twitter.com/company")
  const socialItems = [
    props.social_item_1,
    props.social_item_2,
    props.social_item_3,
    props.social_item_4,
    props.social_item_5,
    props.social_item_6,
    props.social_item_7,
    props.social_item_8,
  ].filter(item => item && item !== '___REMOVED___' && item.trim() !== '')
    .map(item => {
      const parts = item.split('|');
      if (parts.length >= 2) {
        return { platform: parts[0].toLowerCase(), url: parts.slice(1).join('|') };
      }
      return null;
    })
    .filter((item): item is { platform: string; url: string } => item !== null && item.platform && item.url);

  // Social icon mapping
  const socialIconMap: Record<string, React.ComponentType<any>> = {
    twitter: FaTwitter,
    linkedin: FaLinkedin,
    github: FaGithub,
    facebook: FaFacebook,
    instagram: FaInstagram,
    youtube: FaYoutube,
    tiktok: FaTiktok,
    discord: FaDiscord,
    medium: FaMedium,
    dribbble: FaDribbble,
    website: FaGlobe,
  };

  return (
    <footer className="bg-gray-900 text-white py-16">
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
                className="h-8 brightness-0 invert"
              />
            </div>

            {/* Contact Information */}
            {contactInfo.length > 0 && (
              <div className="space-y-3">
                {contactInfo.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Social Media Links */}
            {socialItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-4">
                  {socialItems.map((social, index) => {
                    const IconComponent = socialIconMap[social.platform] || FaGlobe;
                    return (
                      <a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
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
            <h3 className="font-semibold text-white mb-2">{newsletter_title}</h3>
            <p className="text-sm text-gray-300 mb-4">{newsletter_description}</p>

            {/* Static Newsletter Form (disabled in Phase 1) */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                disabled
                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-400 placeholder-gray-500 cursor-not-allowed"
              />
              <button
                disabled
                style={{ backgroundColor: theme.colors.accentColor, opacity: 0.7 }}
                className="px-6 py-2 text-sm rounded-lg text-white font-semibold cursor-not-allowed"
              >
                {newsletter_cta}
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
