// useTypography.ts

import { usePageStore } from '@/hooks/usePageStore';
export function useTypography() {
  const { layout: { theme } } = usePageStore();
  
  const getTextStyle = (variant: keyof typeof landingTypography) => {
    const baseStyle = landingTypography[variant];
    
    return {
      ...baseStyle,
      fontFamily: variant.startsWith('h') || variant === 'display' || variant === 'hero' 
        ? theme.typography.headingFont 
        : theme.typography.bodyFont
    };
  };
  
  return { getTextStyle };
}