/*##########################################################################################################
This context is used to share the selected emission line range between the EmissionLineAnalysis and EmissionLineRangeVisualizer components.
The range includes both the indices (for API calls) and energy values (for display).

The data only flows one way:
- EmissionLineAnalysis -> EmissionRangeToImageContext -> EmissionLineRangeVisualizer
##########################################################################################################*/

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';


/**
 * Interface defining the shape of our emission range context value
 */
interface EmissionRangeToImageContextValue {
  selectedRange: {
    indices: { start: number; end: number };
    energy: { start: number; end: number };
    lineName?: string;    // e.g., "ka1", "ka2", "kb1"
    element?: string;     // e.g., "Fe", "Cu", "Au"
  } | null;
  setSelectedRange: (range: {
    indices: { start: number; end: number };
    energy: { start: number; end: number };
    lineName?: string;
    element?: string;
  } | null) => void;
  selectedFile: string | null;
  setSelectedFile: (file: string | null) => void;
  signalIndex: number | null;
  setSignalIndex: (index: number | null) => void;
}

/**
 * Create the context with a default value
 */
const EmissionRangeToImageContext = createContext<EmissionRangeToImageContextValue | undefined>(undefined);

/**
 * Provider component that wraps parts of the app that need access to the emission range context
 */
export function EmissionRangeToImageProvider({ children }: { children: ReactNode }) {
  const [selectedRange, setSelectedRange] = useState<{
    indices: { start: number; end: number };
    energy: { start: number; end: number };
    lineName?: string;
    element?: string;
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
    <EmissionRangeToImageContext.Provider value={value}>
      {children}
    </EmissionRangeToImageContext.Provider>
  );
}

/**
 * Custom hook to use the emission range to image context
 * Throws an error if used outside of EmissionRangeToImageProvider
 */
export function useEmissionRangeToImageContext() {
  const context = useContext(EmissionRangeToImageContext);
  if (context === undefined) {
    throw new Error('useEmissionRangeToImageContext must be used within an EmissionRangeToImageProvider');
  }
  return context;
}
