// useTypography.ts

import { usePageStore } from '@/hooks/usePageStore';
import { landingTypography } from '@/modules/Design/fontSystem/landingTypography';

export function useTypography() {
  const { layout: { theme } } = usePageStore();
  
  const getTextStyle = (variant: keyof typeof landingTypography) => {
    const baseStyle = landingTypography[variant];
    
    return {
      ...baseStyle,
      fontFamily: variant.startsWith('h') || variant === 'display' || variant === 'hero' 
        ? `${theme.typography.headingFont}, 'Inter', sans-serif`
        : `${theme.typography.bodyFont}, 'Inter', sans-serif`
    };
  };
  
  return { getTextStyle };
}