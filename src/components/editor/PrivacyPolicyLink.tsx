'use client';

import React, { useEffect, useState } from 'react';

interface Props {
  editMode?: boolean;
  onEditClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function PrivacyPolicyLink({
  editMode,
  onEditClick,
  className,
  style,
  children,
}: Props) {
  // SSR placeholder. Corrected on hydration because usePathname() under
  // middleware rewrites is unreliable on subdomain/custom-domain views.
  const [href, setHref] = useState('/privacy');

  useEffect(() => {
    const p = window.location.pathname.replace(/\/$/, '');
    setHref(p ? `${p}/privacy` : '/privacy');
  }, []);

  const handleClick = editMode
    ? (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onEditClick?.();
      }
    : undefined;

  return (
    <a href={href} onClick={handleClick} className={className} style={style}>
      {children ?? 'Privacy Policy'}
    </a>
  );
}

export default PrivacyPolicyLink;
