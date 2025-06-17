/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
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
  'group-focus-within:opacity-100',
  'opacity-0',
  'transition-opacity',
  'duration-200',
  'ease-in-out',
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
