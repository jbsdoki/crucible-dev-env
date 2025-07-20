import { useState, useCallback } from 'react';
import type { SpectrumData } from '../types';

interface UseSpectrumSelectionResult {
  selectedRange: { start: number; end: number } | null;
  handleSelection: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Custom hook that manages range selection within the 1D spectrum plot
 * 
 * This hook is responsible for:
 * 1. Managing the selected range state when a user drags to select a region on the 1D spectrum plot
 * 2. Processing Plotly selection events into data indices
 * 3. Handling the conversion between plot coordinates and data indices
 * 4. Notifying parent components of selection changes
 * 
 * Note: This hook specifically handles selections made on the 1D spectrum plot itself,
 * NOT selections made on the 2D image viewer. The image viewer selections are handled
 * separately through different mechanisms.
 * 
 * The hook maintains the selected range as indices into the spectrum data array,
 * rather than raw x-axis values. This makes it easier to slice the data array
 * for visualization and analysis.
 * 
 * The hook returns:
 * - selectedRange: Current selection range as indices, or null if no selection
 * - handleSelection: Event handler for Plotly selection events
 * 
 * @param spectrumData - The current spectrum data containing x and y values
 * @param isSelectingRange - Whether selection mode is active
 * @param onRangeSelect - Optional callback for when a range is selected
 * @returns Object containing selection state and handlers
 */
export function useSpectrumSelection(
  spectrumData: SpectrumData | null,
  isSelectingRange: boolean,
  onRangeSelect?: (range: { start: number; end: number } | null) => void
): UseSpectrumSelectionResult {
  // State for the currently selected range (as indices into the data array)
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);

  // Memoized selection handler to prevent unnecessary re-renders
  const handleSelection = useCallback((event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log('useSpectrumSelection: Selection event received:', {
      hasEvent: !!event,
      hasRange: !!event?.range,
      isSelectingRange,
      hasSpectrumData: !!spectrumData
    });

    // Early return if conditions aren't met
    if (!isSelectingRange || !event?.range?.x || !spectrumData) {
      console.log('useSpectrumSelection: Selection conditions not met, ignoring event');
      return;
    }

    // Extract x-range from the 2D selection
    const [start, end] = event.range.x;
    console.log('useSpectrumSelection: Raw selection range:', { start, end });

    // Find the closest x values in our data
    const xValues = spectrumData.x;
    const startIdx = xValues.findIndex(x => x >= Math.min(start, end));  // Handle left-to-right or right-to-left selection
    const endIdx = xValues.findIndex(x => x >= Math.max(start, end));
    
    // Log the conversion from x-values to indices
    console.log('useSpectrumSelection: Converting to indices:', {
      start_x: start,
      end_x: end,
      start_idx: startIdx,
      end_idx: endIdx,
      start_energy: xValues[startIdx],
      end_energy: xValues[endIdx]
    });
    
    // Create the range object with boundary checking
    const range = { 
      start: startIdx >= 0 ? startIdx : 0, 
      end: endIdx >= 0 ? endIdx : xValues.length - 1 
    };
    
    console.log('useSpectrumSelection: Setting new range:', range);
    
    // Update internal state
    setSelectedRange(range);

    // Notify parent component if callback provided
    if (onRangeSelect) {
      console.log('useSpectrumSelection: Notifying parent component of range change');
      onRangeSelect(range);
    }
  }, [isSelectingRange, spectrumData, onRangeSelect]); // Re-create handler when these dependencies change

  // Return current state and handlers
  return { selectedRange, handleSelection };
} 