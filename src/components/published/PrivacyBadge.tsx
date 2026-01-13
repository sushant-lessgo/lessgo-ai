/**
 * Privacy badge shown in footer when analytics enabled.
 * Links to privacy policy explaining data collection.
 */

interface PrivacyBadgeProps {
  className?: string;
}

export function PrivacyBadge({ className = '' }: PrivacyBadgeProps) {
  return (
    <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm0-10a1 1 0 011 1v4a1 1 0 01-2 0V7a1 1 0 011-1zm0 8a1 1 0 100-2 1 1 0 000 2z"/>
      </svg>
      <span>
        Analytics enabled •{' '}
        <a
          href="https://lessgo.ai/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          Privacy policy
        </a>
      </span>
    </div>
  );
}
