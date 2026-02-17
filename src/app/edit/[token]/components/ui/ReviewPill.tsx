'use client';

import { useReviewState } from '@/hooks/useReviewState';

export function ReviewPill() {
  const { remainingCount, getNextUnreviewed, resetCycleIndex } = useReviewState();
  const isDone = remainingCount === 0;

  const handleClick = () => {
    if (isDone) return;

    const next = getNextUnreviewed();
    if (!next) {
      resetCycleIndex();
      return;
    }

    // Scroll section into view
    const sectionEl = document.querySelector(`[data-section-id="${next.sectionId}"]`);
    sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Try to focus the specific element after scroll
    setTimeout(() => {
      const elementEl = sectionEl?.querySelector(`[data-element-key="${next.elementKey}"]`);
      if (elementEl instanceof HTMLElement) {
        elementEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  return (
    <button
      onClick={handleClick}
      className={isDone ? 'review-pill-done' : 'review-pill-pending'}
      title={
        isDone
          ? 'All elements reviewed'
          : `${remainingCount} elements need review — click to cycle`
      }
      style={isDone ? pillDoneStyle : pillPendingStyle}
    >
      {isDone ? '\u2713 Ready to publish' : `${remainingCount} to review`}
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

const pillDoneStyle: React.CSSProperties = {
  ...pillBase,
  background: '#ecfdf5',
  borderColor: '#a7f3d0',
  color: '#065f46',
  cursor: 'default',
};
