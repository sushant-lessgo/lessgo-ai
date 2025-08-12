// Background Pattern Analyzer for CSS Variable Migration
// Parses legacy Tailwind background classes and extracts structural patterns + color values

export interface ParsedBackgroundPattern {
  structuralPattern: string;
  gradientDirection?: string;
  gradientType: 'linear' | 'radial' | 'conic' | 'solid';
  colorStops: ColorStop[];
  effects: BackgroundEffect[];
  complexity: 'low' | 'medium' | 'high';
}

export interface ColorStop {
  color: string;
  position?: string;
  variable: string;
  originalClass?: string;
}

export interface BackgroundEffect {
  type: 'blur' | 'backdrop-blur' | 'opacity' | 'blend-mode' | 'brightness';
  value: string;
  variable?: string;
}

export interface VariableMapping {
  variables: Record<string, string>;
  mapping: Record<string, string>;
  fallbackClass: string;
}

export class BackgroundPatternAnalyzer {
  private readonly TAILWIND_COLOR_REGEX = /(?:from|via|to|bg)-([a-z]+)-(\d+)/g;
  private readonly HEX_COLOR_REGEX = /bg-\[#([0-9A-Fa-f]{6})\]/g;
  private readonly GRADIENT_DIRECTION_REGEX = /bg-gradient-to-([trbl]{1,2})/;
  private readonly RADIAL_GRADIENT_REGEX = /bg-\[radial-gradient\(([^)]+)\)/;
  private readonly BLUR_REGEX = /blur-\[(\d+)px\]/;
  private readonly OPACITY_REGEX = /(?:bg-opacity-|opacity-)(\d+)/;
  private readonly ARBITRARY_VALUE_REGEX = /bg-\[([^\]]+)\]/g;

  /**
   * Parse a legacy Tailwind background class into structural pattern and variables
   */
  parseTailwindBackground(tailwindClass: string): ParsedBackgroundPattern {
    const pattern = this.analyzePattern(tailwindClass);
    const colorStops = this.extractColorStops(tailwindClass);
    const effects = this.extractEffects(tailwindClass);
    const complexity = this.calculateComplexity(tailwindClass, effects);

    return {
      structuralPattern: pattern.structural,
      gradientDirection: pattern.direction,
      gradientType: pattern.type,
      colorStops,
      effects,
      complexity
    };
  }

  /**
   * Extract structural pattern from Tailwind class
   */
  extractStructuralPattern(parsedPattern: ParsedBackgroundPattern): string {
    const { gradientType, gradientDirection, effects } = parsedPattern;

    let baseClass = '';

    // Map gradient types to structural classes
    switch (gradientType) {
      case 'linear':
        if (gradientDirection) {
          baseClass = `bg-gradient-vars-${gradientDirection}`;
        } else {
          baseClass = 'bg-gradient-vars-r'; // default to right
        }
        break;
      
      case 'radial':
        if (parsedPattern.structuralPattern.includes('ellipse at center')) {
          baseClass = 'bg-radial-vars-center';
        } else if (parsedPattern.structuralPattern.includes('ellipse at top')) {
          baseClass = 'bg-radial-vars-top';
        } else if (parsedPattern.structuralPattern.includes('ellipse at bottom')) {
          baseClass = 'bg-radial-vars-bottom';
        } else if (parsedPattern.structuralPattern.includes('circle at center')) {
          baseClass = 'bg-radial-circle-vars';
        } else {
          baseClass = 'bg-radial-vars-center'; // default
        }
        break;
      
      case 'solid':
        baseClass = 'bg-pattern-neutral';
        break;
      
      default:
        baseClass = 'bg-pattern-primary';
    }

    // Add effect classes
    const effectClasses = effects.map(effect => {
      switch (effect.type) {
        case 'blur':
          const blurValue = parseInt(effect.value.replace('px', ''));
          if (blurValue >= 160) return 'blur-var-extreme';
          if (blurValue >= 80) return 'blur-var-strong';
          if (blurValue >= 16) return 'blur-var-medium';
          return 'blur-var-subtle';
        
        case 'backdrop-blur':
          return 'backdrop-blur-var-md';
        
        case 'opacity':
          const opacityValue = parseInt(effect.value);
          return `opacity-var-${opacityValue}`;
        
        default:
          return '';
      }
    }).filter(Boolean);

    return [baseClass, ...effectClasses].join(' ');
  }

