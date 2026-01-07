/**
 * Build Published CSS - Phase 1
 *
 * Compiles Tailwind CSS specifically for published components
 * Target: 30-50KB uncompressed (~10-15KB gzipped)
 * Output: public/published.css
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function buildPublishedCSS() {
  console.log('🎨 Building published.css...');

  const rootDir = path.join(__dirname, '..');

  try {
    // Create temporary Tailwind config for published components
    const publishedConfig = {
      mode: 'jit',
      content: [
        'src/modules/UIBlocks/**/*.published.tsx',
        'src/components/published/**/*.tsx',
        'src/modules/generatedLanding/LandingPagePublishedRenderer.tsx',
        'src/modules/generatedLanding/componentRegistry.published.ts'
      ],
      safelist: [
        // Essential structural classes
        'landing-page-published',
        'mix-blend-multiply',
        'mix-blend-screen',

        // Max-width utilities
        'max-w-[43rem]',
        'max-w-[45rem]',
        'max-w-[50rem]',
        'max-w-[66rem]',
        'max-w-3xl',
        'max-w-4xl',
        'max-w-5xl',
        'max-w-6xl',
        'max-w-7xl',

        // Grid layouts
        'lg:grid-cols-[1.35fr_1fr]',
        'md:grid-cols-[1.25fr_1fr]',
        'grid-cols-[1.25fr_1fr]',

        // Opacity utilities
        'bg-black/70',
        'opacity-0',
        'opacity-var-10',
        'opacity-var-20',
        'opacity-var-30',
        'opacity-var-50',
        'opacity-var-70',
        'opacity-var-80',
        'opacity-var-90',

        // Spacing utilities
        'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8', 'gap-12', 'gap-16', 'gap-20',
        'space-x-0', 'space-x-1', 'space-x-2', 'space-x-3', 'space-x-4', 'space-x-6', 'space-x-8', 'space-x-12',
        'space-y-0', 'space-y-3', 'space-y-4', 'space-y-6', 'space-y-8', 'space-y-24',
        '-space-x-2',
        'p-4', 'p-6', 'p-8',
        'py-1', 'py-2', 'py-4', 'py-6',
        'px-3', 'px-4', 'px-6', 'px-12',
        'pt-4', 'pt-6', 'pt-8',
        'pb-4', 'pb-6', 'pb-12', 'pb-32', 'pb-40',
        'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-6', 'mb-8', 'mb-12', 'mb-16', 'mb-20',
        'mt-4', 'mt-8', 'mt-12', 'mt-16',
        'mr-1', 'mr-3', 'mr-3.5', 'mr-6',
        'ml-1', 'ml-2', 'ml-6',

        // Sizing utilities
        'w-3', 'w-4', 'w-5', 'w-7', 'w-8', 'w-10', 'w-12', 'w-14', 'w-16', 'w-20', 'w-0.5',
        'h-3', 'h-4', 'h-5', 'h-7', 'h-8', 'h-10', 'h-12', 'h-14', 'h-16', 'h-20', 'h-24', 'h-28', 'h-32', 'h-36', 'h-40',

        // Transform utilities
        'transform',
        '-translate-x-1/2',
        '-translate-y-0.5',
        '-translate-y-1',
        'scale-105',
        'scale-110',
        'rotate-0',

        // Position utilities
        'top-1', 'top-6', 'top-16',
        'left-6', 'left-8',
        'right-1', 'right-6',
        'bottom-0', 'bottom-6',
        '-bottom-2', '-bottom-8',
        '-top-2', '-top-3',

        // Border radius
        'rounded-2xl',
        'rounded-t-sm',

        // Animations
        'duration-200',
        'duration-300',
        'duration-500',
        'transition-all',
        'transition-opacity',
        'transition-transform',
        'transition-shadow',
        'ease-in-out',

        // Text sizing
        'text-xl',
        'text-2xl',
        'text-3xl',
        'text-4xl',
        'text-5xl',
        'text-heading1',
        'text-heading2',
        'text-heading3',
        'text-heading4',

        // Shadows
        'shadow-lg',
        'shadow-xl',
        'shadow-2xl',
        'shadow-3xl',
        'drop-shadow-sm',
        'drop-shadow',
        'drop-shadow-md',

        // Grid utilities
        'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5', 'grid-cols-6',
        'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-5', 'md:grid-cols-6',
        'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-5', 'lg:grid-cols-6',
        'justify-items-center',

        // Variable-based classes (NEW system)
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

        // Blur effects
        'blur-var-subtle',
        'blur-var-medium',
        'blur-var-strong',
        'blur-var-extreme',
        'backdrop-blur-var-md',
        'backdrop-blur-sm',
        'backdrop-blur-md',
        'backdrop-blur-lg',
        'blur-[160px]',
        'blur-[120px]',
        'blur-[100px]',

        // Legacy gradient directions
        'bg-gradient-to-tr', 'bg-gradient-to-tl', 'bg-gradient-to-br', 'bg-gradient-to-bl',
        'bg-gradient-to-t', 'bg-gradient-to-b', 'bg-gradient-to-l', 'bg-gradient-to-r',

        // Essential colors
        'bg-white', 'bg-gray-50', 'bg-gray-100',
        'to-transparent', 'via-transparent', 'from-transparent',
        'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
        'text-white', 'text-black',
        '!text-gray-900', '!text-gray-800',

        // Radial gradients
        'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]',
        'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]',
        'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]',

        // Responsive flex
        'sm:flex-row', 'sm:flex-col',
        'md:flex-row', 'md:flex-col',
        'lg:flex-row', 'lg:flex-col',
        'sm:space-y-0', 'sm:space-x-8', 'sm:space-x-12',
        'lg:mb-20', 'lg:pb-32', 'lg:pb-40',

        // Essential color utilities (expanded from patterns)
        'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600', 'bg-blue-900',
        'bg-purple-50', 'bg-purple-100', 'bg-purple-500', 'bg-purple-600', 'bg-purple-900',
        'bg-gray-50', 'bg-gray-100', 'bg-gray-500', 'bg-gray-600', 'bg-gray-900',
        'from-blue-50', 'from-blue-100', 'from-blue-500', 'from-blue-600', 'from-blue-900',
        'from-purple-50', 'from-purple-100', 'from-purple-500', 'from-purple-600', 'from-purple-900',
        'from-gray-50', 'from-gray-100', 'from-gray-500', 'from-gray-600', 'from-gray-900',
        'to-blue-50', 'to-blue-100', 'to-blue-500', 'to-blue-600', 'to-blue-900',
        'to-purple-50', 'to-purple-100', 'to-purple-500', 'to-purple-600', 'to-purple-900',
        'to-gray-50', 'to-gray-100', 'to-gray-500', 'to-gray-600', 'to-gray-900',
        'via-blue-50', 'via-blue-100', 'via-blue-500', 'via-blue-600', 'via-blue-900',
        'via-purple-50', 'via-purple-100', 'via-purple-500', 'via-purple-600', 'via-purple-900',
        'via-gray-50', 'via-gray-100', 'via-gray-500', 'via-gray-600', 'via-gray-900',
      ],
      theme: {
        extend: {
          fontFamily: {
            heading: ['Sora', 'sans-serif'],
            body: ['Sora', 'sans-serif']
          },
          colors: {
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
            }
          },
          fontSize: {
            display: 'clamp(3rem, 8vw, 5rem)',
            hero: 'clamp(2.5rem, 6vw, 4rem)',
            h1: 'clamp(2rem, 5vw, 3rem)',
            h2: 'clamp(1.5rem, 3.5vw, 2rem)',
            h3: 'clamp(1.25rem, 2.5vw, 1.5rem)',
            'body-lg': 'clamp(1.125rem, 2vw, 1.25rem)',
            body: 'clamp(1rem, 1.5vw, 1.125rem)',
            'body-sm': 'clamp(0.875rem, 1vw, 1rem)',
            caption: 'clamp(0.75rem, 0.8vw, 0.875rem)'
          },
          lineHeight: {
            tight: '1.1',
            snug: '1.3',
            relaxed: '1.625',
            normal: '1.5',
          },
          letterSpacing: {
            tightest: '-0.03em',
            tighter: '-0.02em',
            tight: '-0.01em',
            normal: '0',
            wide: '0.01em',
            wider: '0.02em',
          }
        }
      },
      plugins: []
    };

    // Write temp config
    const tempConfigPath = path.join(rootDir, 'tailwind.published.config.js');
    fs.writeFileSync(
      tempConfigPath,
      `module.exports = ${JSON.stringify(publishedConfig, null, 2)}`
    );
    console.log('✅ Created temporary Tailwind config');

    // Create input CSS with color-variables import
    const inputCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import color-variables.css for CSS variable system */
