'use client';

// Lumen client-type strip (edit). A mono label + a divider + a row of client-type
// chips. Consumes: label (string) + brands[{id,name}] collection. Bilingual twins
// (label_nl, name_nl) routed by the active edit-language.

import React from 'react';
import { useLumenBlock } from '../../hooks/useLumenBlock';
import { LumenEditable } from '../../components/LumenEditable';
import { langKey } from '../../i18nKeys';
import { CLIENTS_STYLES } from './styles';

interface Brand { id: string; name?: string; name_nl?: string; }
interface LumenLogosContent { label: string; label_nl: string; brands: Brand[]; }

export default function LumenLogos({ sectionId }: { sectionId: string }) {
  const { mode, blockContent, editLang, handleContentUpdate, handleCollectionUpdate } =
    useLumenBlock<LumenLogosContent>({ sectionId });

  const brands = blockContent.brands || [];
  const edit = mode === 'edit';

  const updateItem = (id: string, key: string, value: string) =>
    handleCollectionUpdate('brands', brands.map((b) => (b.id === id ? { ...b, [key]: value } : b)));
  const addItem = () => {
    if (brands.length >= 8) return;
    handleCollectionUpdate('brands', [...brands, { id: `b${Date.now()}`, name: 'Client type', name_nl: '' }]);
  };
  const removeItem = (id: string) => {
    if (brands.length <= 2) return;
    handleCollectionUpdate('brands', brands.filter((b) => b.id !== id));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CLIENTS_STYLES }} />
      <div className="lm-clients-in" data-section-id={sectionId}>
        <LumenEditable
          as="span" mode={mode} sectionId={sectionId} editLang={editLang}
          content={blockContent} elementKey="label" onSave={handleContentUpdate}
          enterBehavior="save" className="lm-clients-lbl" placeholder="Trusted by teams across the region"
        />
        <div className="lm-clients-div" aria-hidden="true" />
        <div className="lm-clients-row">
          {brands.map((b) => (
            <span key={b.id} className="lm-client-chip">
              <LumenEditable
                as="span" mode={mode} sectionId={sectionId} editLang={editLang}
                content={b} elementKey="name"
                onSave={(key, v) => updateItem(b.id, key, v)}
                enterBehavior="save" placeholder="Client type"
              />
              {edit && brands.length > 2 && (
                <button type="button" className="lm-client-rm" onClick={() => removeItem(b.id)} aria-label="Remove">×</button>
              )}
            </span>
          ))}
          {edit && brands.length < 8 && (
            <button type="button" className="lm-client-add" onClick={addItem}>+ Add</button>
          )}
        </div>
      </div>
    </>
  );
}
