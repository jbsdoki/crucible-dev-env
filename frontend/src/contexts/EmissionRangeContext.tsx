/*##########################################################################################################
This context is used to share the selected range between the SpectrumViewer and SpectrumToImage components.
The range includes both the indices (for API calls) and energy values (for display).

The data only flows one way:
- EmissionLineAnalysis -> EmissionRangeContext -> SpectrumViewer
##########################################################################################################*/


import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface EmissionRange {
  lineName: string;
  energy: number;
  start: number;
  end: number;
  color: string;
}

interface DisplayState {
  spectrum: EmissionRange[];
  map: EmissionRange[];
}

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

export const EmissionRangeContext = createContext<EmissionRangeContextType>(defaultContext);

export function useEmissionRange() {
  const context = useContext(EmissionRangeContext);
  if (!context) {
    throw new Error('useEmissionRange must be used within an EmissionRangeProvider');
  }
  return context;
}

interface EmissionRangeProviderProps {
  children: ReactNode;
}

export function EmissionRangeProvider({ children }: EmissionRangeProviderProps) {
  const [displayState, setDisplayState] = useState<DisplayState>({
    spectrum: [],
    map: []
  });

  const addToSpectrum = (range: EmissionRange) => {
    setDisplayState(prev => ({
      ...prev,
      spectrum: [...prev.spectrum.filter(r => r.lineName !== range.lineName), range]
    }));
  };

  const removeFromSpectrum = (lineName: string) => {
    setDisplayState(prev => ({
      ...prev,
      spectrum: prev.spectrum.filter(range => range.lineName !== lineName)
    }));
  };

  const addToMap = (range: EmissionRange) => {
    setDisplayState(prev => ({
      ...prev,
      map: [...prev.map.filter(r => r.lineName !== range.lineName), range]
    }));
  };

  const removeFromMap = (lineName: string) => {
    setDisplayState(prev => ({
      ...prev,
      map: prev.map.filter(range => range.lineName !== lineName)
    }));
  };

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
