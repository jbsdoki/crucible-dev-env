import { useState, useEffect } from 'react';
import { getSpectrum } from '../../../services/api';
import { useSpectrumContext } from '../contexts/SpectrumContext';
import type { SignalInfo, SpectrumData } from '../types';

interface UseSpectrumDataResult {
  spectrumData: SpectrumData | null;
  error: string;
  loading: boolean;
}

/**
 * Custom hook that manages spectrum data fetching and state
 * 
 * This hook is responsible for:
 * 1. Fetching spectrum data when selectedFile or selectedSignal changes
 * 2. Managing loading and error states during fetch
 * 3. Managing FWHM index state:
 *    - Clears FWHM when starting new data fetch
 *    - Sets new FWHM only when main spectrum data loads
 *    - Handles error cases by clearing FWHM
 * 4. Handling edge cases (missing data, invalid signal)
 * 
 * Note: FWHM state is managed independently from region spectrum data.
 * Region selections from the image viewer do not affect FWHM state.
 * This is so when the user selects a region on the 1d graph (spectrum viewer plot) or
 * the 2d image viewer, the FWHM line is not affected
 * 
 * The hook returns an object containing:
 * - spectrumData: The fetched spectrum data or null
 * - error: Any error message that occurred during fetch
 * - loading: Boolean indicating if data is being fetched
 * 
 * @param selectedFile - The file to fetch spectrum data from
 * @param selectedSignal - Information about the selected signal
 * @returns Object containing spectrum data, loading state, and error state
 */
export function useSpectrumData(
  selectedFile: string,
  selectedSignal: SignalInfo
): UseSpectrumDataResult {
  // State for spectrum data and UI feedback
  const [spectrumData, setSpectrumData] = useState<SpectrumData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Get the FWHM index setter from context
  const { setFwhmIndex } = useSpectrumContext();

  useEffect(() => {
    console.log('useSpectrumData: Dependencies changed, fetching new data:', {
      selectedFile,
      signalTitle: selectedSignal.title,
      signalIndex: selectedSignal.index
    });

    // Clear FWHM immediately when starting new data fetch
    setFwhmIndex(null);

    const fetchSpectrum = async () => {
      // Validate inputs
      if (!selectedFile || !selectedSignal) {
        console.log('useSpectrumData: Missing required data, clearing states');
        setSpectrumData(null);
        setError('');
        return; // FWHM already cleared above
      }

      // Check if signal can be displayed as spectrum
      if (!selectedSignal.capabilities.hasSpectrum) {
        console.log('useSpectrumData: Signal cannot be displayed as spectrum');
        setError('Selected signal cannot be displayed as a spectrum');
        setSpectrumData(null);
        return; // FWHM already cleared above
      }
      
      try {
        console.log('useSpectrumData: Starting data fetch');
        setLoading(true);
        setError('');
        
        // Fetch spectrum data from API
        const data = await getSpectrum(selectedFile, selectedSignal.index);
        console.log('useSpectrumData: Data fetched successfully:', {
          xLength: data.x.length,
          yLength: data.y.length,
          xLabel: data.x_label,
          yLabel: data.y_label,
          fwhmIndex: data.fwhm_index
        });

        // Update states with fetched data
        setSpectrumData(data);
        // Set new FWHM only after successful data fetch
        setFwhmIndex(data.fwhm_index);
      } catch (err) {
        console.error('useSpectrumData: Error fetching spectrum:', err);
        setError('Error fetching spectrum: ' + (err as Error).message);
        setSpectrumData(null);
        // FWHM already cleared at start of fetch
      } finally {
        console.log('useSpectrumData: Fetch operation completed');
        setLoading(false);
      }
    };

    // Execute the fetch operation
    fetchSpectrum();

    // Cleanup function for when component unmounts or dependencies change
    return () => {
      console.log('useSpectrumData: Cleaning up previous fetch operation');
      // Clear FWHM when cleaning up
      setFwhmIndex(null);
    };
  }, [selectedFile, selectedSignal, setFwhmIndex]); // Re-run when these dependencies change

  // Return current state
  return { spectrumData, error, loading };
} 