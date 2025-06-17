// colorTokens.ts
// Token map generator for Lessgo.ai dynamic landing pages

export type SectionBackgroundInput = {
  primary?: string;    // e.g., "bg-gradient-to-br from-purple-600 to-indigo-500"
  secondary?: string;  // e.g., "bg-gray-50"
  neutral?: string;    // e.g., "bg-white"
  divider?: string;    // e.g., "bg-[url('/waves.svg')]"
}

export function generateColorTokens({
  baseColor = "gray",
  accentColor = "accent",
  sectionBackgrounds = {}
}: {
  baseColor?: string; // Tailwind base color prefix like "gray", "slate"
  accentColor: string; // e.g., "purple", "blue", or a custom Tailwind class prefix
  sectionBackgrounds?: SectionBackgroundInput;
}) {
  return {
    // 🎨 Dynamic Accent & CTA
    accent: `bg-${accentColor}-600`,
    accentHover: `bg-${accentColor}-700`,
    accentBorder: `border-${accentColor}-600`,

    ctaBg: `bg-${accentColor}-600`,
    ctaHover: `bg-${accentColor}-700`,
    ctaText: "text-white",

    // 🖋️ Dynamic Text Colors
    textOnLight: `text-${baseColor}-900`,
    textOnDark: "text-white",
    textOnAccent: "text-white",
    link: `text-${accentColor}-600`,

    // 🧱 Dynamic Section Backgrounds
    bgPrimary: sectionBackgrounds.primary || `bg-gradient-to-br from-${accentColor}-600 to-${accentColor}-500`,
    bgSecondary: sectionBackgrounds.secondary || `bg-${baseColor}-50`,
    bgNeutral: sectionBackgrounds.neutral || "bg-white",
    bgDivider: sectionBackgrounds.divider || "bg-[url('/pattern/line.svg')]",

    // 📘 Static Text Tokens
    textPrimary: `text-${baseColor}-900`,
    textSecondary: `text-${baseColor}-600`,
    textMuted: `text-${baseColor}-500`,
    textInverse: "text-white",

    // 📦 Static Surface Tokens
    surfaceCard: "bg-white",
    surfaceElevated: `bg-${baseColor}-50`,
    surfaceSection: `bg-${baseColor}-100`,
    surfaceOverlay: "bg-black/20",

    // 🔲 Static Borders
    borderDefault: `border-${baseColor}-200`,
    borderSubtle: `border-${baseColor}-100`,
    borderFocus: `border-${accentColor}-500`,

    // ✅ Static Semantic Colors
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
    info: "bg-blue-500"
  };
}
