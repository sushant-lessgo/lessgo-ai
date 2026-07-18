'use client';

import { useReviewState } from '@/hooks/useReviewState';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { AppIcon } from '@/components/ui/icon';

export function ReviewPill() {
  const { remainingCount, allComplete } = useReviewState();
  const { store } = useEditStoreContext();
  const leftPanel = useStoreState(state => state.leftPanel);

  // Auto-hide once every present guide task is done.
  if (allComplete) return null;

  const isActive = leftPanel.activeTab === 'review';

  const handleClick = () => {
    const s = store?.getState();
    if (!s) return;

    if (isActive) {
      s.setLeftPanelTab('pageStructure');
    } else {
      s.setLeftPanelTab('review');
      if (leftPanel.collapsed) s.toggleLeftPanel();
    }
  };

  const label = `${remainingCount} setup ${remainingCount === 1 ? 'step' : 'steps'} left, click to open`;

  return (
    <button
      onClick={handleClick}
      title={label}
      // t1 renders the pill as `flag` + a bare count, so the visible text alone
      // ("3") is a meaningless accessible name. aria-label carries the same
      // sentence the tooltip does, keeping the control describable to screen
      // readers and to selectors after the copy shrank.
      aria-label={label}
      style={isActive ? pillActiveStyle : pillPendingStyle}
    >
      <AppIcon name="flag" size={15} />
      {remainingCount}
    </button>
  );
}

// t1 review pill (editor-shell-redesign phase 2): coral family, `flag` + count.
// The handoff draws ONE pill; `isActive` (review tab already open) keeps a
// distinct-but-related emphasis so the toggle still reads as a toggle — the
// active state is the same family, deepened, not a different hue.
const pillBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '12px',
  fontWeight: 600,
  lineHeight: 1,
  padding: '4px 9px',
  borderRadius: '8px', // t1 pills are 8px-radius, not fully rounded
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: '1px solid',
  outline: 'none',
};

const pillPendingStyle: React.CSSProperties = {
  ...pillBase,
  background: '#fff2ec', // app-review-bg
  borderColor: '#ffd9c7', // app-review-border
  color: '#d9531f', // app-review-text
};

const pillActiveStyle: React.CSSProperties = {
  ...pillBase,
  background: '#ffe1d3', // app-nudge-border — same coral family, one step deeper
  borderColor: '#d9531f',
  color: '#d9531f',
};
