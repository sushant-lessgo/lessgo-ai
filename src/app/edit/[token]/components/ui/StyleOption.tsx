// /app/edit/[token]/components/ui/StyleOption.tsx
"use client";

import React, { useState } from 'react';
import { getBackgroundPreview } from './backgroundCompatibility';
import { validateBackgroundVariation } from './backgroundValidation';
import type { BackgroundVariation, BrandColors } from '@/types/core';

import { logger } from '@/lib/logger';
interface StyleOptionProps {
  variation: BackgroundVariation;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'vertical' | 'horizontal';
  brandColors?: BrandColors | null;
  showValidation?: boolean;
  disabled?: boolean;
}

export function StyleOption({
  variation,
  isSelected = false,
  onClick,
  onHover,
  onHoverEnd,
  showDetails = true,
  size = 'medium',
  layout = 'vertical',
  brandColors = null,
  showValidation = false,
  disabled = false,
}: StyleOptionProps) {
  // Debug log at the top level to ensure it runs
  logger.debug('🔎 TOP LEVEL StyleOption called with variation:', variation);
  logger.debug('🔎 TOP LEVEL variation.css:', variation.css);
  logger.debug('🔎 TOP LEVEL variation.label:', variation.label);
  logger.debug('🔎 TOP LEVEL variation.category:', variation.category);
  
  const [isHovered, setIsHovered] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Get background preview data
  const previewData = getBackgroundPreview(variation);
  
  // Validate background if requested
  React.useEffect(() => {
    if (showValidation) {
      const result = validateBackgroundVariation(variation, brandColors);
      setValidationResult(result);
    }
  }, [variation, brandColors, showValidation]);

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    onHover?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverEnd?.();
  };

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'h-16',
      preview: 'h-12',
      text: 'text-xs',
      padding: 'p-2',
    },
    medium: {
      container: 'h-24',
      preview: 'h-16',
      text: 'text-sm',
      padding: 'p-3',
    },
    large: {
      container: 'h-32',
      preview: 'h-20',
      text: 'text-base',
      padding: 'p-4',
    },
  };

  const config = sizeConfig[size];

  // Helper to convert Tailwind color names to hex
  const convertTailwindColorToHex = (colorName: string): string | null => {
    const colorMap: Record<string, string> = {
      // Basic colors
      'transparent': 'transparent', 'white': '#ffffff', 'black': '#000000',
      
      // Blues
      'blue-50': '#eff6ff', 'blue-100': '#dbeafe', 'blue-200': '#bfdbfe', 'blue-300': '#93c5fd',
      'blue-400': '#60a5fa', 'blue-500': '#3b82f6', 'blue-600': '#2563eb', 'blue-700': '#1d4ed8',
      'blue-800': '#1e40af', 'blue-900': '#1e3a8a',
      
      // Sky
      'sky-50': '#f0f9ff', 'sky-100': '#e0f2fe', 'sky-200': '#bae6fd', 'sky-300': '#7dd3fc',
      'sky-400': '#38bdf8', 'sky-500': '#0ea5e9', 'sky-600': '#0284c7', 'sky-700': '#0369a1',
      'sky-800': '#075985', 'sky-900': '#0c4a6e',
      
      // Indigo
      'indigo-50': '#eef2ff', 'indigo-100': '#e0e7ff', 'indigo-200': '#c7d2fe', 'indigo-300': '#a5b4fc',
      'indigo-400': '#818cf8', 'indigo-500': '#6366f1', 'indigo-600': '#4f46e5', 'indigo-700': '#4338ca',
      'indigo-800': '#3730a3', 'indigo-900': '#312e81',
      
      // Purple/Violet
      'purple-50': '#faf5ff', 'purple-100': '#f3e8ff', 'purple-200': '#e9d5ff', 'purple-300': '#d8b4fe',
      'purple-400': '#c084fc', 'purple-500': '#a855f7', 'purple-600': '#9333ea', 'purple-700': '#7e22ce',
      'purple-800': '#6b21a8', 'purple-900': '#581c87',
      
      'violet-50': '#f5f3ff', 'violet-100': '#ede9fe', 'violet-200': '#ddd6fe', 'violet-300': '#c4b5fd',
      'violet-400': '#a78bfa', 'violet-500': '#8b5cf6', 'violet-600': '#7c3aed', 'violet-700': '#6d28d9',
      'violet-800': '#5b21b6', 'violet-900': '#4c1d95',
      
      // Greens
      'green-50': '#f0fdf4', 'green-100': '#dcfce7', 'green-200': '#bbf7d0', 'green-300': '#86efac',
      'green-400': '#4ade80', 'green-500': '#22c55e', 'green-600': '#16a34a', 'green-700': '#15803d',
      'green-800': '#166534', 'green-900': '#14532d',
      
      // Emerald
      'emerald-50': '#ecfdf5', 'emerald-100': '#d1fae5', 'emerald-200': '#a7f3d0', 'emerald-300': '#6ee7b7',
      'emerald-400': '#34d399', 'emerald-500': '#10b981', 'emerald-600': '#059669', 'emerald-700': '#047857',
      'emerald-800': '#065f46', 'emerald-900': '#064e3b',
      
      // Teal
      'teal-50': '#f0fdfa', 'teal-100': '#ccfbf1', 'teal-200': '#99f6e4', 'teal-300': '#5eead4',
      'teal-400': '#2dd4bf', 'teal-500': '#14b8a6', 'teal-600': '#0d9488', 'teal-700': '#0f766e',
      'teal-800': '#115e59', 'teal-900': '#134e4a',
      
      // Cyan
      'cyan-50': '#ecfeff', 'cyan-100': '#cffafe', 'cyan-200': '#a5f3fc', 'cyan-300': '#67e8f9',
      'cyan-400': '#22d3ee', 'cyan-500': '#06b6d4', 'cyan-600': '#0891b2', 'cyan-700': '#0e7490',
      'cyan-800': '#155e75', 'cyan-900': '#164e63',
      
      // Reds/Rose/Pink
      'red-50': '#fef2f2', 'red-100': '#fee2e2', 'red-200': '#fecaca', 'red-300': '#fca5a5',
      'red-400': '#f87171', 'red-500': '#ef4444', 'red-600': '#dc2626', 'red-700': '#b91c1c',
      'red-800': '#991b1b', 'red-900': '#7f1d1d',
      
      'rose-50': '#fff1f2', 'rose-100': '#ffe4e6', 'rose-200': '#fecdd3', 'rose-300': '#fda4af',
      'rose-400': '#fb7185', 'rose-500': '#f43f5e', 'rose-600': '#e11d48', 'rose-700': '#be123c',
      'rose-800': '#9f1239', 'rose-900': '#881337',
      
      'pink-50': '#fdf2f8', 'pink-100': '#fce7f3', 'pink-200': '#fbcfe8', 'pink-300': '#f9a8d4',
      'pink-400': '#f472b6', 'pink-500': '#ec4899', 'pink-600': '#db2777', 'pink-700': '#be185d',
      'pink-800': '#9d174d', 'pink-900': '#831843',
      
      // Oranges/Amber
      'orange-50': '#fff7ed', 'orange-100': '#ffedd5', 'orange-200': '#fed7aa', 'orange-300': '#fdba74',
      'orange-400': '#fb923c', 'orange-500': '#f97316', 'orange-600': '#ea580c', 'orange-700': '#c2410c',
      'orange-800': '#9a3412', 'orange-900': '#7c2d12',
      
      'amber-50': '#fffbeb', 'amber-100': '#fef3c7', 'amber-200': '#fde68a', 'amber-300': '#fcd34d',
      'amber-400': '#fbbf24', 'amber-500': '#f59e0b', 'amber-600': '#d97706', 'amber-700': '#b45309',
      'amber-800': '#92400e', 'amber-900': '#78350f',
      
      // Yellows
      'yellow-50': '#fefce8', 'yellow-100': '#fef9c3', 'yellow-200': '#fef08a', 'yellow-300': '#fde047',
      'yellow-400': '#facc15', 'yellow-500': '#eab308', 'yellow-600': '#ca8a04', 'yellow-700': '#a16207',
      'yellow-800': '#854d0e', 'yellow-900': '#713f12',
      
      // Grays
      'gray-50': '#f9fafb', 'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb', 'gray-300': '#d1d5db',
      'gray-400': '#9ca3af', 'gray-500': '#6b7280', 'gray-600': '#4b5563', 'gray-700': '#374151',
      'gray-800': '#1f2937', 'gray-900': '#111827',
      
      'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1',
      'slate-400': '#94a3b8', 'slate-500': '#64748b', 'slate-600': '#475569', 'slate-700': '#334155',
      'slate-800': '#1e293b', 'slate-900': '#0f172a',
      
      'zinc-50': '#fafafa', 'zinc-100': '#f4f4f5', 'zinc-200': '#e4e4e7', 'zinc-300': '#d4d4d8',
      'zinc-400': '#a1a1aa', 'zinc-500': '#71717a', 'zinc-600': '#52525b', 'zinc-700': '#3f3f46',
      'zinc-800': '#27272a', 'zinc-900': '#18181b',
      
      'neutral-50': '#fafafa', 'neutral-100': '#f5f5f5', 'neutral-200': '#e5e5e5', 'neutral-300': '#d4d4d4',
      'neutral-400': '#a3a3a3', 'neutral-500': '#737373', 'neutral-600': '#525252', 'neutral-700': '#404040',
      'neutral-800': '#262626', 'neutral-900': '#171717',
      
      // Custom colors I found in the variations
      'mint-50': '#f0fdfa', 'mint-100': '#ccfbf1', 'mint-200': '#99f6e4', 'mint-300': '#5eead4',
      'mint-400': '#2dd4bf', 'mint-500': '#14b8a6',
      'peach': '#ffcdb2', 'peachpuff': '#ffdab9',
    };
    return colorMap[colorName] || null;
  };

  // Helper to convert Tailwind classes to inline styles
  const getBackgroundStyle = (bgClass: string) => {
    if (!bgClass) return { backgroundColor: '#f3f4f6' };
    
    // Debug logging to see what classes we're actually getting
    logger.debug('🎨 StyleOption bgClass:', bgClass);
    
    // Handle opacity syntax (e.g., bg-white/60, bg-blue-500/80)
    const opacityMatch = bgClass.match(/bg-([a-zA-Z]+-?\d*|white|black)\/(\d+)/);
    if (opacityMatch) {
      const colorName = opacityMatch[1];
      const opacity = parseInt(opacityMatch[2]) / 100;
      
      let hexColor = colorName === 'white' ? '#ffffff' : 
                     colorName === 'black' ? '#000000' :
                     convertTailwindColorToHex(colorName) || '#ffffff';
      
      // Convert hex to rgba with opacity
      const r = parseInt(hexColor.substr(1, 2), 16);
      const g = parseInt(hexColor.substr(3, 2), 16);
      const b = parseInt(hexColor.substr(5, 2), 16);
      
      logger.debug('✅ Found opacity color:', `rgba(${r}, ${g}, ${b}, ${opacity})`);
      return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})` };
    }

    // Handle arbitrary value syntax like bg-[#hexcolor]
    const arbitraryColorMatch = bgClass.match(/bg-\[([#\w]+)\]/);
    if (arbitraryColorMatch) {
      const color = arbitraryColorMatch[1];
      logger.debug('✅ Found arbitrary color:', color);
      return { backgroundColor: color };
    }
    
    // Handle standard gradients with arbitrary hex colors (e.g., bg-gradient-to-tr from-[#hex] via-[#hex] to-[#hex])
    // Also handle mixed formats (e.g., from-white via-[#hex] to-[#hex])
    if (bgClass.includes('gradient-to-') && (bgClass.includes('from-[') || bgClass.includes('from-'))) {
      // Extract gradient direction
      let direction = 'to bottom right'; // default
      if (bgClass.includes('gradient-to-r')) direction = 'to right';
      else if (bgClass.includes('gradient-to-l')) direction = 'to left';
      else if (bgClass.includes('gradient-to-t')) direction = 'to top';
      else if (bgClass.includes('gradient-to-b')) direction = 'to bottom';
      else if (bgClass.includes('gradient-to-tr')) direction = 'to top right';
      else if (bgClass.includes('gradient-to-tl')) direction = 'to top left';
      else if (bgClass.includes('gradient-to-br')) direction = 'to bottom right';
      else if (bgClass.includes('gradient-to-bl')) direction = 'to bottom left';

      // Extract colors - handle both [#color] and plain color formats
      // Use word boundaries to avoid matching gradient-to-tr instead of to-indigo-500
      const fromMatch = bgClass.match(/from-\[([#\w]+)\](?:\/\d+)?/) || bgClass.match(/\s+from-([a-zA-Z]+-?\d*|white|black|transparent)/);
      const viaMatch = bgClass.match(/via-\[([#\w]+)\](?:\/\d+)?/) || bgClass.match(/\s+via-([a-zA-Z]+-?\d*|white|black|transparent)/);
      const toMatch = bgClass.match(/to-\[([#\w]+)\]/) || bgClass.match(/\s+to-([a-zA-Z]+-?\d*|white|black|transparent)/);
      
      if (fromMatch && toMatch) {
        let fromColor = fromMatch[1];
        let toColor = toMatch[1];
        let viaColor = viaMatch?.[1];
        
        // Convert Tailwind color names to hex if needed
        logger.debug('🎨 Converting gradient colors:', { fromColor, viaColor, toColor });
        if (!fromColor.startsWith('#')) {
          const convertedFrom = convertTailwindColorToHex(fromColor);
          logger.debug('🎨 From color conversion:', `${fromColor} → ${convertedFrom}`);
          fromColor = fromColor === 'white' ? '#ffffff' : 
                     fromColor === 'black' ? '#000000' : 
                     fromColor === 'transparent' ? 'transparent' :
                     convertedFrom || fromColor;
        }
        if (!toColor.startsWith('#')) {
          const convertedTo = convertTailwindColorToHex(toColor);
          logger.debug('🎨 To color conversion:', `${toColor} → ${convertedTo}`);
          toColor = toColor === 'white' ? '#ffffff' : 
                   toColor === 'black' ? '#000000' : 
                   toColor === 'transparent' ? 'transparent' :
                   convertedTo || toColor;
        }
        if (viaColor && !viaColor.startsWith('#')) {
          const convertedVia = convertTailwindColorToHex(viaColor);
          logger.debug('🎨 Via color conversion:', `${viaColor} → ${convertedVia}`);
          viaColor = viaColor === 'white' ? '#ffffff' : 
                    viaColor === 'black' ? '#000000' : 
                    viaColor === 'transparent' ? 'transparent' :
                    convertedVia || viaColor;
        }
        
        const colors = viaColor ? `${fromColor}, ${viaColor}, ${toColor}` : `${fromColor}, ${toColor}`;
        const gradient = `linear-gradient(${direction}, ${colors})`;
        
        logger.debug('✅ Found standard hex gradient:', gradient);
        return { background: gradient };
      }
    }

    // Handle inline gradient syntax (e.g., bg-[radial-gradient(...)])
    if (bgClass.includes('bg-[') && bgClass.includes('gradient') && !bgClass.includes('var(--tw-gradient-stops)')) {
      const inlineGradientMatch = bgClass.match(/bg-\[(.*gradient.*?)\]/);
      if (inlineGradientMatch) {
        let gradient = inlineGradientMatch[1];
        // Replace underscores with spaces and handle percentage values
        gradient = gradient.replace(/_/g, ' ').replace(/(\d+)%/g, '$1%');
        logger.debug('✅ Found inline gradient:', gradient);
        return { background: gradient };
      }
    }
    
    // Handle arbitrary gradient syntax with CSS variables
    if (bgClass.includes('bg-[') && bgClass.includes('gradient') && bgClass.includes('var(--tw-gradient-stops)')) {
      // Two different patterns:
      // 1. bg-[radial-gradient(...)] from-[#color] via-[#color] to-color (startup-skybox)
      // 2. bg-[radial-gradient(...)] from-blue-400 via-blue-200 to-transparent (soft-gradient-blur)
      
      const gradientBaseMatch = bgClass.match(/bg-\[(.*?gradient.*?var\(--tw-gradient-stops\).*?)\]/);
      if (gradientBaseMatch) {
        let gradientBase = gradientBaseMatch[1].replace(/_/g, ' ');
        
        // Extract colors - handle both [#color] and standard tailwind formats
        const fromMatch = bgClass.match(/from-\[([^\]]+)\]/) || bgClass.match(/from-([a-zA-Z]+-\d+|[a-zA-Z]+)/);
        const viaMatch = bgClass.match(/via-\[([^\]]+)\]/) || bgClass.match(/via-([a-zA-Z]+-\d+|[a-zA-Z]+)/);
        const toMatch = bgClass.match(/to-\[([^\]]+)\]/) || bgClass.match(/to-([a-zA-Z]+-\d+|[a-zA-Z]+)/);
        
        if (fromMatch && toMatch) {
          let fromColor = fromMatch[1];
          let toColor = toMatch[1];
          let viaColor = viaMatch?.[1];
          
          // Convert tailwind color names to hex if needed
          if (!fromColor.startsWith('#')) {
            fromColor = convertTailwindColorToHex(fromColor) || fromColor;
          }
          if (!toColor.startsWith('#')) {
            toColor = convertTailwindColorToHex(toColor) || toColor;
          }
          if (viaColor && !viaColor.startsWith('#')) {
            viaColor = convertTailwindColorToHex(viaColor) || viaColor;
          }
          
          let gradient;
          if (gradientBase.includes('radial-gradient')) {
            const colors = viaColor ? `${fromColor}, ${viaColor}, ${toColor}` : `${fromColor}, ${toColor}`;
            if (gradientBase.includes('ellipse_at_center')) {
              gradient = `radial-gradient(ellipse at center, ${colors})`;
            } else if (gradientBase.includes('ellipse_at_bottom')) {
              gradient = `radial-gradient(ellipse at bottom, ${colors})`;
            } else {
              gradient = `radial-gradient(circle at center, ${colors})`;
            }
          } else {
            const colors = viaColor ? `${fromColor}, ${viaColor}, ${toColor}` : `${fromColor}, ${toColor}`;
            gradient = `linear-gradient(135deg, ${colors})`;
          }
          
          logger.debug('✅ Found CSS variable gradient:', gradient);
          return { background: gradient };
        }
      }
    }
    
    // Comprehensive Tailwind color map
    const tailwindColors: Record<string, string> = {
      // Grays
      'bg-slate-50': '#f8fafc', 'bg-slate-100': '#f1f5f9', 'bg-slate-200': '#e2e8f0', 'bg-slate-300': '#cbd5e1',
      'bg-slate-400': '#94a3b8', 'bg-slate-500': '#64748b', 'bg-slate-600': '#475569', 'bg-slate-700': '#334155',
      'bg-slate-800': '#1e293b', 'bg-slate-900': '#0f172a',
      'bg-gray-50': '#f9fafb', 'bg-gray-100': '#f3f4f6', 'bg-gray-200': '#e5e7eb', 'bg-gray-300': '#d1d5db',
      'bg-gray-400': '#9ca3af', 'bg-gray-500': '#6b7280', 'bg-gray-600': '#4b5563', 'bg-gray-700': '#374151',
      'bg-gray-800': '#1f2937', 'bg-gray-900': '#111827',
      'bg-zinc-50': '#fafafa', 'bg-zinc-100': '#f4f4f5', 'bg-zinc-200': '#e4e4e7', 'bg-zinc-300': '#d4d4d8',
      'bg-zinc-400': '#a1a1aa', 'bg-zinc-500': '#71717a', 'bg-zinc-600': '#52525b', 'bg-zinc-700': '#3f3f46',
      'bg-zinc-800': '#27272a', 'bg-zinc-900': '#18181b',
      'bg-neutral-50': '#fafafa', 'bg-neutral-100': '#f5f5f5', 'bg-neutral-200': '#e5e5e5', 'bg-neutral-300': '#d4d4d4',
      'bg-neutral-400': '#a3a3a3', 'bg-neutral-500': '#737373', 'bg-neutral-600': '#525252', 'bg-neutral-700': '#404040',
      'bg-neutral-800': '#262626', 'bg-neutral-900': '#171717',
      'bg-stone-50': '#fafaf9', 'bg-stone-100': '#f5f5f4', 'bg-stone-200': '#e7e5e4', 'bg-stone-300': '#d6d3d1',
      'bg-stone-400': '#a8a29e', 'bg-stone-500': '#78716c', 'bg-stone-600': '#57534e', 'bg-stone-700': '#44403c',
      'bg-stone-800': '#292524', 'bg-stone-900': '#1c1917',

      // Reds
      'bg-red-50': '#fef2f2', 'bg-red-100': '#fee2e2', 'bg-red-200': '#fecaca', 'bg-red-300': '#fca5a5',
      'bg-red-400': '#f87171', 'bg-red-500': '#ef4444', 'bg-red-600': '#dc2626', 'bg-red-700': '#b91c1c',
      'bg-red-800': '#991b1b', 'bg-red-900': '#7f1d1d',

      // Oranges
      'bg-orange-50': '#fff7ed', 'bg-orange-100': '#ffedd5', 'bg-orange-200': '#fed7aa', 'bg-orange-300': '#fdba74',
      'bg-orange-400': '#fb923c', 'bg-orange-500': '#f97316', 'bg-orange-600': '#ea580c', 'bg-orange-700': '#c2410c',
      'bg-orange-800': '#9a3412', 'bg-orange-900': '#7c2d12',

      // Ambers
      'bg-amber-50': '#fffbeb', 'bg-amber-100': '#fef3c7', 'bg-amber-200': '#fde68a', 'bg-amber-300': '#fcd34d',
      'bg-amber-400': '#fbbf24', 'bg-amber-500': '#f59e0b', 'bg-amber-600': '#d97706', 'bg-amber-700': '#b45309',
      'bg-amber-800': '#92400e', 'bg-amber-900': '#78350f',

      // Yellows
      'bg-yellow-50': '#fefce8', 'bg-yellow-100': '#fef9c3', 'bg-yellow-200': '#fef08a', 'bg-yellow-300': '#fde047',
      'bg-yellow-400': '#facc15', 'bg-yellow-500': '#eab308', 'bg-yellow-600': '#ca8a04', 'bg-yellow-700': '#a16207',
      'bg-yellow-800': '#854d0e', 'bg-yellow-900': '#713f12',

      // Limes
      'bg-lime-50': '#f7fee7', 'bg-lime-100': '#ecfccb', 'bg-lime-200': '#d9f99d', 'bg-lime-300': '#bef264',
      'bg-lime-400': '#a3e635', 'bg-lime-500': '#84cc16', 'bg-lime-600': '#65a30d', 'bg-lime-700': '#4d7c0f',
      'bg-lime-800': '#365314', 'bg-lime-900': '#1a2e05',

      // Greens
      'bg-green-50': '#f0fdf4', 'bg-green-100': '#dcfce7', 'bg-green-200': '#bbf7d0', 'bg-green-300': '#86efac',
      'bg-green-400': '#4ade80', 'bg-green-500': '#22c55e', 'bg-green-600': '#16a34a', 'bg-green-700': '#15803d',
      'bg-green-800': '#166534', 'bg-green-900': '#14532d',

      // Emeralds
      'bg-emerald-50': '#ecfdf5', 'bg-emerald-100': '#d1fae5', 'bg-emerald-200': '#a7f3d0', 'bg-emerald-300': '#6ee7b7',
      'bg-emerald-400': '#34d399', 'bg-emerald-500': '#10b981', 'bg-emerald-600': '#059669', 'bg-emerald-700': '#047857',
      'bg-emerald-800': '#065f46', 'bg-emerald-900': '#064e3b',

      // Teals
      'bg-teal-50': '#f0fdfa', 'bg-teal-100': '#ccfbf1', 'bg-teal-200': '#99f6e4', 'bg-teal-300': '#5eead4',
      'bg-teal-400': '#2dd4bf', 'bg-teal-500': '#14b8a6', 'bg-teal-600': '#0d9488', 'bg-teal-700': '#0f766e',
      'bg-teal-800': '#115e59', 'bg-teal-900': '#134e4a',

      // Cyans
      'bg-cyan-50': '#ecfeff', 'bg-cyan-100': '#cffafe', 'bg-cyan-200': '#a5f3fc', 'bg-cyan-300': '#67e8f9',
      'bg-cyan-400': '#22d3ee', 'bg-cyan-500': '#06b6d4', 'bg-cyan-600': '#0891b2', 'bg-cyan-700': '#0e7490',
      'bg-cyan-800': '#155e75', 'bg-cyan-900': '#164e63',

      // Skys
      'bg-sky-50': '#f0f9ff', 'bg-sky-100': '#e0f2fe', 'bg-sky-200': '#bae6fd', 'bg-sky-300': '#7dd3fc',
      'bg-sky-400': '#38bdf8', 'bg-sky-500': '#0ea5e9', 'bg-sky-600': '#0284c7', 'bg-sky-700': '#0369a1',
      'bg-sky-800': '#075985', 'bg-sky-900': '#0c4a6e',

      // Blues
      'bg-blue-50': '#eff6ff', 'bg-blue-100': '#dbeafe', 'bg-blue-200': '#bfdbfe', 'bg-blue-300': '#93c5fd',
      'bg-blue-400': '#60a5fa', 'bg-blue-500': '#3b82f6', 'bg-blue-600': '#2563eb', 'bg-blue-700': '#1d4ed8',
      'bg-blue-800': '#1e40af', 'bg-blue-900': '#1e3a8a',

      // Indigos
      'bg-indigo-50': '#eef2ff', 'bg-indigo-100': '#e0e7ff', 'bg-indigo-200': '#c7d2fe', 'bg-indigo-300': '#a5b4fc',
      'bg-indigo-400': '#818cf8', 'bg-indigo-500': '#6366f1', 'bg-indigo-600': '#4f46e5', 'bg-indigo-700': '#4338ca',
      'bg-indigo-800': '#3730a3', 'bg-indigo-900': '#312e81',

      // Violets
      'bg-violet-50': '#f5f3ff', 'bg-violet-100': '#ede9fe', 'bg-violet-200': '#ddd6fe', 'bg-violet-300': '#c4b5fd',
      'bg-violet-400': '#a78bfa', 'bg-violet-500': '#8b5cf6', 'bg-violet-600': '#7c3aed', 'bg-violet-700': '#6d28d9',
      'bg-violet-800': '#5b21b6', 'bg-violet-900': '#4c1d95',

      // Purples
      'bg-purple-50': '#faf5ff', 'bg-purple-100': '#f3e8ff', 'bg-purple-200': '#e9d5ff', 'bg-purple-300': '#d8b4fe',
      'bg-purple-400': '#c084fc', 'bg-purple-500': '#a855f7', 'bg-purple-600': '#9333ea', 'bg-purple-700': '#7e22ce',
      'bg-purple-800': '#6b21a8', 'bg-purple-900': '#581c87',

      // Fuschias
      'bg-fuchsia-50': '#fdf4ff', 'bg-fuchsia-100': '#fae8ff', 'bg-fuchsia-200': '#f5d0fe', 'bg-fuchsia-300': '#f0abfc',
      'bg-fuchsia-400': '#e879f9', 'bg-fuchsia-500': '#d946ef', 'bg-fuchsia-600': '#c026d3', 'bg-fuchsia-700': '#a21caf',
      'bg-fuchsia-800': '#86198f', 'bg-fuchsia-900': '#701a75',

      // Pinks
      'bg-pink-50': '#fdf2f8', 'bg-pink-100': '#fce7f3', 'bg-pink-200': '#fbcfe8', 'bg-pink-300': '#f9a8d4',
      'bg-pink-400': '#f472b6', 'bg-pink-500': '#ec4899', 'bg-pink-600': '#db2777', 'bg-pink-700': '#be185d',
      'bg-pink-800': '#9d174d', 'bg-pink-900': '#831843',

      // Roses
      'bg-rose-50': '#fff1f2', 'bg-rose-100': '#ffe4e6', 'bg-rose-200': '#fecdd3', 'bg-rose-300': '#fda4af',
      'bg-rose-400': '#fb7185', 'bg-rose-500': '#f43f5e', 'bg-rose-600': '#e11d48', 'bg-rose-700': '#be123c',
      'bg-rose-800': '#9f1239', 'bg-rose-900': '#881337',

      // Basic colors
      'bg-black': '#000000',
      'bg-white': '#ffffff',
    };

    // Handle gradients with pattern matching
    const handleGradient = (bgClass: string) => {
      // Extract gradient direction
      let direction = 'to bottom right'; // default
      if (bgClass.includes('gradient-to-r')) direction = 'to right';
      else if (bgClass.includes('gradient-to-l')) direction = 'to left';
      else if (bgClass.includes('gradient-to-t')) direction = 'to top';
      else if (bgClass.includes('gradient-to-b')) direction = 'to bottom';
      else if (bgClass.includes('gradient-to-tr')) direction = 'to top right';
      else if (bgClass.includes('gradient-to-tl')) direction = 'to top left';
      else if (bgClass.includes('gradient-to-br')) direction = 'to bottom right';
      else if (bgClass.includes('gradient-to-bl')) direction = 'to bottom left';

      // Extract colors from the class
      const fromMatch = bgClass.match(/from-(\w+-\d+)/);
      const viaMatch = bgClass.match(/via-(\w+-\d+)/);
      const toMatch = bgClass.match(/to-(\w+-\d+)/);

      let colors = [];
      if (fromMatch) {
        const fromColor = tailwindColors[`bg-${fromMatch[1]}`];
        if (fromColor) colors.push(fromColor);
      }
      if (viaMatch) {
        const viaColor = tailwindColors[`bg-${viaMatch[1]}`];
        if (viaColor) colors.push(viaColor);
      }
      if (toMatch) {
        const toColor = tailwindColors[`bg-${toMatch[1]}`];
        if (toColor) colors.push(toColor);
      }

      if (colors.length >= 2) {
        const gradient = `linear-gradient(${direction}, ${colors.join(', ')})`;
        logger.debug('🌈 Found gradient:', gradient);
        return { background: gradient };
      }
      return null;
    };

    // Check for gradients first
    if (bgClass.includes('gradient-to-') || bgClass.includes('from-') || bgClass.includes('to-')) {
      const gradientStyle = handleGradient(bgClass);
      if (gradientStyle) return gradientStyle;
    }

    // Handle solid colors (but avoid matching opacity syntax)
    for (const [className, color] of Object.entries(tailwindColors)) {
      // Use exact match or word boundary to avoid matching bg-white in bg-white/60
      const exactMatch = bgClass === className || 
                         bgClass.startsWith(className + ' ') || 
                         bgClass.endsWith(' ' + className) || 
                         bgClass.includes(' ' + className + ' ');
      if (exactMatch) {
        logger.debug('✅ Found solid color match:', { className, color });
        return { backgroundColor: color };
      }
    }
    
    // Fallback - try to extract any color class
    const colorMatch = bgClass.match(/bg-(\w+-\d+)/);
    if (colorMatch) {
      const fallbackColor = tailwindColors[`bg-${colorMatch[1]}`];
      if (fallbackColor) {
        return { backgroundColor: fallbackColor };
      }
    }
    
    // Final fallback
    logger.debug('🔴 No match found for bgClass:', { bgClass, fallback: 'gray' });
    return { backgroundColor: '#f3f4f6' };
  };

  // Container classes
  const containerClasses = `
    group relative cursor-pointer transition-all duration-200 rounded-lg border-2 overflow-hidden
    ${isSelected 
      ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
      : 'border-gray-200 hover:border-gray-300'
    }
    ${isHovered ? 'shadow-lg transform scale-105' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${layout === 'horizontal' ? 'flex items-center' : ''}
  `;

  if (layout === 'horizontal') {
    return (
      <div
        className={containerClasses}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Preview Section */}
        <div className="w-24 h-16 flex-shrink-0">
          <div
            className="w-full h-full rounded"
            style={{ background: variation.css }}
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate text-sm">
                {variation.label}
              </h3>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {variation.category.charAt(0).toUpperCase() + variation.category.slice(1)}
              </p>

              {showDetails && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    {variation.baseColor}
                  </span>
                  {variation.css?.includes('gradient') && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-600">
                      Gradient
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Validation indicator */}
            {showValidation && validationResult && (
              <div className="flex-shrink-0 ml-2">
                <div className={`w-2 h-2 rounded-full ${
                  validationResult.score >= 80 ? 'bg-green-500' :
                  validationResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`} title={`Validation score: ${validationResult.score}%`} />
              </div>
            )}
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Preview */}
      <div className={`relative ${config.preview} w-full`}>
        <div
          className="w-full h-full rounded"
          style={{ background: variation.css }}
        />
        
        {/* Hover overlay */}
        {isHovered && !disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
            <div className="text-white text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
              Preview
            </div>
          </div>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Validation indicator */}
        {showValidation && validationResult && (
          <div className="absolute top-2 left-2">
            <div className={`w-3 h-3 rounded-full ${
              validationResult.score >= 80 ? 'bg-green-500' :
              validationResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`} title={`Validation score: ${validationResult.score}%`} />
          </div>
        )}
      </div>

      {/* Content */}
      {showDetails && (
        <div className={config.padding}>
          <h3 className={`font-medium text-gray-900 truncate ${config.text}`}>
            {variation.label}
          </h3>

          {size !== 'small' && (
            <>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {variation.category.charAt(0).toUpperCase() + variation.category.slice(1)}
              </p>

              <div className="flex items-center space-x-1 mt-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                  {variation.baseColor}
                </span>
                {variation.css?.includes('gradient') && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-600">
                    Gradient
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Minimal label for small size */}
      {!showDetails && size === 'small' && (
        <div className="px-2 py-1 text-center">
          <div className="text-xs font-medium text-gray-700 truncate">
            {variation.label.split(' ')[0]}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Style option with expanded details
 */
interface DetailedStyleOptionProps extends StyleOptionProps {
  showCompatibility?: boolean;
  showPreview?: boolean;
}

export function DetailedStyleOption({
  variation,
  isSelected = false,
  onClick,
  onHover,
  onHoverEnd,
  brandColors = null,
  showCompatibility = false,
  showPreview = false,
  disabled = false,
}: DetailedStyleOptionProps) {
  const [showDetails, setShowDetails] = useState(false);
  const validationResult = showCompatibility 
    ? validateBackgroundVariation(variation, brandColors)
    : null;

  return (
    <div className="space-y-2">
      <StyleOption
        variation={variation}
        isSelected={isSelected}
        onClick={onClick}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
        showDetails={true}
        size="large"
        brandColors={brandColors}
        showValidation={showCompatibility}
        disabled={disabled}
      />
      
      {/* Toggle details */}
      <div className="text-center">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showDetails ? 'Less details' : 'More details'}
        </button>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-3">
          {/* Technical details */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Technical Details</h4>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>Category: {variation.category.charAt(0).toUpperCase() + variation.category.slice(1)}</div>
              <div>Base Color: {variation.baseColor}</div>
              <div className="font-mono text-xs bg-gray-100 p-1 rounded overflow-x-auto">
                {variation.css}
              </div>
            </div>
          </div>

          {/* Compatibility info */}
          {showCompatibility && validationResult && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Compatibility</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Overall Score</span>
                  <span className={`font-medium ${
                    validationResult.score >= 80 ? 'text-green-600' :
                    validationResult.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {validationResult.score}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Accessibility</span>
                  <span className="text-gray-800">{validationResult.accessibility.wcagLevel}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Performance</span>
                  <span className="text-gray-800">{validationResult.performance.complexity}</span>
                </div>
              </div>
            </div>
          )}

          {/* Preview sections */}
          {showPreview && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Section Preview</h4>
              <div className="grid grid-cols-3 gap-1">
                <div className="text-center">
                  <div className="h-6 rounded mb-1" style={{ background: variation.css }} />
                  <div className="text-xs text-gray-500">Hero</div>
                </div>
                <div className="text-center">
                  <div className="h-6 rounded mb-1" style={{ background: previewData.secondaryCSS }} />
                  <div className="text-xs text-gray-500">Features</div>
                </div>
                <div className="text-center">
                  <div className="h-6 rounded mb-1 border border-gray-200" style={{ backgroundColor: '#ffffff' }} />
                  <div className="text-xs text-gray-500">Content</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getBackgroundStyle(bgClass: string) {
  if (!bgClass) return { backgroundColor: '#f3f4f6' };
  
  // Basic Tailwind colors for the preview function
  const basicColors: Record<string, string> = {
    'bg-blue-50': '#eff6ff', 'bg-blue-100': '#dbeafe', 'bg-blue-500': '#3b82f6', 'bg-blue-600': '#2563eb',
    'bg-purple-50': '#faf5ff', 'bg-purple-500': '#a855f7', 'bg-purple-600': '#9333ea',
    'bg-green-50': '#f0fdf4', 'bg-green-500': '#22c55e',
    'bg-orange-50': '#fff7ed', 'bg-orange-500': '#f97316',
    'bg-teal-50': '#f0fdfa', 'bg-teal-500': '#14b8a6',
    'bg-amber-50': '#fffbeb', 'bg-amber-500': '#f59e0b',
    'bg-red-50': '#fef2f2', 'bg-red-500': '#ef4444',
    'bg-pink-50': '#fdf2f8', 'bg-pink-500': '#ec4899',
    'bg-indigo-50': '#eef2ff', 'bg-indigo-500': '#6366f1',
    'bg-cyan-50': '#ecfeff', 'bg-cyan-500': '#06b6d4',
    'bg-yellow-50': '#fefce8', 'bg-yellow-500': '#eab308',
    'bg-gray-50': '#f9fafb', 'bg-gray-100': '#f3f4f6', 'bg-gray-500': '#6b7280',
    'bg-white': '#ffffff', 'bg-black': '#000000',
  };

  // Handle basic gradients
  if (bgClass.includes('gradient-to-br')) {
    if (bgClass.includes('blue-500') && bgClass.includes('purple-600')) {
      return { background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)' };
    }
    if (bgClass.includes('from-blue') && bgClass.includes('to-purple')) {
      return { background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)' };
    }
  }

  // Handle solid colors
  for (const [className, color] of Object.entries(basicColors)) {
    if (bgClass.includes(className)) {
      return { backgroundColor: color };
    }
  }
  
  // Try to extract any bg-color-number pattern
  const colorMatch = bgClass.match(/bg-(\w+)-(\d+)/);
  if (colorMatch) {
    const [, colorName, intensity] = colorMatch;
    // Provide reasonable defaults for common colors
    const colorDefaults: Record<string, string> = {
      blue: '#3b82f6', purple: '#a855f7', green: '#22c55e', orange: '#f97316',
      red: '#ef4444', pink: '#ec4899', indigo: '#6366f1', cyan: '#06b6d4',
      yellow: '#eab308', teal: '#14b8a6', amber: '#f59e0b', gray: '#6b7280'
    };
    
    if (colorDefaults[colorName]) {
      return { backgroundColor: colorDefaults[colorName] };
    }
  }
  
  return { backgroundColor: '#f3f4f6' };
}