/**
 * LinksAndSocialFooter - Published Version
 *
 * Server-safe footer with logo, tagline, social links, copyright
 * Centered layout, dark theme
 * Used by componentRegistry.published.ts for SSR rendering
 */

import React from 'react';
import { LayoutComponentProps } from '@/types/storeTypes';
import { LogoPublished } from '@/components/published/LogoPublished';
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

export default function LinksAndSocialFooterPublished(props: LayoutComponentProps) {
  // Extract content from props with defaults
  const copyright = props.copyright || `© ${new Date().getFullYear()} Your Company. All rights reserved.`;
  const company_name = props.company_name || 'Your Company';
  const tagline = props.tagline || 'Building the future of technology';

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
    props.social_item_9,
    props.social_item_10,
    props.social_item_11,
  ].filter(item => item && item !== '___REMOVED___' && item.trim() !== '')
    .map(item => {
      const parts = item.split('|');
      if (parts.length >= 2) {
        return { platform: parts[0].toLowerCase(), url: parts.slice(1).join('|') };
      }
      return null;
    })
    .filter((item): item is { platform: string; url: string } =>
      item !== null && item.platform && item.url
    );

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
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Content Container */}
        <div className="flex flex-col items-center gap-6 mb-8">
          {/* Logo */}
          <LogoPublished
            logoUrl={props.logo}
            companyName={company_name}
            size="md"
            className="h-8 brightness-0 invert"
          />

          {/* Tagline */}
          <p className="text-gray-400 text-center text-sm">{tagline}</p>

          {/* Social Media Icons */}
          {socialItems.length > 0 && (
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
          )}
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
