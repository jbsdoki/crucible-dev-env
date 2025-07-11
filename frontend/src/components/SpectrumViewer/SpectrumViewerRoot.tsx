import { SpectrumProvider } from './contexts/SpectrumContext';
import SpectrumViewer from '../SpectrumViewer';
import type { SignalInfo } from '../SpectrumViewer';
import SpectrumRangeImage from './components/SpectrumRangeImage';
import SpectrumToolbar from './components/SpectrumToolbar';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/**
 * SpectrumViewerRoot Component
 * 
 * This is a wrapper component that provides the SpectrumContext to the SpectrumViewer
 * and its child components. It handles the same props as SpectrumViewer but ensures
 * the context is properly provided.
 * 
 * @param props - Same props as SpectrumViewer
 * @returns SpectrumViewer wrapped with SpectrumProvider
 */
interface SpectrumViewerRootProps {
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

function SpectrumViewerRoot(props: SpectrumViewerRootProps) {
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number} | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  console.log('SpectrumViewerRoot: Rendering with:', {
    selectedFile: props.selectedFile,
    signalTitle: props.selectedSignal.title,
    selectedRange,
    hasRegionData: !!props.regionSpectrumData,
    isSelectingRange
  });

  const handleSelectionModeChange = (isSelecting: boolean) => {
    console.log('SpectrumViewerRoot: Selection mode changed to:', isSelecting);
    setIsSelectingRange(isSelecting);
    if (!isSelecting) {
      console.log('SpectrumViewerRoot: Clearing selected range');
      setSelectedRange(null);
    }
  };

  // Log when range changes
  const handleRangeSelect = (range: {start: number, end: number} | null) => {
    console.log('SpectrumViewerRoot: Range selection changed:', range);
    setSelectedRange(range);
  };

  return (
    <SpectrumProvider>
      <SpectrumToolbar 
        regionSpectrumData={props.regionSpectrumData}
        onSelectionModeChange={handleSelectionModeChange}
        isSelectingRange={isSelectingRange}
      />
      <SpectrumViewer 
        {...props} 
        onRangeSelect={handleRangeSelect}
        isSelectingRange={isSelectingRange}
      />
      <SpectrumRangeImage 
        selectedFile={props.selectedFile}
        signalIndex={props.selectedSignal.index}
        selectedRange={selectedRange}
      />
    </SpectrumProvider>
  );
}

export default SpectrumViewerRoot;
