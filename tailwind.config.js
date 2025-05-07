/** @type {import('tailwindcss').Config} */
module.exports = {
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
      },
      keyframes: {
        pulseBorder: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' },
          '50%': { boxShadow: '0 0 0 6px rgba(59, 130, 246, 0)' },
        },
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['Sora', 'sans-serif'],
      },
      colors: {
        brand: {
          
          text: '#003E80',
          mutedText: '#5A6A85',
          accentPrimary: '#FF814A',
          logo: '#006CFF',
          highlightText: '#FFE8DC',
          highlightBG: '#FFF5EF',
        },

        landing: {
          primary: '#14B8A6',        // blue-600
          primaryHover: '#0D9488',   // blue-800
          accent: '#34D399',         // emerald-400
          mutedBg: '#F9FAFB',        // gray-50
          border: '#E5E7EB',         // gray-200
          textPrimary: '#111827',    // gray-900
          textSecondary: '#374151',  // gray-700
          textMuted: '#6B7280',      // gray-500
        },
        editable: {
          bg: "#FEF9C3",
          primaryBg:'#E0F7F5',         // yellow-100
          border: "#D1D5DB",     // gray-300
          icon: "#9CA3AF", 
          primaryIcon: "#1F2937",       // gray-400
        }
      },
      spacing: {
        "editable-icon": "1.25rem", // 20px
      },
      outlineWidth: {
        editable: "1px",
      },
      
    },
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
  ],
}
