'use client';

import { useReviewState } from '@/hooks/useReviewState';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';

export function ReviewPill() {
  const { totalCount, confirmedCount } = useReviewState();
  const { store } = useEditStoreContext();
  const leftPanel = useStoreState(state => state.leftPanel);

  if (totalCount === 0) return null;

  const allDone = confirmedCount === totalCount;
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
      title={
        allDone
          ? 'All elements reviewed'
          : `${totalCount - confirmedCount} elements need review — click to open checklist`
      }
      style={allDone ? pillDoneStyle : isActive ? pillActiveStyle : pillPendingStyle}
    >
      {allDone ? '\u2713 All reviewed' : `${confirmedCount}/${totalCount} reviewed`}
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

const pillDoneStyle: React.CSSProperties = {
  ...pillBase,
  background: '#ecfdf5',
  borderColor: '#a7f3d0',
  color: '#065f46',
  cursor: 'default',
};
