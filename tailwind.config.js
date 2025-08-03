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
  
  // Dynamic gradient backgrounds for background system
  'bg-gradient-to-tr', 'bg-gradient-to-tl', 'bg-gradient-to-br', 'bg-gradient-to-bl',
  'bg-gradient-to-t', 'bg-gradient-to-b', 'bg-gradient-to-l', 'bg-gradient-to-r',
  
  // Dynamic color variations for background system
  { pattern: /bg-(blue|sky|indigo|purple|pink|red|orange|amber|yellow|lime|green|emerald|teal|cyan|gray|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900)/ },
  { pattern: /from-(blue|sky|indigo|purple|pink|red|orange|amber|yellow|lime|green|emerald|teal|cyan|gray|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900)/ },
  { pattern: /via-(blue|sky|indigo|purple|pink|red|orange|amber|yellow|lime|green|emerald|teal|cyan|gray|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900)/ },
  { pattern: /to-(blue|sky|indigo|purple|pink|red|orange|amber|yellow|lime|green|emerald|teal|cyan|gray|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900)/ },
  
  // Static background utilities that might be used
  'bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200',
  'to-transparent', 'via-transparent', 'from-transparent',
  
  // Text color classes for adaptive text
  'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400', 
  'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900', 
  'text-white', 'text-black',
  
  // Additional text colors for colored backgrounds
  'text-blue-50', 'text-blue-100', 'text-blue-900', 'text-blue-950',
  'text-green-50', 'text-green-100', 'text-green-900', 'text-green-950',
  'text-red-50', 'text-red-100', 'text-red-900', 'text-red-950',
  'text-purple-50', 'text-purple-100', 'text-purple-900', 'text-purple-950',
  'text-orange-50', 'text-orange-100', 'text-orange-900', 'text-orange-950',
  
  // ✅ Opacity variations for custom colors
  'bg-opacity-10', 'bg-opacity-20', 'bg-opacity-30', 'bg-opacity-40', 
  'bg-opacity-50', 'bg-opacity-60', 'bg-opacity-70', 'bg-opacity-80', 'bg-opacity-90',
  
  // ✅ NEW: Opacity slash notation for background colors (bg-blue-50/70)
  { pattern: /bg-(blue|sky|indigo|purple|pink|red|orange|amber|yellow|lime|green|emerald|teal|cyan|gray|slate|zinc|neutral|stone)-(50|100|200|300|400|500|600|700|800|900)\/(10|20|30|40|50|60|70|80|90|95)/ },
  { pattern: /bg-white\/(10|20|30|40|50|60|70|80|90|95)/ },
  { pattern: /bg-black\/(10|20|30|40|50|60|70|80|90|95)/ },
  
  // ✅ Backdrop blur effects used in variations
  'backdrop-blur-sm', 'backdrop-blur-md', 'backdrop-blur-lg',
  
  // ✅ Text shadow effects for radial gradient backgrounds
  'drop-shadow-sm', 'drop-shadow', 'drop-shadow-md',
  
  // ✅ Important text colors for radial gradients (force override)
  '!text-gray-900', '!text-gray-800', '!text-gray-600',
  
  // ✅ Specific radial gradient backgrounds from bgVariations  
  'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]',
  'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]',
  'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]',
  'blur-[160px]',
  'blur-[120px]',
  'blur-[100px]',
  
  // ✅ Specific hex color classes from bgVariations
  'from-[#b4d8ff]',
  'via-[#dceeff]',
  'to-[#ffffff]',
  'from-[#FF00FF]',
  'via-[#0A001F]',
  'to-[#0A001F]',
  
  // ✅ Dark theme primary backgrounds
  'bg-[#0b0f19]',
  'bg-[#0a0e17]',
  'bg-[#0f1419]',
  'bg-[#111827]',
  'bg-[#1a1c1f]',
  'bg-[#1b103f]',
  'bg-[#1e1f24]',
  'bg-[#0a0d14]',
  'bg-[#1c1d1f]',
  'bg-[#003B00]',
  'bg-[#001F00]',
  'bg-[#0A001F]',
  
  // ✅ Light theme backgrounds
  'bg-[#e6f0ff]',
  'bg-[#f0f6ff]',
  'bg-[#eafff6]',
  'bg-[#fff3e0]',
  'bg-[#e6f9f3]',
  'bg-[#d6f3f1]',
  'bg-[#ffe8dc]',
  'bg-[#F5F5F5]',
  
  // ✅ Accent colors from bgVariations
  'bg-[#ffe5b4]',
  'bg-[#ff6f61]',
  'bg-[#ff6b5c]',
  'bg-[#ffb677]',
  'bg-[#FF00FF]',
  
  // ✅ CSS variable usage in gradients  
  'var(--tw-gradient-stops)',
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
