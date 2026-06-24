// Server-safe published variant of the Surge logo strip. No hooks, flat props.

import React from 'react';
import { LOGOS_STYLES } from './styles';

interface LogoItem {
  id?: string;
  name?: string;
}

interface LogoStripPublishedProps {
  sectionId: string;
  label?: string;
  logos?: LogoItem[];
}

export default function LogoStripPublished(props: LogoStripPublishedProps) {
  const logos = Array.isArray(props.logos) ? props.logos : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LOGOS_STYLES }} />
      <div className="sg-logos">
        {props.label && <span className="sg-logos__ll">{props.label}</span>}
        {logos.map((l, idx) => (
          <span key={l.id || idx} className="sg-logos__logo">{l.name || ''}</span>
        ))}
      </div>
    </>
  );
}