@import './src/styles/color-variables.css';
`;

    const inputCSSPath = path.join(rootDir, 'published.input.css');
    fs.writeFileSync(inputCSSPath, inputCSS);
    console.log('✅ Created input CSS file');

    // Ensure public directory exists
    const publicDir = path.join(rootDir, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Run Tailwind CLI
    console.log('⚙️  Running Tailwind CSS compilation...');
    const outputPath = path.join(rootDir, 'public', 'published.css');

    await execAsync(
      `npx tailwindcss -c tailwind.published.config.js -i published.input.css -o public/published.css --minify`,
      { cwd: rootDir }
    );

    // Verify output
    if (!fs.existsSync(outputPath)) {
      throw new Error('Output file not created');
    }

    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ Published CSS generated: ${sizeKB} KB`);

    // Warn if size exceeds target
    if (stats.size > 100 * 1024) {
      console.warn(`⚠️  WARNING: Published CSS is ${sizeKB} KB (target: <50KB uncompressed)`);
      console.warn('   Consider optimizing safelist patterns');
    } else if (stats.size < 50 * 1024) {
      console.log('✨ CSS size within target range (<50KB)');
    }

    // Cleanup temp files
    fs.unlinkSync(tempConfigPath);
    fs.unlinkSync(inputCSSPath);
    console.log('🧹 Cleaned up temporary files');

    console.log('✅ Published CSS build complete!');

  } catch (error) {
    console.error('❌ Build failed:', error.message);

    // Cleanup on error
    const tempConfigPath = path.join(rootDir, 'tailwind.published.config.js');
    const inputCSSPath = path.join(rootDir, 'published.input.css');

    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
    if (fs.existsSync(inputCSSPath)) {
      fs.unlinkSync(inputCSSPath);
    }

    process.exit(1);
  }
}

buildPublishedCSS().catch(console.error);
