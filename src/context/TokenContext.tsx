'use client';

import { createContext, useContext } from 'react';

const TokenContext = createContext<string | null>(null);

export const useTokenId = () => useContext(TokenContext);

export const TokenProvider = ({
  tokenId,
  children,
}: {
  tokenId: string;
  children: React.ReactNode;
}) => {
  return (
    <TokenContext.Provider value={tokenId}>
      {children}
    </TokenContext.Provider>
  );
};