  /**
   * Extract color values and generate CSS variable mapping
   */
  extractColorValues(parsedPattern: ParsedBackgroundPattern): VariableMapping {
    const variables: Record<string, string> = {};
    const mapping: Record<string, string> = {};
    
    // Process color stops
    parsedPattern.colorStops.forEach((stop, index) => {
      const variableName = stop.variable;
      
      if (stop.color.startsWith('#')) {
        // Hex color
        variables[variableName] = stop.color;
        mapping[variableName] = stop.color;
      } else if (stop.color === 'transparent') {
        variables[variableName] = 'transparent';
        mapping[variableName] = 'transparent';
      } else {
        // Tailwind color - convert to hex approximation
        const hexColor = this.tailwindColorToHex(stop.color);
        variables[variableName] = hexColor;
        mapping[variableName] = hexColor;
      }
    });

    // Add effect variables
    parsedPattern.effects.forEach(effect => {
      if (effect.variable) {
        variables[effect.variable] = effect.value;
        mapping[effect.variable] = effect.value;
      }
    });

    return {
      variables,
      mapping,
      fallbackClass: '' // Will be set by the adapter
    };
  }

  /**
   * Validate if a pattern can be safely migrated
   */
  validateMigration(tailwindClass: string): {
    canMigrate: boolean;
    warnings: string[];
    complexity: 'low' | 'medium' | 'high';
  } {
    const warnings: string[] = [];
    let canMigrate = true;

    // Check for complex patterns that might not translate well
    if (tailwindClass.includes('bg-[url(')) {
      warnings.push('Background images require manual migration');
      canMigrate = false;
    }

    if (tailwindClass.includes('bg-blend-')) {
      warnings.push('Blend modes may require additional CSS variables');
    }

    if (tailwindClass.includes('bg-clip-')) {
      warnings.push('Background clip properties not yet supported');
    }

    if (tailwindClass.includes('bg-attachment-')) {
      warnings.push('Background attachment properties may need manual handling');
    }

    // Count arbitrary values
    const arbitraryValues = tailwindClass.match(/\[[^\]]+\]/g) || [];
    const complexity = arbitraryValues.length > 3 ? 'high' : 
                     arbitraryValues.length > 1 ? 'medium' : 'low';

    if (complexity === 'high') {
      warnings.push('High complexity pattern may need manual optimization');
    }

