// app/edit/[token]/components/modals/index.ts
// Central export file for all modal components

export { default as TaxonomyModalManager } from './TaxonomyModalManager';
export { default as BaseModal } from './BaseModal';
export { default as MarketCategoryModal } from './MarketCategoryModal';
export { default as MarketSubcategoryModal } from './MarketSubcategoryModal';
export { default as TargetAudienceModal } from './TargetAudienceModal';
export { default as StartupStageModal } from './StartupStageModal';
export { default as LandingGoalsModal } from './LandingGoalsModal';
export { default as PricingModelModal } from './PricingModelModal';
export { default as TextInputModal } from './TextInputModal';
export { default as HiddenFieldModals } from './HiddenFieldModals';

// Export types
export type { default as TaxonomyModalManagerProps } from './TaxonomyModalManager';

// Export hook
export { default as useModalManager } from '@/hooks/useModalManager';