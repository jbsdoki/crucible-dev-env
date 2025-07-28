import { useState, useEffect } from 'react';
import { getSpectrum } from '../../../services/api';
import { useSpectrumContext } from '../contexts/SpectrumViewerContext';
import type { SignalInfo, SpectrumData } from '../types';

interface UseSpectrumDataResult {
  spectrumData: SpectrumData | null;
  error: string;
  loading: boolean;
}

/**
 * Custom hook that manages spectrum data fetching and state
 * 
 * Data Flow Architecture:
 * ---------------------
 * 1. Main Spectrum Data:
 *    - Fetched from API based on selectedFile and selectedSignal
 *    - Represents the primary spectrum visualization
 *    - Managed entirely within this hook
 * 
 * 2. Region Spectrum Data:
 *    - Passed as prop from parent (typically from image viewer selections)
 *    - Represents a subset or related spectrum data
 *    - Visibility controlled by SpectrumContext.showRegion
 *    - NOT managed by this hook - see SpectrumViewerRoot for region handling
 * 
 * State Management:
 * ---------------
 * - Loading/Error states only apply to main spectrum data
 * - FWHM index is managed in SpectrumContext for persistence
 * - Region data visibility is toggled via SpectrumContext.showRegion
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
        return;
      }

      // Check if signal can be displayed as spectrum
      if (!selectedSignal.capabilities.hasSpectrum) {
        console.log('useSpectrumData: Signal cannot be displayed as spectrum');
        setError('Selected signal cannot be displayed as a spectrum');
        setSpectrumData(null);
        return;
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
      setFwhmIndex(null);
    };
  }, [selectedFile, selectedSignal, setFwhmIndex]);

  return { spectrumData, error, loading };
} 