import React from 'react';

// Callout Component
interface CalloutProps {
  type?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
  children: React.ReactNode;
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌',
  };

  return (
    <div className={`border-l-4 p-4 my-6 rounded-r ${styles[type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{icons[type]}</span>
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Code Block Component with Copy Button
interface CodeBlockProps {
  children: string;
  className?: string;
  title?: string;
}

export function CodeBlock({ children, className, title }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = className?.replace('language-', '') || 'text';

  return (
    <div className="relative group my-6">
      {title && (
        <div className="bg-gray-800 text-gray-200 text-sm px-4 py-2 rounded-t font-mono">
          {title}
        </div>
      )}
      <div className="relative">
        <pre className={`${title ? 'rounded-t-none' : ''} overflow-x-auto`}>
          <code className={className}>{children}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Copy code"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="bg-gray-800 text-gray-400 text-xs px-4 py-1 rounded-b font-mono">
        {language}
      </div>
    </div>
  );
}

// Quote Component
export function Quote({ children, author }: { children: React.ReactNode; author?: string }) {
  return (
    <blockquote className="border-l-4 border-brand-logo pl-6 py-2 my-6 italic text-gray-700">
      <div className="text-lg">{children}</div>
      {author && <cite className="block mt-2 text-sm text-gray-600 not-italic">— {author}</cite>}
    </blockquote>
  );
}

// Stats/Metrics Component
export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="inline-flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200 m-2">
      <div className="text-4xl font-bold text-brand-logo">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

// Button/CTA Component
export function CTAButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a
      href={href}
      className="inline-block px-6 py-3 bg-brand-accentPrimary hover:bg-opacity-90 text-white font-semibold rounded-lg transition-all hover:scale-105 my-4"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

// Default MDX Components mapping
export const mdxComponents = {
  Callout,
  CodeBlock,
  Quote,
  Metric,
  CTAButton,
};