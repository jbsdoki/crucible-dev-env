import { SpectrumProvider } from './contexts/SpectrumContext';
import type { SignalInfo } from './types';
import SpectrumRangeImage from './components/SpectrumRangeImage';
import SpectrumToolbar from './components/SpectrumToolbar';
import SpectrumPlot from './components/SpectrumPlot';
import { useSpectrumData } from './hooks/useSpectrumData';
import { useSpectrumSelection } from './hooks/useSpectrumSelection';
import { useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Props shared by both Root and Inner components
 * 
 * Data Flow:
 * ---------
 * 1. selectedFile & selectedSignal:
 *    - Used by useSpectrumData hook to fetch main spectrum data
 *    - Changes trigger new data fetches
 * 
 * 2. regionSpectrumData:
 *    - Optional data from parent (typically image viewer)
 *    - Independent from main spectrum data
 *    - Visibility controlled by SpectrumContext.showRegion
 *    - Used for overlay/comparison with main spectrum
 * 
 * 3. selectedRegion:
 *    - Optional region coordinates from parent
 *    - Used to highlight corresponding area in spectrum
 */
interface SpectrumViewerProps {
  selectedFile: string;
  selectedSignal: SignalInfo;
  regionSpectrumData?: {
    x: number[];
    y: number[];
    x_label: string;
    x_units: string;
    y_label: string;
    zero_index: number | null;
    fwhm_index: number | null;
  } | null;
  selectedRegion?: {x1: number, y1: number, x2: number, y2: number} | null;
}

/**
 * Inner component that uses the hooks and renders the UI
 * This component is wrapped by SpectrumProvider in the root component
 * 
 * Component Responsibilities:
 * ------------------------
 * 1. Fetch and manage main spectrum data via useSpectrumData
 * 2. Handle range selection via useSpectrumSelection
 * 3. Coordinate data display between main and region spectra
 * 4. Manage loading and error states
 */
function SpectrumViewerInner(props: SpectrumViewerProps) {
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  
  // Fetch main spectrum data
  const { spectrumData, error, loading } = useSpectrumData(
    props.selectedFile,
    props.selectedSignal
  );
  
  // Handle range selection for the main spectrum
  const { selectedRange, handleSelection } = useSpectrumSelection(
    spectrumData,
    isSelectingRange,
    undefined
  );

  console.log('SpectrumViewer: Rendering with:', {
    selectedFile: props.selectedFile,
    signalTitle: props.selectedSignal.title,
    selectedRange,
    hasRegionData: !!props.regionSpectrumData,
    isSelectingRange
  });

  const handleSelectionModeChange = (isSelecting: boolean) => {
    console.log('SpectrumViewer: Selection mode changed to:', isSelecting);
    setIsSelectingRange(isSelecting);
    if (!isSelecting) {
      console.log('SpectrumViewer: Clearing selected range');
    }
  };

  // Loading and error states
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!spectrumData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No spectrum data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Toolbar Row - Controls for both main and region spectra */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        width: '100%',
        mb: 2
      }}>
        <SpectrumToolbar 
          regionSpectrumData={props.regionSpectrumData}
          onSelectionModeChange={handleSelectionModeChange}
          isSelectingRange={isSelectingRange}
        />
      </Box>
      
      {/* Spectrum Plot Row - Displays both main and region spectra */}
      <Box sx={{ width: '100%', mb: 2 }}>
        <SpectrumPlot
          spectrumData={spectrumData}
          selectedSignal={props.selectedSignal}
          regionSpectrumData={props.regionSpectrumData}
          selectedRange={selectedRange}
          isSelectingRange={isSelectingRange}
          onSelected={handleSelection}
          onRelayout={() => {}}
        />
      </Box>
      
      {/* Range Image Row - Shows visual representation of selected range */}
      <Box sx={{ width: '100%' }}>
        <SpectrumRangeImage 
          selectedFile={props.selectedFile}
          signalIndex={props.selectedSignal.index}
          selectedRange={selectedRange}
        />
      </Box>
    </Box>
  );
}

/**
 * Root component that provides the SpectrumContext
 * This is the main export that should be used by parent components
 * 
 * Component Architecture:
 * --------------------
 * 1. Provides SpectrumContext for:
 *    - FWHM index state
 *    - Region spectrum visibility
 *    - UI state (log scale, zoom mode)
 * 
 * 2. Delegates rendering to SpectrumViewerInner which:
 *    - Uses hooks for data fetching and selection
 *    - Manages component-level state
 *    - Renders the actual UI
 */
function SpectrumViewerRoot(props: SpectrumViewerProps) {
  return (
    <SpectrumProvider>
      <SpectrumViewerInner {...props} />
    </SpectrumProvider>
  );
}

export default SpectrumViewerRoot;
