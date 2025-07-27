/*##########################################################################################################
This context is used to share the selected range between the SpectrumViewer and SpectrumToImage components.
The range includes both the indices (for API calls) and energy values (for display).

The data only flows one way:
- SpectrumViewer -> SpectrumRangeContext -> SpectrumToImage
##########################################################################################################*/

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';


/**
 * Interface defining the shape of our context value
 */
interface SpectrumContextValue {
  selectedRange: {
    indices: { start: number; end: number };
    energy: { start: number; end: number };
  } | null;
  setSelectedRange: (range: {
    indices: { start: number; end: number };
    energy: { start: number; end: number };
  } | null) => void;
  selectedFile: string | null;
  setSelectedFile: (file: string | null) => void;
  signalIndex: number | null;
  setSignalIndex: (index: number | null) => void;
}

/**
 * Create the context with a default value
 */
const SpectrumContext = createContext<SpectrumContextValue | undefined>(undefined);

/**
 * Provider component that wraps parts of the app that need access to the context
 */
export function SpectrumProvider({ children }: { children: ReactNode }) {
  const [selectedRange, setSelectedRange] = useState<{
    indices: { start: number; end: number };
    energy: { start: number; end: number };
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [signalIndex, setSignalIndex] = useState<number | null>(null);

  const value = {
    selectedRange,
    setSelectedRange,
    selectedFile,
    setSelectedFile,
    signalIndex,
    setSignalIndex,
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
