import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * The SpectrumContext manages global state for spectrum visualization.
 * 
 * Note on FWHM Index Management:
 * While SpectrumData (from types.ts) includes fwhm_index, the context maintains its own fwhm_index state.
 * This separation allows:
 * 1. Dynamic updates to FWHM visualization without modifying the source data
 * 2. Independent control over FWHM display across different spectrum views
 * 3. Persistence of FWHM selection even when spectrum data changes
 * 
 * The context's fwhm_index should be initialized from SpectrumData.fwhm_index when:
 * - New spectrum data is loaded
 * - The user switches to a different spectrum
 * - The application needs to reset to the default FWHM point
 * 
 * 
 * This context is used to share the tool bar current settings (Selected or unselected)
 * Between the Toolbar and the Plot. This tells the SpectrumViewer how to display information
 * to plotly.
 */

// Define the shape of our context value
interface SpectrumContextValue {
  // X axis FWHM index - This can differ from SpectrumData.fwhm_index as it represents
  // the currently active/displayed FWHM point rather than the data's default FWHM
  fwhm_index: number | null;
  setFwhmIndex: (index: number | null) => void;
  // Y axis log scale state
  isLogScale: boolean;
  setIsLogScale: (value: boolean) => void;
  // FWHM visibility state
  showFWHM: boolean;
  setShowFWHM: (value: boolean) => void;
  // Plot interaction mode
  isZoomMode: boolean;
  setIsZoomMode: (value: boolean) => void;
  // Region spectrum visibility
  showRegion: boolean;
  setShowRegion: (value: boolean) => void;
  // Emission lines visibility
  showEmissionLines: boolean;
  setShowEmissionLines: (value: boolean) => void;
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
  const [showFWHM, setShowFWHM] = useState<boolean>(false);
  const [isZoomMode, setIsZoomMode] = useState<boolean>(true);
  const [showRegion, setShowRegion] = useState<boolean>(true);
  const [showEmissionLines, setShowEmissionLines] = useState<boolean>(true); // Default to true

  const value: SpectrumContextValue = {
    fwhm_index,
    setFwhmIndex,
    isLogScale,
    setIsLogScale,
    showFWHM,
    setShowFWHM,
    isZoomMode,
    setIsZoomMode,
    showRegion,
    setShowRegion,
    showEmissionLines,
    setShowEmissionLines
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