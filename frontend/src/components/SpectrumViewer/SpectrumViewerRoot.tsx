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
 */
function SpectrumViewerInner(props: SpectrumViewerProps) {
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  
  // Use the hooks - now safely within SpectrumProvider context
  const { spectrumData, error, loading } = useSpectrumData(
    props.selectedFile,
    props.selectedSignal
  );
  
  const { selectedRange, handleSelection } = useSpectrumSelection(
    spectrumData,
    isSelectingRange,
    undefined // We'll handle range selection internally
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
      {/* Toolbar Row */}
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
      
      {/* Spectrum Plot Row */}
      <Box sx={{ width: '100%', mb: 2 }}>
        <SpectrumPlot
          spectrumData={spectrumData}
          selectedSignal={props.selectedSignal}
          regionSpectrumData={props.regionSpectrumData}
          selectedRange={selectedRange}
          isSelectingRange={isSelectingRange}
          onSelected={handleSelection}
          onRelayout={() => {}} // Empty handler since we don't use relayout anymore
        />
        </Box>
      
      {/* Range Image Row */}
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
 */
function SpectrumViewerRoot(props: SpectrumViewerProps) {
  return (
    <SpectrumProvider>
      <SpectrumViewerInner {...props} />
    </SpectrumProvider>
  );
}

export default SpectrumViewerRoot;
