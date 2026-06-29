// Server-safe published Lumen client-type strip. No hooks, flat props. Emits
// data-en/data-nl on every translatable node for the lumen.v1.js language toggle.

import React from 'react';
import { bilingualAttrs } from '../../i18nKeys';
import { CLIENTS_STYLES } from './styles';

interface Brand { id?: string; name?: string; name_nl?: string; }
interface Props { sectionId: string; label?: string; label_nl?: string; brands?: Brand[]; }

export default function LumenLogosPublished(props: Props) {
  const brands = Array.isArray(props.brands) ? props.brands : [];
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CLIENTS_STYLES }} />
      <div className="lm-clients-in">
        <span className="lm-clients-lbl" {...bilingualAttrs(props.label || '', props.label_nl || '')}>
          {props.label || ''}
        </span>
        <div className="lm-clients-div" aria-hidden="true" />
        <div className="lm-clients-row">
          {brands.map((b, i) => (
            <span key={b.id || i} className="lm-client-chip" {...bilingualAttrs(b.name || '', b.name_nl || '')}>
              {b.name || ''}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
