/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    // ✅ FORCE JIT to be more permissive with arbitrary values
    mode: 'jit',
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.css", // Include CSS files for pattern detection
    "./src/utils/tailwind-seed.js", // Include seed file for arbitrary patterns
  ],
  safelist: [
  // ✅ Editor UI classes
  'hover:bg-editable-bg',
  'hover:bg-editable-primaryBg',
  'hover:text-black',
  'hover:outline-editable',
  'hover:outline-dashed',
  'hover:outline-1',
  'text-editable-icon',
  'w-editable-icon',
  'h-editable-icon',
  'top-1',
  'right-1',
  'group-hover:opacity-100',
  'group-hover/customer-count:opacity-100',
  'group-hover/rating-section:opacity-100',
  'group-hover/customer-item:opacity-100',
  'group-hover/rating-item:opacity-100',
  'group-hover/benefit-item:opacity-100',
  'group-hover/offer-item:opacity-100',
  'group-hover/uptime-item:opacity-100',
  'group-hover/social-proof:opacity-100',
  'group-hover/stat-item:opacity-100',
  'group-hover/feature-item:opacity-100',
  'group-hover/trust-footer-item:opacity-100',
  // FeatureMatrix specific patterns
  'group-hover/tier-header-0:opacity-100',
  'group-hover/tier-header-1:opacity-100',
  'group-hover/tier-header-2:opacity-100',
  'group-hover/category-tab:opacity-100',
  'group-hover/feature-row:opacity-100',
  'group-hover/enterprise-feature:opacity-100',
  // CardWithTestimonial specific patterns
  'group-hover/tier-0:opacity-100',
  'group-hover/tier-1:opacity-100',
  'group-hover/tier-2:opacity-100',
  'group-hover/feature:opacity-100',
  'group-hover/testimonial:opacity-100',
  'group-hover/social-metric:opacity-100',
  'group-hover/guarantee:opacity-100',
  'group-focus-within:opacity-100',
  'opacity-0',
  'transition-opacity',
  'duration-200',
  'ease-in-out',
  
  // ✅ Gap utilities for spacing
  'gap-1',
  'gap-2', 
  'gap-3',
  'gap-4',
  'gap-6',
  'gap-8',
  'gap-12',
  'gap-16', 
  'gap-20',
  
  // ✅ Margin utilities for internal spacing
  'mr-1',
  'mr-3', 
  'mr-3.5',
  'mr-6',
  'mb-1',
  'mb-2',
  'mb-3',
  'mb-4',
  'mb-6',
  'mb-8',
  'mb-12',
  'mb-16',
  'mt-4',
  'mt-8',
  'mt-12',
  'mt-16',
  'ml-1',
  'ml-2',
  'ml-6',
  
  // ✅ Space utilities for layout spacing
  'space-x-0',
  'space-x-1',
  'space-x-2',
  'space-x-3',
  'space-x-4',
  'space-x-6',
  'space-x-8',
  'space-x-12',
  'space-y-0',
  'space-y-3',
  'space-y-4',
  'space-y-6',
  'space-y-8',
  'space-y-24',
  '-space-x-2',
  'sm:space-y-0',
  'sm:space-x-8',
  'sm:space-x-12',
  
  // ✅ Padding utilities for component spacing
  'p-4',
  'p-6',
  'p-8',
  'py-1',
  'py-2',
  'py-4',
  'py-6',
  'px-3',
  'px-4',
  'px-6',
  'px-12',
  'pt-4',
  'pt-6',
  'pt-8',
  'pb-4',
  'pb-6',
  'pb-12',
  
  // ✅ Sizing utilities for components
  'w-3',
  'w-4',
  'w-5',
  'w-7',
  'w-8',
  'w-10',
  'w-12',
  'w-14',
  'w-16',
  'w-20',
  'w-0.5',
  'h-3',
  'h-4',
  'h-5',
  'h-7',
  'h-8',
  'h-10',
  'h-12',
  'h-14',
  'h-16',
  'h-20',
  'h-24',
  'h-28',
  'h-32',
  'h-36',
  'h-40',
  
  // ✅ Max-width utilities
  'max-w-3xl',
  'max-w-4xl',
  'max-w-5xl',
  'max-w-6xl',
  'max-w-7xl',
  
  // ✅ Transform utilities
  'transform',
  '-translate-x-1/2',
  '-translate-y-0.5',
  '-translate-y-1',
  'hover:-translate-y-0.5',
  'scale-105',
  'scale-110',
  'rotate-0',
  
  // ✅ Position utilities
  'top-6',
  'top-16',
  'left-6',
  'left-8',
  'right-6',
  'bottom-0',
  'bottom-6',
  '-bottom-2',
  '-bottom-8',
  '-top-2',
  '-top-3',
  
  // ✅ Border radius utilities
  'rounded-2xl',
  'rounded-t-sm',
  
  // ✅ Animation utilities
  'duration-200',
  'duration-300',
  'duration-500',
  'transition-all',
  'transition-transform',
  'transition-shadow',
  
  // ✅ Text sizing utilities
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-5xl',
  
  // ✅ Shadow utilities
  'shadow-lg',
  'shadow-xl',
  'shadow-2xl',
  'shadow-3xl',
  'hover:shadow-xl',
  'hover:shadow-2xl',
  'hover:shadow-3xl',
  
  // ✅ Responsive flex utilities
  'sm:flex-row',
  'sm:flex-col',
  'md:flex-row',
  'md:flex-col',
  'lg:flex-row',
  'lg:flex-col',
  
  // ✅ Grid utilities for responsive layouts
  'grid-cols-1',
  'grid-cols-2',
  'grid-cols-3',
  'grid-cols-4',
  'grid-cols-5',
  'grid-cols-6',
  'md:grid-cols-1',
  'md:grid-cols-2',
  'md:grid-cols-3',
  'md:grid-cols-4',
  'md:grid-cols-5',
  'md:grid-cols-6',
  'lg:grid-cols-1',
  'lg:grid-cols-2',
  'lg:grid-cols-3',
  'lg:grid-cols-4',
  'lg:grid-cols-5',
  'lg:grid-cols-6',
  
  // ✅ Variable-based structural classes (NEW - replaces massive color patterns)
  'bg-pattern-primary',
  'bg-pattern-secondary', 
  'bg-pattern-neutral',
  'bg-pattern-divider',
  'bg-gradient-vars-tr',
  'bg-gradient-vars-tl', 
  'bg-gradient-vars-br',
  'bg-gradient-vars-bl',
  'bg-gradient-vars-r',
  'bg-gradient-vars-l',
  'bg-radial-vars-center',
  'bg-radial-vars-top',
  'bg-radial-vars-bottom',
  'bg-radial-circle-vars',
  'bg-soft-gradient-blur',
  'bg-startup-skybox',
  'bg-glass-morph',
  
  // ✅ Variable-based effect classes
  'blur-var-subtle',
  'blur-var-medium', 
  'blur-var-strong',
  'blur-var-extreme',
  'backdrop-blur-var-md',
  'opacity-var-10',
  'opacity-var-20',
  'opacity-var-30', 
  'opacity-var-50',
  'opacity-var-70',
  'opacity-var-80',
  'opacity-var-90',
  
  // ✅ Legacy fallback support (REDUCED - only essential patterns)
  'bg-gradient-to-tr', 'bg-gradient-to-tl', 'bg-gradient-to-br', 'bg-gradient-to-bl',
  'bg-gradient-to-t', 'bg-gradient-to-b', 'bg-gradient-to-l', 'bg-gradient-to-r',
  
  // ✅ Essential legacy color patterns (DRAMATICALLY REDUCED from 125+ to ~20)
  { pattern: /bg-(blue|purple|gray)-(50|100|500|600|900)/ },
  { pattern: /from-(blue|purple|gray)-(50|100|500|600|900)/ },
  { pattern: /to-(blue|purple|gray)-(50|100|500|600|900)/ },
  { pattern: /via-(blue|purple|gray)-(50|100|500|600|900)/ },
  
  // ✅ Critical static backgrounds 
  'bg-white', 'bg-gray-50', 'bg-gray-100',
  'to-transparent', 'via-transparent', 'from-transparent',
  
  // ✅ Essential text colors (REDUCED)
  'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
  'text-white', 'text-black',
  '!text-gray-900', '!text-gray-800',
  
  // ✅ Critical legacy patterns that can't be migrated yet
  'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]',
  'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]',
  'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]',
  'blur-[160px]',
  'blur-[120px]',
  'blur-[100px]',
  'backdrop-blur-sm', 'backdrop-blur-md', 'backdrop-blur-lg',
  'drop-shadow-sm', 'drop-shadow', 'drop-shadow-md',
  
  // ✅ CSS variable usage
  'var(--tw-gradient-stops)',
  
  // ✅ Arbitrary background colors for custom color picker
  { pattern: /bg-\[#[0-9a-fA-F]{6}\]/ },
  { pattern: /bg-\[#[0-9a-fA-F]{3}\]/ },
  { pattern: /bg-\[linear-gradient\([^\]]+\)\]/ },
  { pattern: /bg-\[radial-gradient\([^\]]+\)\]/ },
  { pattern: /bg-\[[a-zA-Z0-9#,%()\s-]+\]/ },
  
  // ✅ Arbitrary sizing patterns for UIBlocks
  { pattern: /min-h-\[\d+px\]/ },
  { pattern: /min-w-\[\d+px\]/ },
  { pattern: /max-h-\[\d+px\]/ },
  { pattern: /max-w-\[\d+px\]/ },
  { pattern: /w-\[\d+px\]/ },
  { pattern: /h-\[\d+px\]/ },
],
  theme: {
  	extend: {
  		animation: {
  			'pulse-border': 'pulseBorder 2s infinite',
			'loading-fill': 'loadingFill linear forwards',
  		},
  		keyframes: {
  			pulseBorder: {
  				'0%, 100%': {
  					boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)'
  				},
  				'50%': {
  					boxShadow: '0 0 0 6px rgba(59, 130, 246, 0)'
  				},
			},
				loadingFill: {
					'0%': { width: '0%' },
					'100%': { width: '100%' },
  			}
  		},
  		fontFamily: {
  			heading: [
  				'Sora',
  				'sans-serif'
  			],
  			body: [
  				'Sora',
  				'sans-serif'
  			]
  		},
  		colors: {
  			brand: {
  				text: '#003E80',
  				mutedText: '#5A6A85',
  				accentPrimary: '#FF814A',
  				logo: '#006CFF',
  				highlightText: '#FFE8DC',
  				highlightBG: '#FFF5EF'
  			},
  			landing: {
				primary: 'var(--landing-primary)',
				primaryHover: 'var(--landing-primary-hover)',
				accent: 'var(--landing-accent)',
				mutedBg: 'var(--landing-muted-bg)',
				border: 'var(--landing-border)',
				textPrimary: 'var(--landing-text-primary)',
				textSecondary: 'var(--landing-text-secondary)',
				textMuted: 'var(--landing-text-muted)'
				},
			// ✅ CSS Variable-based color system for migration
			'bg-vars': {
				primary: 'var(--bg-primary-base)',
				secondary: 'var(--bg-secondary-base)',
				neutral: 'var(--bg-neutral-base)',
				divider: 'var(--bg-divider-base)'
			},
			'gradient-vars': {
				from: 'var(--gradient-from)',
				via: 'var(--gradient-via)',
				to: 'var(--gradient-to)'
			},
			'accent-vars': {
				primary: 'var(--accent-primary)',
				'primary-hover': 'var(--accent-primary-hover)',
				'primary-active': 'var(--accent-primary-active)',
				secondary: 'var(--accent-secondary)'
			},
			'text-vars': {
				primary: 'var(--text-primary)',
				secondary: 'var(--text-secondary)',
				muted: 'var(--text-muted)',
				'on-accent': 'var(--text-on-accent)'
			},
  			editable: {
  				bg: '#FEF9C3',
  				primaryBg: '#E0F7F5',
  				border: '#D1D5DB',
  				icon: '#9CA3AF',
  				primaryIcon: '#1F2937'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		spacing: {
  			'editable-icon': '1.25rem'
  		},
  		outlineWidth: {
  			editable: '1px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		
		fontSize: {
        display: 'clamp(3rem, 8vw, 5rem)',       // 48–80px
        hero: 'clamp(2.5rem, 6vw, 4rem)',         // 40–64px
        h1: 'clamp(2rem, 5vw, 3rem)',             // 32–48px
        h2: 'clamp(1.5rem, 3.5vw, 2rem)',         // 24–32px
        h3: 'clamp(1.25rem, 2.5vw, 1.5rem)',      // 20–24px
        'body-lg': 'clamp(1.125rem, 2vw, 1.25rem)', // 18–20px
        body: 'clamp(1rem, 1.5vw, 1.125rem)',     // 16–18px
        'body-sm': 'clamp(0.875rem, 1vw, 1rem)',  // 14–16px
        caption: 'clamp(0.75rem, 0.8vw, 0.875rem)' // 12–14px
      },
      lineHeight: {
        tight: '1.1',     // for display/hero
        snug: '1.3',      // for h1–h3
        relaxed: '1.625', // for body
        normal: '1.5',    // for captions
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.01em',
        wider: '0.02em',
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

  	}
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        // Base (mobile-first)
        '.text-heading1': {
          fontSize: '2.3rem',
          fontWeight: '800',
        },
        '.text-heading2': {
          fontSize: '1.2rem',
          fontWeight: '600',
        },
        '.text-heading3': {
          fontSize: '1.65rem',
          fontWeight: '600',
        },
        '.text-heading4': {
          fontSize: '1rem',
          fontWeight: '500',
        },
        'body': {
          fontSize: '1.2rem',     // Normal Body Text
          fontWeight: '400',      // Regular
        },

        // md: overrides
        '@screen md': {
          '.text-heading1': {
            fontSize: '3.5rem',
            fontWeight: '800',
          },
          '.text-heading2': {
            fontSize: '1.6rem',
            fontWeight: '600',
          },
          '.text-heading3': {
            fontSize: '1.25rem',
            fontWeight: '600', 
          },
          '.text-heading4': {
            fontSize: '1.25rem',
            fontWeight: '500',    // Keep Medium
          },
        },
  
        // lg: overrides
        '@screen lg': {
          '.text-heading1': {
            fontSize: '3.7rem',
            fontWeight: '800',
          },
          '.text-heading2': {
            fontSize: '2.5rem',
            fontWeight: '600',
          },
          '.text-heading3': {
            fontSize: '1.5rem',
            fontWeight: '600',
          },
          '.text-heading4': {
            fontSize: '1.10rem',
            fontWeight: '500',
          },
        },
      });
    },
      require("tailwindcss-animate")
],
}
