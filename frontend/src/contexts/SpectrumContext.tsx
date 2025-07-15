import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Interface defining the shape of our context value
 * minimal state - just a selected range
 */
interface SpectrumContextValue {
  selectedRange: { start: number; end: number } | null;
  setSelectedRange: (range: { start: number; end: number } | null) => void;
}

/**
 * Create the context with a default value
 */
const SpectrumContext = createContext<SpectrumContextValue | undefined>(undefined);

/**
 * Provider component that wraps parts of the app that need access to the context
 */
export function SpectrumProvider({ children }: { children: ReactNode }) {
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);

  const value = {
    selectedRange,
    setSelectedRange,
  };

  return (
    <SpectrumContext.Provider value={value}>
      {children}
    </SpectrumContext.Provider>
  );
}

/**
 * Custom hook to use the spectrum context
 * Throws an error if used outside of SpectrumProvider
 */
export function useSpectrumContext() {
  const context = useContext(SpectrumContext);
  if (context === undefined) {
    throw new Error('useSpectrumContext must be used within a SpectrumProvider');
  }
  return context;
}
