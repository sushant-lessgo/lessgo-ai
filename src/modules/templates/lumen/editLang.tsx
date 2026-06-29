'use client';

// src/modules/templates/lumen/editLang.tsx
// Lumen-scoped EDIT-LANGUAGE context. The header EN·NL toggle sets `editLang`;
// LumenEditable reads it to route reads/writes to `key` (en) or `key_nl` (nl),
// so the founder authors BOTH languages inline — one at a time — with no shared
// store/persistence change. Default 'en'. Published renderer never mounts this
// provider (defaults to 'en' via the hook fallback); the language swap there is
// done client-side by lumen.v1.js against the emitted data-en / data-nl attrs.

import { createContext, useContext, type ReactNode } from 'react';
import { langKey, type LumenLang } from './i18nKeys';

export type LumenEditLang = LumenLang;
export { langKey };

export interface LumenEditLangValue {
  editLang: LumenEditLang;
  setEditLang: (lang: LumenEditLang) => void;
}

const LumenEditLangContext = createContext<LumenEditLangValue>({
  editLang: 'en',
  setEditLang: () => {},
});

export function LumenEditLangProvider({
  value,
  children,
}: {
  value: LumenEditLangValue;
  children: ReactNode;
}) {
  return <LumenEditLangContext.Provider value={value}>{children}</LumenEditLangContext.Provider>;
}

export function useLumenEditLang(): LumenEditLangValue {
  return useContext(LumenEditLangContext);
}
