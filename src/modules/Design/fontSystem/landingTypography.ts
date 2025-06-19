export const landingTypography = {
  display: {
    fontSize: 'clamp(3rem, 8vw, 5rem)',
    fontWeight: '700',
    lineHeight: '1.1',
    letterSpacing: '-0.01em',
  },
  hero: {
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: '700',
    lineHeight: '1.1',
    letterSpacing: '-0.01em',
  },
  h1: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: '700',
    lineHeight: '1.3',
    letterSpacing: '-0.005em',
  },
  h2: {
    fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
    fontWeight: '600',
    lineHeight: '1.3',
    letterSpacing: '0',
  },
  h3: {
    fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
    fontWeight: '600',
    lineHeight: '1.4',
    letterSpacing: '0',
  },
  'body-lg': {
    fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
    fontWeight: '400',
    lineHeight: '1.6',
    letterSpacing: '0',
  },
  body: {
    fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
    fontWeight: '400',
    lineHeight: '1.625',
    letterSpacing: '0',
  },
  'body-sm': {
    fontSize: 'clamp(0.875rem, 1vw, 1rem)',
    fontWeight: '400',
    lineHeight: '1.5',
    letterSpacing: '0',
  },
  caption: {
    fontSize: 'clamp(0.75rem, 0.8vw, 0.875rem)',
    fontWeight: '400',
    lineHeight: '1.4',
    letterSpacing: '0.01em',
  },
};

export type TypographyVariant = keyof typeof landingTypography;