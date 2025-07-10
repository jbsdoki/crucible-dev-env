import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Define the shape of our context value
interface SpectrumContextValue {
  fwhm_index: number | null;
  setFwhmIndex: (index: number | null) => void;
  isLogScale: boolean;
  setIsLogScale: (value: boolean) => void;
}

// Create the context with undefined as initial value
const SpectrumContext = createContext<SpectrumContextValue | undefined>(undefined);

// Props type for the provider component
interface SpectrumProviderProps {
  children: ReactNode;
}

// Provider component that manages state and makes it available to children
export function SpectrumProvider({ children }: SpectrumProviderProps) {
  const [fwhm_index, setFwhmIndex] = useState<number | null>(null);
  const [isLogScale, setIsLogScale] = useState<boolean>(false);

  const value: SpectrumContextValue = {
    fwhm_index,
    setFwhmIndex,
    isLogScale,
    setIsLogScale
  };

  return (
    <SpectrumContext.Provider value={value}>
      {children}
    </SpectrumContext.Provider>
  );
}

// Custom hook to access the spectrum context with type safety
export function useSpectrumContext() {
  const context = useContext(SpectrumContext);
  if (context === undefined) {
    throw new Error('useSpectrumContext must be used within a SpectrumProvider');
  }
  return context;
} 