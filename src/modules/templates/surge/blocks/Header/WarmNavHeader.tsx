'use client';

// Surge header (edit): brand-mark (↗) + nav links + primary CTA. Grid auto/1fr/auto.
// Consumes the shared service header contract.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { HEADER_STYLES } from './styles';

interface NavItem {
  id: string;
  label: string;
  href: string;
}

interface WarmNavHeaderContent {
  logo_text: string;
  cta_text: string;
  logo_image: string;
  nav_items: NavItem[];
}

interface WarmNavHeaderProps {
  sectionId: string;
}

export default function WarmNavHeader({ sectionId }: WarmNavHeaderProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useServiceBlock<WarmNavHeaderContent>({ sectionId });

  const navItems = blockContent.nav_items || [];

  const updateNavLabel = (id: string, label: string) => {
    handleCollectionUpdate(
      'nav_items',
      navItems.map((n) => (n.id === id ? { ...n, label } : n))
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HEADER_STYLES }} />
      <nav className="sg-nav" data-section-id={sectionId}>
        <div className="sg-brand">
          <span className="sg-brand__mark" />
          <SurgeEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="logo_text"
            value={blockContent.logo_text}
            onSave={(v) => handleContentUpdate('logo_text', v)}
            enterBehavior="save"
            placeholder="Studio name"
          />
        </div>
        <div className="sg-nav-mid">
          {navItems.map((item) => (
            <SurgeEditable
              key={item.id}
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey={`nav_items_label_${item.id}`}
              value={item.label}
              onSave={(v) => updateNavLabel(item.id, v)}
              enterBehavior="save"
              placeholder="Link"
            />
          ))}
        </div>
        <div className="sg-nav-right">
          <SurgeEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="cta_text"
            value={blockContent.cta_text}
            onSave={(v) => handleContentUpdate('cta_text', v)}
            enterBehavior="save"
            isButton
            className="sg-btn sg-btn--primary sg-btn--sm"
            placeholder="Book a growth audit"
          />
        </div>
      </nav>
    </>
  );
}
