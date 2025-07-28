/*##########################################################################################################
This context is used to share the selected range between the SpectrumViewer and SpectrumToImage components.
The range includes both the indices (for API calls) and energy values (for display).

The data only flows one way:
- SpectrumViewer -> SpectrumRangeContext -> SpectrumToImage
##########################################################################################################*/

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Interface for a single range item in the collection
 */
interface RangeItem {
  id: number;                               // Simple ID: 1, 2, 3, ... 10
  indices: { start: number; end: number };  // Indices for API calls
  energy: { start: number; end: number };   // Energy values for display
}

/**
 * Interface defining the shape of our context value
 */
interface SpectrumContextValue {
  // Multi-range collection (max 10 ranges, stored as Record for easy lookup)
  ranges: Record<number, RangeItem>;        // e.g., { 1: RangeItem, 3: RangeItem, 7: RangeItem }
  displayedRangeId: number | null;          // Currently displayed range ID (1-10)
  
  // Range management functions
  addRange: (range: Omit<RangeItem, 'id'>) => number | null; // Returns the new range ID or null if full
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
const SpectrumContext = createContext<SpectrumContextValue | undefined>(undefined);

/**
 * Find the next available slot (1-10)
 */
function findNextAvailableSlot(ranges: Record<number, RangeItem>): number | null {
  for (let i = 1; i <= 10; i++) {
    if (!ranges[i]) {
      return i;
    }
  }
  return null; // All slots full
}

/**
 * Provider component that wraps parts of the app that need access to the context
 */
export function SpectrumProvider({ children }: { children: ReactNode }) {
  const [ranges, setRanges] = useState<Record<number, RangeItem>>({});
  const [displayedRangeId, setDisplayedRangeId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [signalIndex, setSignalIndex] = useState<number | null>(null);

  /**
   * Add a new range to the collection (max 10 ranges)
   * Returns the ID of the newly created range or null if no slots available
   */
  const addRange = (range: Omit<RangeItem, 'id'>): number | null => {
    const nextId = findNextAvailableSlot(ranges);
    
    if (nextId === null) {
      console.warn('Cannot add more than 10 ranges - all slots full');
      return null;
    }

    const newRange: RangeItem = {
      ...range,
      id: nextId,
    };

    setRanges(prev => ({
      ...prev,
      [nextId]: newRange
    }));
    
    console.log(`Added new range in slot ${nextId}:`, newRange);
    return nextId;
  };

  /**
   * Remove a range from the collection by ID
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
    
    console.log(`Removed range ${rangeId}`);
  };

  /**
   * Set which range should be displayed in the visualizer
   */
  const setDisplayedRange = (rangeId: number | null) => {
    setDisplayedRangeId(rangeId);
    console.log('Set displayed range:', rangeId);
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

// Export the RangeItem type for use in other components
export type { RangeItem };
