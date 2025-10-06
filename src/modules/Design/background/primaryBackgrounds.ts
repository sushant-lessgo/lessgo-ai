// primaryBackgrounds.ts - Curated masterlist of ~65 primary backgrounds
// Simplified from 412 variations with CSS values instead of Tailwind classes

export type BackgroundCategory = 'technical' | 'professional' | 'friendly';

export interface PrimaryBackground {
  id: string;                    // Unique identifier
  label: string;                 // Human-readable name
  css: string;                   // Raw CSS value (gradients, colors)
  baseColor: string;             // For accent derivation (blue, slate, etc.)
  category: BackgroundCategory;  // Category for filtering
}

/**
 * Curated list of ~65 primary backgrounds
 * Organized by category: technical (~20), professional (~25), friendly (~25)
 */
export const primaryBackgrounds: PrimaryBackground[] = [

  // ===== TECHNICAL/DARK BACKGROUNDS (~20) =====
  // For developers, CTOs, DevTools, AI Tools, Technical audiences

  // blurred-spotlight::midnight-dark (6)
  {
    id: "midnight-dark-radial-spotlight-center",
    label: "Center Spotlight Radial Glow",
    css: "radial-gradient(ellipse at center, #1f2937, #000000, #000000)",
    baseColor: "gray",
    category: "technical"
  },
  {
    id: "midnight-dark-radial-spotlight-offset-right",
    label: "Offset Right Spotlight",
    css: "radial-gradient(ellipse at right, #1e293b, #000000, #000000)",
    baseColor: "slate",
    category: "technical"
  },
  {
    id: "midnight-dark-diagonal-light-blur",
    label: "Diagonal Light Blur",
    css: "linear-gradient(to bottom right, #111827, #000000, #000000)",
    baseColor: "gray",
    category: "technical"
  },
  {
    id: "midnight-dark-bottom-spotlight-glow",
    label: "Bottom Spotlight Glow",
    css: "linear-gradient(to top, rgba(30, 41, 59, 0.3), transparent, transparent)",
    baseColor: "slate",
    category: "technical"
  },
  {
    id: "midnight-dark-soft-glow-fade-center",
    label: "Soft Center Glow Fade",
    css: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 60%), #000000",
    baseColor: "gray",
    category: "technical"
  },
  {
    id: "midnight-dark-multi-spot-halo-fx",
    label: "Multiple Spot Halo FX",
    css: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.04) 0%, transparent 40%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.03) 0%, transparent 40%), #000000",
    baseColor: "gray",
    category: "technical"
  },

  // blurred-spotlight::modern-blue (4)
  {
    id: "modern-blue-radial-center-spotlight",
    label: "Blue Center Spotlight",
    css: "radial-gradient(ellipse at center, #1e40af, #1e3a8a, #0f172a)",
    baseColor: "blue",
    category: "technical"
  },
  {
    id: "modern-blue-radial-offset-left-glow",
    label: "Blue Left Offset Glow",
    css: "radial-gradient(ellipse at left, #1d4ed8, #1e40af, #0f172a)",
    baseColor: "blue",
    category: "technical"
  },
  {
    id: "modern-blue-dual-spot-blue-light",
    label: "Dual Spot Blue Light",
    css: "radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(96, 165, 250, 0.1) 0%, transparent 50%), #0f172a",
    baseColor: "blue",
    category: "technical"
  },
  {
    id: "modern-blue-halo-glow-center",
    label: "Blue Halo Glow Center",
    css: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%), #000000",
    baseColor: "blue",
    category: "technical"
  },

  // code-matrix-mesh::graphite-code (3)
  {
    id: "matrix-graphitecode-subtle-mesh",
    label: "Subtle Mesh Pattern",
    css: "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 20px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 20px), #1f2937",
    baseColor: "gray",
    category: "technical"
  },
  {
    id: "matrix-graphitecode-subtle-circuit",
    label: "Subtle Circuit Lines",
    css: "repeating-linear-gradient(45deg, transparent 0 10px, rgba(255,255,255,0.02) 10px 11px), #1f2937",
    baseColor: "gray",
    category: "technical"
  },
  {
    id: "matrix-graphitecode-grid-overlay",
    label: "Grid Overlay Pattern",
    css: "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 10px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 10px), #1f2937",
    baseColor: "gray",
    category: "technical"
  },

  // code-matrix-mesh::midnight-dark (2)
  {
    id: "matrix-midnightdark-subtle-mesh",
    label: "Midnight Mesh",
    css: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 25px), repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 25px), #0f172a",
    baseColor: "slate",
    category: "technical"
  },
  {
    id: "matrix-midnightdark-angled-scanlines",
    label: "Angled Scanlines",
    css: "repeating-linear-gradient(135deg, transparent 0 15px, rgba(255,255,255,0.015) 15px 16px), #0f172a",
    baseColor: "slate",
    category: "technical"
  },

  // monochrome-hero-zone::graphite-code (2)
  {
    id: "mono-graphitecode-center-halo",
    label: "Graphite Center Halo",
    css: "radial-gradient(circle at center, #374151, #1f2937, #111827)",
    baseColor: "gray",
    category: "technical"
  },
  {
    id: "mono-graphitecode-soft-radial",
    label: "Soft Graphite Radial",
    css: "radial-gradient(ellipse at center, #4b5563, #374151, #1f2937)",
    baseColor: "gray",
    category: "technical"
  },

  // ===== PROFESSIONAL/LIGHT BACKGROUNDS (~25) =====
  // For enterprise, finance, compliance, HR, B2B, corporate

  // frosted-glass-light::steel-gray (3)
  {
    id: "frosted-steelgray-gradient-tr",
    label: "Steel Frost Top-Right",
    css: "linear-gradient(to top right, #e5e7eb, #d1d5db, #f3f4f6)",
    baseColor: "gray",
    category: "professional"
  },
  {
    id: "frosted-steelgray-gradient-bl",
    label: "Steel Frost Bottom-Left",
    css: "linear-gradient(to bottom left, #f3f4f6, #e5e7eb, #f9fafb)",
    baseColor: "gray",
    category: "professional"
  },
  {
    id: "frosted-steelgray-soft-halo",
    label: "Steel Soft Halo",
    css: "radial-gradient(ellipse at center, #f9fafb, #f3f4f6, #e5e7eb)",
    baseColor: "gray",
    category: "professional"
  },

  // frosted-glass-light::trust-blue-white (3)
  {
    id: "frosted-trustblue-gradient-tr",
    label: "Trust Blue Top-Right",
    css: "linear-gradient(to top right, #dbeafe, #eff6ff, #ffffff)",
    baseColor: "blue",
    category: "professional"
  },
  {
    id: "frosted-trustblue-gradient-bl",
    label: "Trust Blue Bottom-Left",
    css: "linear-gradient(to bottom left, #eff6ff, #dbeafe, #f0f9ff)",
    baseColor: "blue",
    category: "professional"
  },
  {
    id: "frosted-trustblue-soft-halo",
    label: "Trust Blue Halo",
    css: "radial-gradient(ellipse at center, #ffffff, #eff6ff, #dbeafe)",
    baseColor: "blue",
    category: "professional"
  },

  // frosted-glass-light::default-light (1)
  {
    id: "frosted-defaultlight-subtle-glow",
    label: "Subtle Light Glow",
    css: "radial-gradient(ellipse at center, #ffffff, #fafafa, #f5f5f5)",
    baseColor: "gray",
    category: "professional"
  },

  // monochrome-hero-zone::steel-gray (6)
  {
    id: "steel-gray-center-halo-soft",
    label: "Steel Gray Soft Halo",
    css: "radial-gradient(ellipse at center, #f9fafb, #f1f5f9, #e2e8f0)",
    baseColor: "slate",
    category: "professional"
  },
  {
    id: "steel-gray-center-halo-muted",
    label: "Steel Gray Muted Halo",
    css: "radial-gradient(circle at center, #f5f5f5, #e5e5e5, #d4d4d4)",
    baseColor: "gray",
    category: "professional"
  },
  {
    id: "steel-gray-center-halo-strong",
    label: "Steel Gray Strong Halo",
    css: "radial-gradient(circle at center, #ffffff, #f1f5f9, #cbd5e1)",
    baseColor: "slate",
    category: "professional"
  },
  {
    id: "steel-gray-subtle-diagonal",
    label: "Steel Gray Diagonal",
    css: "linear-gradient(135deg, #f8fafc, #f1f5f9, #e2e8f0)",
    baseColor: "slate",
    category: "professional"
  },
  {
    id: "steel-gray-subtle-radial-glow",
    label: "Steel Gray Radial Glow",
    css: "radial-gradient(circle at top, #f8fafc, #f1f5f9)",
    baseColor: "slate",
    category: "professional"
  },
  {
    id: "steel-gray-top-halo-faint",
    label: "Steel Gray Faint Top Halo",
    css: "radial-gradient(ellipse at top, #ffffff, #f8fafc, #f1f5f9)",
    baseColor: "slate",
    category: "professional"
  },

  // monochrome-hero-zone::default-light (2)
  {
    id: "mono-defaultlight-subtle-gradient",
    label: "Subtle Light Gradient",
    css: "linear-gradient(to bottom, #ffffff, #fafafa, #f5f5f5)",
    baseColor: "gray",
    category: "professional"
  },
  {
    id: "mono-defaultlight-subtle-halo",
    label: "Subtle Light Halo",
    css: "radial-gradient(circle at center, #ffffff, #f9fafb)",
    baseColor: "gray",
    category: "professional"
  },

  // wireframe-blueprint::trust-blue-white (6)
  {
    id: "trust-blue-white-subtle-center-radial",
    label: "Trust Blue Center Radial",
    css: "radial-gradient(circle at center, #eff6ff, #dbeafe, #ffffff)",
    baseColor: "blue",
    category: "professional"
  },
  {
    id: "trust-blue-white-subtle-center-wash",
    label: "Trust Blue Center Wash",
    css: "radial-gradient(ellipse at center, #dbeafe, #eff6ff, #ffffff)",
    baseColor: "blue",
    category: "professional"
  },
  {
    id: "trust-blue-white-subtle-diagonal-wash",
    label: "Trust Blue Diagonal Wash",
    css: "linear-gradient(135deg, #eff6ff, #dbeafe, #ffffff)",
    baseColor: "blue",
    category: "professional"
  },
  {
    id: "trust-blue-white-subtle-halo",
    label: "Trust Blue Halo",
    css: "radial-gradient(circle, #ffffff, #eff6ff, #dbeafe)",
    baseColor: "blue",
    category: "professional"
  },
  {
    id: "trust-blue-white-subtle-radial-bottom",
    label: "Trust Blue Bottom Radial",
    css: "radial-gradient(ellipse at bottom, #dbeafe, #eff6ff, #ffffff)",
    baseColor: "blue",
    category: "professional"
  },
  {
    id: "trust-blue-white-subtle-radial-top",
    label: "Trust Blue Top Radial",
    css: "radial-gradient(ellipse at top, #dbeafe, #eff6ff, #ffffff)",
    baseColor: "blue",
    category: "professional"
  },

  // wireframe-blueprint::default-light (1)
  {
    id: "wireframe-defaultlight-soft-grid",
    label: "Soft Grid Light",
    css: "repeating-linear-gradient(0deg, rgba(0,0,0,0.02) 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0 1px, transparent 1px 30px), #ffffff",
    baseColor: "gray",
    category: "professional"
  },

  // wireframe-blueprint::graphite-code (1)
  {
    id: "wireframe-graphitecode-soft-grid",
    label: "Graphite Soft Grid",
    css: "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 40px), #f9fafb",
    baseColor: "gray",
    category: "professional"
  },

  // ===== FRIENDLY/MODERN BACKGROUNDS (~25) =====
  // For SMBs, founders, creators, no-code, startups (default for most)

  // soft-gradient-blur::modern-blue (5)
  {
    id: "soft-blur-modern-blue-gradient-tr",
    label: "Modern Blue Top-Right",
    css: "linear-gradient(to top right, #3b82f6, #60a5fa, #7dd3fc)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "soft-blur-modern-blue-gradient-tl",
    label: "Modern Blue Top-Left",
    css: "linear-gradient(to top left, #38bdf8, #3b82f6, #818cf8)",
    baseColor: "sky",
    category: "friendly"
  },
  {
    id: "soft-blur-modern-blue-radial-center",
    label: "Modern Blue Center Glow",
    css: "radial-gradient(ellipse at center, #60a5fa, #93c5fd, transparent)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "soft-blur-modern-blue-radial-top",
    label: "Modern Blue Top Glow",
    css: "radial-gradient(ellipse at top, #7dd3fc, #93c5fd, transparent)",
    baseColor: "sky",
    category: "friendly"
  },
  {
    id: "soft-blur-modern-blue-radial-trail",
    label: "Modern Blue Trail",
    css: "radial-gradient(ellipse at bottom right, #60a5fa, #93c5fd, #dbeafe)",
    baseColor: "blue",
    category: "friendly"
  },

  // soft-gradient-blur::mint-frost (1)
  {
    id: "soft-blur-mint-frost-radial-center",
    label: "Mint Frost Center",
    css: "radial-gradient(ellipse at center, #5eead4, #99f6e4, transparent)",
    baseColor: "teal",
    category: "friendly"
  },

  // soft-gradient-blur::teal-energy (3)
  {
    id: "soft-blur-teal-energy-gradient-tr",
    label: "Teal Energy Top-Right",
    css: "linear-gradient(to top right, #14b8a6, #2dd4bf, #5eead4)",
    baseColor: "teal",
    category: "friendly"
  },
  {
    id: "soft-blur-teal-energy-gradient-tl",
    label: "Teal Energy Top-Left",
    css: "linear-gradient(to top left, #2dd4bf, #14b8a6, #0d9488)",
    baseColor: "teal",
    category: "friendly"
  },
  {
    id: "soft-blur-teal-energy-radial-center",
    label: "Teal Energy Center",
    css: "radial-gradient(circle at center, #5eead4, #99f6e4, transparent)",
    baseColor: "teal",
    category: "friendly"
  },

  // soft-gradient-blur::trust-blue-white (4)
  {
    id: "soft-blur-trust-blue-white-radial-center-blur",
    label: "Trust Blue Center Blur",
    css: "radial-gradient(ellipse at center, #93c5fd, #bfdbfe, transparent)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "soft-blur-trust-blue-white-radial-top-blur",
    label: "Trust Blue Top Blur",
    css: "radial-gradient(ellipse at top, #93c5fd, #bfdbfe, transparent)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "soft-blur-trust-blue-white-radial-bottom-blur",
    label: "Trust Blue Bottom Blur",
    css: "radial-gradient(ellipse at bottom, #93c5fd, #bfdbfe, transparent)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "soft-blur-trust-blue-white-subtle-diagonal",
    label: "Trust Blue Diagonal",
    css: "linear-gradient(to bottom right, #93c5fd, #bfdbfe, #ffffff)",
    baseColor: "blue",
    category: "friendly"
  },

  // glass-morph-with-pop::mint-frost (3)
  {
    id: "mint-frost-gradient-tr-green-mint",
    label: "Mint Green Top-Right",
    css: "linear-gradient(to top right, #6ee7b7, #a7f3d0, #d1fae5)",
    baseColor: "emerald",
    category: "friendly"
  },
  {
    id: "mint-frost-gradient-tl-green-mint",
    label: "Mint Green Top-Left",
    css: "linear-gradient(to top left, #34d399, #6ee7b7, #a7f3d0)",
    baseColor: "emerald",
    category: "friendly"
  },
  {
    id: "mint-frost-soft-halo",
    label: "Mint Soft Halo",
    css: "radial-gradient(circle at center, #d1fae5, #a7f3d0, #ecfdf5)",
    baseColor: "emerald",
    category: "friendly"
  },

  // glass-morph-with-pop::modern-blue (2)
  {
    id: "modern-blue-gradient-bl-blue-glass",
    label: "Modern Blue Glass",
    css: "linear-gradient(to bottom left, #60a5fa, #93c5fd, #dbeafe)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "modern-blue-soft-halo",
    label: "Modern Blue Halo",
    css: "radial-gradient(circle at center, #dbeafe, #bfdbfe, #eff6ff)",
    baseColor: "blue",
    category: "friendly"
  },

  // frosted-glass-light::modern-blue (1)
  {
    id: "frosted-modernblue-soft-halo",
    label: "Frosted Blue Halo",
    css: "radial-gradient(ellipse at center, #eff6ff, #dbeafe, #bfdbfe)",
    baseColor: "blue",
    category: "friendly"
  },

  // startup-skybox::modern-blue (5)
  {
    id: "skybox-modern-blue-radial-center",
    label: "Skybox Blue Center",
    css: "radial-gradient(circle at center, #b4d8ff, #dceeff, #ffffff)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "skybox-modern-blue-radial-top",
    label: "Skybox Blue Top",
    css: "radial-gradient(circle at top, #dceeff, #eff6ff, #ffffff)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "skybox-modern-blue-halo-bottom",
    label: "Skybox Blue Bottom Halo",
    css: "radial-gradient(ellipse at bottom, #bfdbfe, #dbeafe, #ffffff)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "skybox-modern-blue-diagonal-wash",
    label: "Skybox Blue Diagonal",
    css: "linear-gradient(135deg, #eff6ff, #dbeafe, #ffffff)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "skybox-modern-blue-soft-halo",
    label: "Skybox Blue Soft Halo",
    css: "radial-gradient(circle, #ffffff, #eff6ff, #dbeafe)",
    baseColor: "blue",
    category: "friendly"
  },

  // startup-skybox::mint-frost (4)
  {
    id: "skybox-mintfrost-radial-center",
    label: "Skybox Mint Center",
    css: "radial-gradient(circle at center, #ccfbf1, #f0fdfa, #ffffff)",
    baseColor: "teal",
    category: "friendly"
  },
  {
    id: "skybox-mintfrost-radial-top",
    label: "Skybox Mint Top",
    css: "radial-gradient(circle at top, #d1fae5, #ecfdf5, #ffffff)",
    baseColor: "emerald",
    category: "friendly"
  },
  {
    id: "skybox-mintfrost-radial-bottom",
    label: "Skybox Mint Bottom",
    css: "radial-gradient(ellipse at bottom, #99f6e4, #ccfbf1, #ffffff)",
    baseColor: "teal",
    category: "friendly"
  },
  {
    id: "skybox-mintfrost-halo-center",
    label: "Skybox Mint Halo",
    css: "radial-gradient(circle, #ffffff, #f0fdfa, #ccfbf1)",
    baseColor: "teal",
    category: "friendly"
  },

  // startup-skybox::trust-blue-white (4)
  {
    id: "skybox-trust-bluewhite-radial-center",
    label: "Skybox Trust Blue Center",
    css: "radial-gradient(circle at center, #dbeafe, #eff6ff, #ffffff)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "skybox-trust-bluewhite-radial-top",
    label: "Skybox Trust Blue Top",
    css: "radial-gradient(circle at top, #eff6ff, #ffffff, #ffffff)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "skybox-trust-bluewhite-halo-bottom-fade",
    label: "Skybox Trust Blue Bottom Fade",
    css: "radial-gradient(ellipse at bottom, #dbeafe, #eff6ff, transparent)",
    baseColor: "blue",
    category: "friendly"
  },
  {
    id: "skybox-trust-bluewhite-diagonal-wash",
    label: "Skybox Trust Blue Diagonal",
    css: "linear-gradient(to bottom right, #eff6ff, #dbeafe, #ffffff)",
    baseColor: "blue",
    category: "friendly"
  },
];

// Helper function to get backgrounds by category
export function getBackgroundsByCategory(category: BackgroundCategory): PrimaryBackground[] {
  return primaryBackgrounds.filter(bg => bg.category === category);
}

// Helper function to get background by ID
export function getBackgroundById(id: string): PrimaryBackground | undefined {
  return primaryBackgrounds.find(bg => bg.id === id);
}

// Statistics
export const backgroundStats = {
  total: primaryBackgrounds.length,
  technical: primaryBackgrounds.filter(bg => bg.category === 'technical').length,
  professional: primaryBackgrounds.filter(bg => bg.category === 'professional').length,
  friendly: primaryBackgrounds.filter(bg => bg.category === 'friendly').length,
};

// Log stats for debugging
console.log('📊 Primary Backgrounds loaded:', backgroundStats);
