/**
 * Dynamic Card Layout System
 * Centralized grid layout logic for consistent card arrangements across UIBlocks
 */

export interface SplitLayoutConfig {
  firstRowCount: number;
  firstRowGrid: string;
  firstRowCard: string;
  secondRowGrid: string;
  secondRowCard: string;
}

export interface CardLayoutConfig {
  gridClass: string;
  cardClass: string;
  containerClass: string;
  splitLayout?: SplitLayoutConfig;
}

/**
 * Get dynamic card layout based on item count
 * Returns Tailwind classes for grid, cards, and container
 *
 * Layout specs:
 * - 1 card: centered, max-w-2xl container, generous padding
 * - 2 cards: side-by-side, max-w-4xl container
 * - 3 cards: standard 3-col grid, max-w-6xl container
 * - 4 cards: 2x2 grid, max-w-5xl container
 * - 5 cards: 3+2 split layout (top 3 standard, bottom 2 centered+larger)
 * - 6+ cards: 3-col wrap, max-w-6xl container, compact padding
 */
export function getDynamicCardLayout(count: number): CardLayoutConfig {
  switch (count) {
    case 1:
      return {
        gridClass: 'grid grid-cols-1 justify-items-center',
        cardClass: 'p-10 w-full max-w-lg',
        containerClass: 'max-w-2xl mx-auto'
      };

    case 2:
      return {
        gridClass: 'grid grid-cols-1 md:grid-cols-2 gap-8',
        cardClass: 'p-8 lg:p-10',
        containerClass: 'max-w-4xl mx-auto'
      };

    case 3:
      return {
        gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8',
        cardClass: 'p-6 lg:p-8',
        containerClass: 'max-w-6xl mx-auto'
      };

    case 4:
      return {
        gridClass: 'grid grid-cols-1 md:grid-cols-2 gap-6',
        cardClass: 'p-6 lg:p-8',
        containerClass: 'max-w-5xl mx-auto'
      };

    case 5:
      // Special: use splitLayout for 3+2 arrangement
      return {
        gridClass: '', // Not used - see splitLayout
        cardClass: '',
        containerClass: 'max-w-6xl mx-auto',
        splitLayout: {
          firstRowCount: 3,
          firstRowGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8',
          firstRowCard: 'p-6 lg:p-8',
          secondRowGrid: 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-6 lg:mt-8',
          secondRowCard: 'p-8 lg:p-10'
        }
      };

    default: // 6+
      return {
        gridClass: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        cardClass: 'p-5 lg:p-6',
        containerClass: 'max-w-6xl mx-auto'
      };
  }
}

/**
 * Check if count requires split layout (5-card special case)
 */
export function isSplitLayout(count: number): boolean {
  return count === 5;
}
