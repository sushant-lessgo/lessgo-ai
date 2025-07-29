// components/ui/SmartText.tsx - Text component that automatically uses smart colors
import React from 'react';

interface SmartTextProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  variant?: 'heading' | 'body' | 'muted';
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

/**
 * Smart text component that automatically uses contrast-validated colors
 * based on the section's background. Requires parent to have SmartTextSection wrapper.
 */
export function SmartText({ 
  children, 
  as: Component = 'p', 
  variant = 'body',
  className = '',
  style = {},
  ...props 
}: SmartTextProps) {
  const smartColorVar = `var(--smart-text-${variant})`;
  
  return (
    <Component
      className={className}
      style={{
        color: smartColorVar,
        ...style
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

// Convenience components
export const SmartHeading = (props: Omit<SmartTextProps, 'variant'> & { children: React.ReactNode }) => (
  <SmartText variant="heading" {...props} />
);

export const SmartBody = (props: Omit<SmartTextProps, 'variant'> & { children: React.ReactNode }) => (
  <SmartText variant="body" {...props} />
);

export const SmartMuted = (props: Omit<SmartTextProps, 'variant'> & { children: React.ReactNode }) => (
  <SmartText variant="muted" {...props} />
);