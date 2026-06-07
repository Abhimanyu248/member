import React, { createContext, useContext } from 'react';

/**
 * AppContext — shared state for the member app.
 * Consumed by all tab screens so they don't need props drilled through navigators.
 */
export const AppContext = createContext(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppContext.Provider');
  return ctx;
}
