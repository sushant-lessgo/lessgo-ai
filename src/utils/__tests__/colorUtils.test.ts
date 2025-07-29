// colorUtils.test.ts - Tests for color utility functions
// Ensures color calculations are accurate and WCAG compliant

import {
  parseColor,
  calculateLuminance,
  calculateContrastRatio,
  meetsContrastRequirement,
  ContrastLevel,
  analyzeColor,
  getOptimalTextColor,
  validateColorAccessibility,
  getSafeColorFallback
} from '../colorUtils';

describe('Color Parsing', () => {
  test('should parse hex colors correctly', () => {
    expect(parseColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  test('should parse RGB colors correctly', () => {
    expect(parseColor('rgb(255, 255, 255)')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('rgb(0, 0, 0)')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({ r: 255, g: 0, b: 0 });
  });

  test('should parse named colors correctly', () => {
    expect(parseColor('white')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('black')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor('red')).toEqual({ r: 255, g: 0, b: 0 });
  });

  test('should return null for invalid colors', () => {
    expect(parseColor('invalid')).toBeNull();
    expect(parseColor('#gggggg')).toBeNull();
    expect(parseColor('')).toBeNull();
  });
});

describe('Luminance Calculation', () => {
  test('should calculate correct luminance for known colors', () => {
    // White should have luminance of 1
    expect(calculateLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2);
    
    // Black should have luminance of 0
    expect(calculateLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 2);
    
    // Gray should be around 0.21 (approximate)
    expect(calculateLuminance({ r: 128, g: 128, b: 128 })).toBeGreaterThan(0.15);
    expect(calculateLuminance({ r: 128, g: 128, b: 128 })).toBeLessThan(0.25);
  });

  test('should handle edge cases', () => {
    // Red channel only
    const redLuminance = calculateLuminance({ r: 255, g: 0, b: 0 });
    expect(redLuminance).toBeGreaterThan(0);
    expect(redLuminance).toBeLessThan(1);
    
    // Green channel only (should be highest due to eye sensitivity)
    const greenLuminance = calculateLuminance({ r: 0, g: 255, b: 0 });
    expect(greenLuminance).toBeGreaterThan(redLuminance);
    
    // Blue channel only (should be lowest)
    const blueLuminance = calculateLuminance({ r: 0, g: 0, b: 255 });
    expect(blueLuminance).toBeLessThan(redLuminance);
  });
});

describe('Contrast Ratio Calculation', () => {
  test('should calculate correct contrast ratios', () => {
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    
    // White on black should have maximum contrast (21:1)
    expect(calculateContrastRatio(white, black)).toBeCloseTo(21, 0);
    
    // Same colors should have minimum contrast (1:1)
    expect(calculateContrastRatio(white, white)).toBeCloseTo(1, 1);
    expect(calculateContrastRatio(black, black)).toBeCloseTo(1, 1);
  });

  test('should be symmetric', () => {
    const color1 = { r: 100, g: 150, b: 200 };
    const color2 = { r: 200, g: 100, b: 50 };
    
    expect(calculateContrastRatio(color1, color2))
      .toBeCloseTo(calculateContrastRatio(color2, color1), 5);
  });
});

describe('WCAG Compliance', () => {
  test('should correctly identify WCAG AA compliance', () => {
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    const gray = { r: 128, g: 128, b: 128 };
    
    // Black on white should pass AA
    expect(meetsContrastRequirement(black, white, ContrastLevel.AA_NORMAL)).toBe(true);
    
    // Gray on white might not pass AA
    expect(meetsContrastRequirement(gray, white, ContrastLevel.AA_NORMAL)).toBe(false);
  });

  test('should validate accessibility correctly', () => {
    const validation = validateColorAccessibility('#000000', '#ffffff');
    
    expect(validation.isValid).toBe(true);
    expect(validation.level).toBe('AAA');
    expect(validation.contrastRatio).toBeCloseTo(21, 0);
    expect(validation.warnings).toHaveLength(0);
  });

  test('should provide warnings for poor contrast', () => {
    const validation = validateColorAccessibility('#888888', '#ffffff');
    
    expect(validation.isValid).toBe(false);
    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(validation.suggestions.length).toBeGreaterThan(0);
  });
});

describe('Color Analysis', () => {
  test('should analyze colors correctly', () => {
    const whiteAnalysis = analyzeColor('#ffffff');
    expect(whiteAnalysis?.isLight).toBe(true);
    expect(whiteAnalysis?.isDark).toBe(false);
    expect(whiteAnalysis?.luminance).toBeCloseTo(1, 1);
    
    const blackAnalysis = analyzeColor('#000000');
    expect(blackAnalysis?.isLight).toBe(false);
    expect(blackAnalysis?.isDark).toBe(true);
    expect(blackAnalysis?.luminance).toBeCloseTo(0, 1);
  });

  test('should handle invalid colors gracefully', () => {
    expect(analyzeColor('invalid')).toBeNull();
    expect(analyzeColor('')).toBeNull();
  });
});

describe('Optimal Text Color Selection', () => {
  test('should choose dark text for light backgrounds', () => {
    const textColor = getOptimalTextColor('#ffffff');
    const textRgb = parseColor(textColor);
    expect(textRgb).toBeTruthy();
    
    if (textRgb) {
      const luminance = calculateLuminance(textRgb);
      expect(luminance).toBeLessThan(0.5); // Should be dark
    }
  });

  test('should choose light text for dark backgrounds', () => {
    const textColor = getOptimalTextColor('#000000');
    const textRgb = parseColor(textColor);
    expect(textRgb).toBeTruthy();
    
    if (textRgb) {
      const luminance = calculateLuminance(textRgb);
      expect(luminance).toBeGreaterThan(0.5); // Should be light
    }
  });

  test('should respect WCAG requirements', () => {
    const backgroundColor = '#3b82f6'; // Blue-500
    const textColor = getOptimalTextColor(backgroundColor, {
      requireLevel: ContrastLevel.AA_NORMAL
    });
    
    const validation = validateColorAccessibility(textColor, backgroundColor);
    expect(validation.contrastRatio).toBeGreaterThanOrEqual(ContrastLevel.AA_NORMAL);
  });
});

describe('Safe Color Fallbacks', () => {
  test('should provide appropriate fallbacks for different luminance levels', () => {
    const lightFallback = getSafeColorFallback(0.8);
    expect(lightFallback.background).toBe('#ffffff');
    expect(parseColor(lightFallback.heading)?.r).toBeLessThan(128); // Dark text
    
    const darkFallback = getSafeColorFallback(0.2);
    expect(parseColor(darkFallback.heading)?.r).toBeGreaterThan(128); // Light text
  });

  test('should handle undefined luminance', () => {
    const fallback = getSafeColorFallback(undefined);
    expect(fallback).toBeDefined();
    expect(fallback.heading).toBeDefined();
    expect(fallback.body).toBeDefined();
    expect(fallback.muted).toBeDefined();
  });
});

describe('Performance and Edge Cases', () => {
  test('should handle extreme color values', () => {
    expect(() => calculateLuminance({ r: 0, g: 0, b: 0 })).not.toThrow();
    expect(() => calculateLuminance({ r: 255, g: 255, b: 255 })).not.toThrow();
    expect(() => calculateLuminance({ r: 999, g: -1, b: 300 })).not.toThrow();
  });

  test('should be performant for batch operations', () => {
    const colors = Array.from({ length: 1000 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`);
    
    const start = performance.now();
    colors.forEach(color => {
      const analysis = analyzeColor(color);
      if (analysis) {
        calculateContrastRatio(analysis.rgb, { r: 255, g: 255, b: 255 });
      }
    });
    const end = performance.now();
    
    // Should complete 1000 operations in under 100ms
    expect(end - start).toBeLessThan(100);
  });
});