    return { canMigrate, warnings, complexity };
  }

  // Private helper methods

  private analyzePattern(tailwindClass: string): {
    structural: string;
    direction?: string;
    type: 'linear' | 'radial' | 'conic' | 'solid';
  } {
    // Check for radial gradients
    const radialMatch = tailwindClass.match(this.RADIAL_GRADIENT_REGEX);
    if (radialMatch) {
      return {
        structural: radialMatch[1],
        type: 'radial'
      };
    }

    // Check for linear gradients
    const directionMatch = tailwindClass.match(this.GRADIENT_DIRECTION_REGEX);
    if (directionMatch) {
      return {
        structural: `linear-gradient-${directionMatch[1]}`,
        direction: directionMatch[1],
        type: 'linear'
      };
    }

    // Check for conic gradients (future support)
    if (tailwindClass.includes('conic-gradient')) {
      return {
        structural: 'conic-gradient',
        type: 'conic'
      };
    }

    // Default to solid
    return {
      structural: 'solid-background',
      type: 'solid'
    };
  }

  private extractColorStops(tailwindClass: string): ColorStop[] {
    const stops: ColorStop[] = [];

    // Extract Tailwind color classes
    let match;
    const tailwindRegex = new RegExp(this.TAILWIND_COLOR_REGEX.source, 'g');
    
    while ((match = tailwindRegex.exec(tailwindClass)) !== null) {
      const [fullMatch, colorFamily, shade] = match;
      const stopType = fullMatch.startsWith('from-') ? 'from' : 
                     fullMatch.startsWith('via-') ? 'via' : 'to';
      
      stops.push({
        color: `${colorFamily}-${shade}`,
        variable: `--gradient-${stopType}`,
        originalClass: fullMatch
      });
    }

    // Extract hex colors
    const hexRegex = new RegExp(this.HEX_COLOR_REGEX.source, 'g');
    while ((match = hexRegex.exec(tailwindClass)) !== null) {
      stops.push({
        color: `#${match[1]}`,
        variable: `--gradient-from`, // Default to from, will be refined
        originalClass: match[0]
      });
    }

    // Extract transparent values
    if (tailwindClass.includes('to-transparent')) {
      stops.push({
        color: 'transparent',
        variable: '--gradient-to',
        originalClass: 'to-transparent'
      });
    }

    return stops;
  }

  private extractEffects(tailwindClass: string): BackgroundEffect[] {
    const effects: BackgroundEffect[] = [];

    // Extract blur effects
    const blurMatch = tailwindClass.match(this.BLUR_REGEX);
    if (blurMatch) {
      effects.push({
        type: 'blur',
        value: `${blurMatch[1]}px`,
        variable: '--blur-custom'
      });
    }

    // Extract standard blur classes
    if (tailwindClass.includes('backdrop-blur-sm')) {
      effects.push({ type: 'backdrop-blur', value: '4px' });
    } else if (tailwindClass.includes('backdrop-blur-md')) {
      effects.push({ type: 'backdrop-blur', value: '12px' });
    } else if (tailwindClass.includes('backdrop-blur-lg')) {
      effects.push({ type: 'backdrop-blur', value: '24px' });
    }

    // Extract opacity
    const opacityMatch = tailwindClass.match(this.OPACITY_REGEX);
    if (opacityMatch) {
      effects.push({
        type: 'opacity',
        value: opacityMatch[1],
        variable: `--opacity-${opacityMatch[1]}`
      });
    }

    return effects;
  }

  private calculateComplexity(tailwindClass: string, effects: BackgroundEffect[]): 'low' | 'medium' | 'high' {
    let complexity = 0;

    // Base complexity from class length
    if (tailwindClass.length > 100) complexity += 2;
    else if (tailwindClass.length > 50) complexity += 1;

    // Complexity from effects
    complexity += effects.length;

    // Complexity from arbitrary values
    const arbitraryValues = tailwindClass.match(/\[[^\]]+\]/g) || [];
    complexity += arbitraryValues.length;

    // Complexity from multiple gradients or patterns
    if (tailwindClass.includes('radial-gradient') && tailwindClass.includes('linear-gradient')) {
      complexity += 2;
    }

    if (complexity >= 5) return 'high';
    if (complexity >= 3) return 'medium';
    return 'low';
  }

  private tailwindColorToHex(tailwindColor: string): string {
    // Mapping of common Tailwind colors to hex values
    const colorMap: Record<string, string> = {
      // Blues
      'blue-50': '#eff6ff',
      'blue-100': '#dbeafe',
      'blue-200': '#bfdbfe',
      'blue-300': '#93c5fd',
      'blue-400': '#60a5fa',
      'blue-500': '#3b82f6',
      'blue-600': '#2563eb',
      'blue-700': '#1d4ed8',
      'blue-800': '#1e40af',
      'blue-900': '#1e3a8a',

      // Sky
      'sky-50': '#f0f9ff',
      'sky-100': '#e0f2fe',
      'sky-200': '#bae6fd',
      'sky-300': '#7dd3fc',
      'sky-400': '#38bdf8',
      'sky-500': '#0ea5e9',
      'sky-600': '#0284c7',
      'sky-700': '#0369a1',
      'sky-800': '#075985',
      'sky-900': '#0c4a6e',

      // Indigo
      'indigo-50': '#eef2ff',
      'indigo-100': '#e0e7ff',
      'indigo-200': '#c7d2fe',
      'indigo-300': '#a5b4fc',
      'indigo-400': '#818cf8',
      'indigo-500': '#6366f1',
      'indigo-600': '#4f46e5',
      'indigo-700': '#4338ca',
      'indigo-800': '#3730a3',
      'indigo-900': '#312e81',

      // Purple
      'purple-50': '#faf5ff',
      'purple-100': '#f3e8ff',
      'purple-200': '#e9d5ff',
      'purple-300': '#d8b4fe',
      'purple-400': '#c084fc',
      'purple-500': '#a855f7',
      'purple-600': '#9333ea',
      'purple-700': '#7c3aed',
      'purple-800': '#6b21a8',
      'purple-900': '#581c87',

      // Add more colors as needed...
      'gray-50': '#f9fafb',
      'gray-100': '#f3f4f6',
      'gray-200': '#e5e7eb',
      'gray-500': '#6b7280',
      'gray-900': '#111827',

      'white': '#ffffff',
      'black': '#000000',
    };

    return colorMap[tailwindColor] || '#6b7280'; // Default to gray-500
  }
}

// Export singleton instance
export const backgroundPatternAnalyzer = new BackgroundPatternAnalyzer();