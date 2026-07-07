'use client';

import { useReviewState } from '@/hooks/useReviewState';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';

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

  return (
    <button
      onClick={handleClick}
      title={`${remainingCount} setup ${remainingCount === 1 ? 'step' : 'steps'} left, click to open`}
      style={isActive ? pillActiveStyle : pillPendingStyle}
    >
      {`Setup: ${remainingCount} left`}
    </button>
  );
}

const pillBase: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: '9999px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: '1px solid',
  outline: 'none',
};

const pillPendingStyle: React.CSSProperties = {
  ...pillBase,
  background: '#fffbeb',
  borderColor: '#fde68a',
  color: '#92400e',
};

const pillActiveStyle: React.CSSProperties = {
  ...pillBase,
  background: '#fef3c7',
  borderColor: '#f59e0b',
  color: '#92400e',
};
