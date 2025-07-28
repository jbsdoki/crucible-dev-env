/*##########################################################################################################
This context is used to share multiple emission line ranges between the EmissionLineAnalysis and EmissionLineRangeVisualizer components.
The ranges include both the indices (for API calls) and energy values (for display).

The data only flows one way:
- EmissionLineAnalysis -> EmissionRangeToImageContext -> EmissionLineRangeVisualizer
##########################################################################################################*/

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Interface for a single emission range item in the collection
 * Simple approach: IDs are just numbers 1-10
 */
interface EmissionRangeItem {
  id: number;                               // Simple ID: 1, 2, 3, ... 10
  indices: { start: number; end: number };  // Indices for API calls
  energy: { start: number; end: number };   // Energy values for display
  lineName: string;                         // e.g., "ka1", "ka2", "kb1"
  element: string;                          // e.g., "Fe", "Cu", "Au"
}

/**
 * Interface defining the shape of our emission range context value
 */
interface EmissionRangeToImageContextValue {
  // Multi-range collection (max 10 ranges, stored as Record for easy lookup)
  ranges: Record<number, EmissionRangeItem>;        // e.g., { 1: EmissionRangeItem, 3: EmissionRangeItem, 7: EmissionRangeItem }
  displayedRangeId: number | null;                  // Currently displayed range ID (1-10)
  
  // Range management functions
  addRange: (range: Omit<EmissionRangeItem, 'id'>) => number | null; // Returns the new range ID or null if full
  removeRange: (rangeId: number) => void;
  setDisplayedRange: (rangeId: number | null) => void;
  
  // File and signal context (unchanged)
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
 * Find the next available slot (1-10)
 */
function findNextAvailableSlot(ranges: Record<number, EmissionRangeItem>): number | null {
  for (let i = 1; i <= 10; i++) {
    if (!ranges[i]) {
      return i;
    }
  }
  return null; // All slots full
}

/**
 * Provider component that wraps parts of the app that need access to the emission range context
 */
export function EmissionRangeToImageProvider({ children }: { children: ReactNode }) {
  const [ranges, setRanges] = useState<Record<number, EmissionRangeItem>>({});
  const [displayedRangeId, setDisplayedRangeId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [signalIndex, setSignalIndex] = useState<number | null>(null);

  /**
   * Add a new emission range to the collection (max 10 ranges)
   * Returns the ID of the newly created range or null if no slots available
   */
  const addRange = (range: Omit<EmissionRangeItem, 'id'>): number | null => {
    const nextId = findNextAvailableSlot(ranges);
    
    if (nextId === null) {
      console.warn('Cannot add more than 10 emission ranges - all slots full');
      return null;
    }

    const newRange: EmissionRangeItem = {
      ...range,
      id: nextId,
    };

    setRanges(prev => ({
      ...prev,
      [nextId]: newRange
    }));
    
    console.log(`Added new emission range in slot ${nextId}:`, newRange);
    return nextId;
  };

  /**
   * Remove an emission range from the collection by ID
   */
  const removeRange = (rangeId: number) => {
    setRanges(prev => {
      const newRanges = { ...prev };
      delete newRanges[rangeId];
      return newRanges;
    });

    // Clear displayed range if it was the one being removed
    if (displayedRangeId === rangeId) {
      setDisplayedRangeId(null);
    }
    
    console.log(`Removed emission range ${rangeId}`);
  };

  /**
   * Set which emission range should be displayed in the visualizer
   */
  const setDisplayedRange = (rangeId: number | null) => {
    setDisplayedRangeId(rangeId);
    console.log('Set displayed emission range:', rangeId);
  };

  const value = {
    ranges,
    displayedRangeId,
    addRange,
    removeRange,
    setDisplayedRange,
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

// Export the EmissionRangeItem type for use in other components
export type { EmissionRangeItem };
