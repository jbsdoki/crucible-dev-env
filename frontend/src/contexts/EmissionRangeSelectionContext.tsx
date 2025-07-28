/*##########################################################################################################
This context is used to share the selected range between the SpectrumViewer and SpectrumToImage components.
The range includes both the indices (for API calls) and energy values (for display).

The data only flows one way:
- EmissionLineAnalysis -> EmissionRangeContext -> SpectrumViewer
##########################################################################################################*/

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Interface for a single emission line range
interface EmissionRange {
  lineName: string;      // Name of the emission line (e.g., "ka1")
  energy: number;        // Center energy of the line
  start: number;         // Start of range in keV
  end: number;          // End of range in keV
  color?: string;       // Optional color for display
}

// Interface for managing display state
interface DisplayState {
  spectrum: EmissionRange[];  // Ranges to display on spectrum
  map: EmissionRange[];      // Ranges to display on 2D map
}

// Interface for the context value
interface EmissionRangeContextType {
  // State
  displayState: DisplayState;
  
  // Actions
  addToSpectrum: (range: EmissionRange) => void;
  removeFromSpectrum: (lineName: string) => void;
  addToMap: (range: EmissionRange) => void;
  removeFromMap: (lineName: string) => void;
  clearAll: () => void;
}

// Default context value
const defaultContext: EmissionRangeContextType = {
  displayState: {
    spectrum: [],
    map: []
  },
  addToSpectrum: () => {},
  removeFromSpectrum: () => {},
  addToMap: () => {},
  removeFromMap: () => {},
  clearAll: () => {}
};

// Create the context
export const EmissionRangeContext = createContext<EmissionRangeContextType>(defaultContext);

// Custom hook for using the context
export function useEmissionRange() {
  const context = useContext(EmissionRangeContext);
  if (!context) {
    throw new Error('useEmissionRange must be used within an EmissionRangeProvider');
  }
  return context;
}

// Provider component props
interface EmissionRangeProviderProps {
  children: ReactNode;
}

// Provider component
export function EmissionRangeProvider({ children }: EmissionRangeProviderProps) {
  const [displayState, setDisplayState] = useState<DisplayState>({
    spectrum: [],
    map: []
  });

  // Add a range to spectrum display
  const addToSpectrum = (range: EmissionRange) => {
    setDisplayState(prev => ({
      ...prev,
      spectrum: [...prev.spectrum.filter(r => r.lineName !== range.lineName), range]
    }));
  };

  // Remove a range from spectrum display
  const removeFromSpectrum = (lineName: string) => {
    setDisplayState(prev => ({
      ...prev,
      spectrum: prev.spectrum.filter(range => range.lineName !== lineName)
    }));
  };

  // Add a range to map display
  const addToMap = (range: EmissionRange) => {
    setDisplayState(prev => ({
      ...prev,
      map: [...prev.map.filter(r => r.lineName !== range.lineName), range]
    }));
  };

  // Remove a range from map display
  const removeFromMap = (lineName: string) => {
    setDisplayState(prev => ({
      ...prev,
      map: prev.map.filter(range => range.lineName !== lineName)
    }));
  };

  // Clear all ranges
  const clearAll = () => {
    setDisplayState({
      spectrum: [],
      map: []
    });
  };

  const value = {
    displayState,
    addToSpectrum,
    removeFromSpectrum,
    addToMap,
    removeFromMap,
    clearAll
  };

  return (
    <EmissionRangeContext.Provider value={value}>
      {children}
    </EmissionRangeContext.Provider>
  );
}

