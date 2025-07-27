// types/sectionBackground.ts - Enhanced section background types with custom support

/**
 * Enhanced background type including theme and custom options
 */
export type BackgroundType = 'theme' | 'custom';

/**
 * Theme color options for background
 */
export type ThemeColorType = 'primary' | 'secondary' | 'neutral' | 'divider';

/**
 * Custom background style types
 */
export type CustomBackgroundStyle = 'solid' | 'gradient';

/**
 * Gradient types supported
 */
export type GradientType = 'linear' | 'radial';

/**
 * Gradient stop definition
 */
export interface GradientStop {
  color: string;
  position: number; // 0-100
}

/**
 * Solid color background configuration
 */
export interface SolidBackground {
  color: string; // hex, rgb, hsl, or CSS color name
}

/**
 * Linear gradient configuration
 */
export interface LinearGradient {
  type: 'linear';
  angle: number; // degrees (0-360)
  stops: GradientStop[];
}

/**
 * Radial gradient configuration
 */
export interface RadialGradient {
  type: 'radial';
  stops: GradientStop[];
  centerX?: number; // 0-100, default 50
  centerY?: number; // 0-100, default 50
  shape?: 'circle' | 'ellipse'; // default ellipse
}

/**
 * Union type for gradient configurations
 */
export type GradientConfig = LinearGradient | RadialGradient;

/**
 * Custom background configuration
 */
export interface CustomBackground {
  solid?: string;
  gradient?: GradientConfig;
}

/**
 * Complete section background configuration
 */
export interface SectionBackground {
  type: BackgroundType;
  themeColor?: ThemeColorType; // Used when type is 'theme'
  custom?: CustomBackground; // Used when type is 'custom'
  // Optional metadata
  name?: string; // User-defined name for custom backgrounds
  createdAt?: number; // timestamp
  lastModified?: number; // timestamp
}

/**
 * Background validation result
 */
export interface BackgroundValidation {
  isValid: boolean;
  contrastRatio?: number;
  wcagLevel?: 'AA' | 'AAA' | 'fail';
  warnings: string[];
  errors: string[];
}

/**
 * Background CSS generation result
 */
export interface BackgroundCSS {
  className: string;
  inlineStyles?: React.CSSProperties;
  cssText?: string; // Raw CSS for complex gradients
}

/**
 * Brand color suggestion for background creation
 */
export interface BrandColorSuggestion {
  color: string;
  name: string;
  category: 'primary' | 'secondary' | 'accent' | 'neutral';
  recommended: boolean;
}

/**
 * Preset gradient collections
 */
export interface GradientPreset {
  id: string;
  name: string;
  category: 'professional' | 'creative' | 'trending' | 'seasonal';
  gradient: GradientConfig;
  thumbnail: string; // CSS background value for preview
}

/**
 * Background picker mode
 */
export type BackgroundPickerMode = 'solid' | 'gradient';

/**
 * Background picker state
 */
export interface BackgroundPickerState {
  mode: BackgroundPickerMode;
  selectedType: BackgroundType;
  customBackground: CustomBackground | null;
  previewBackground: SectionBackground | null;
  isValidating: boolean;
  validation: BackgroundValidation | null;
  showValidationDetails?: boolean;
}