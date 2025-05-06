/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/modules/generatedLanding/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          landing: {
            primary: '#14B8A6',
            primaryHover: '#0D9488',
            accent: '#34D399',
            mutedBg: '#F9FAFB',
            border: '#E5E7EB',
            textPrimary: '#111827',
            textSecondary: '#374151',
            textMuted: '#6B7280',
          },
        },
      },
    },
    plugins: [],
  }
  