'use client';

// Surge logo strip (edit). A mono label + text wordmarks. Surge-only delta block.
// Consumes: label (string), logos[{id,name}] collection.

import React from 'react';
import { useServiceBlock } from '../../hooks/useServiceBlock';
import { SurgeEditable } from '../../components/SurgeEditable';
import { LOGOS_STYLES } from './styles';

interface LogoItem {
  id: string;
  name: string;
}

interface LogoStripContent {
  label: string;
  logos: LogoItem[];
}

interface LogoStripProps {
  sectionId: string;
}

export default function LogoStrip({ sectionId }: LogoStripProps) {
  const { mode, blockContent, handleContentUpdate, handleCollectionUpdate } =
    useServiceBlock<LogoStripContent>({ sectionId });

  const logos = blockContent.logos || [];

  const updateName = (id: string, value: string) => {
    handleCollectionUpdate('logos', logos.map((l) => (l.id === id ? { ...l, name: value } : l)));
  };

  const addLogo = () => {
    if (logos.length >= 8) return;
    handleCollectionUpdate('logos', [...logos, { id: `l${Date.now()}`, name: 'Client' }]);
  };

  const removeLogo = (id: string) => {
    if (logos.length <= 2) return;
    handleCollectionUpdate('logos', logos.filter((l) => l.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LOGOS_STYLES }} />
      <div className="sg-logos" data-section-id={sectionId}>
        {(blockContent.label || mode === 'edit') && (
          <SurgeEditable
            as="span"
            mode={mode}
            sectionId={sectionId}
            elementKey="label"
            value={blockContent.label}
            onSave={(v) => handleContentUpdate('label', v)}
            enterBehavior="save"
            className="sg-logos__ll"
            placeholder="Trusted by founders at"
          />
        )}
        {logos.map((l) => (
          <span key={l.id} className="sg-logos__item">
            <SurgeEditable
              as="span"
              mode={mode}
              sectionId={sectionId}
              elementKey={`logos_name_${l.id}`}
              value={l.name}
              onSave={(v) => updateName(l.id, v)}
              enterBehavior="save"
              className="sg-logos__logo"
              placeholder="Client"
            />
            {mode === 'edit' && logos.length > 2 && (
              <button
                type="button"
                className="sg-logos__remove"
                onClick={() => removeLogo(l.id)}
                aria-label="Remove logo"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {mode === 'edit' && logos.length < 8 && (
          <button type="button" className="sg-logos__add" onClick={addLogo}>
            + Add logo
          </button>
        )}
      </div>
    </>
  );
}
