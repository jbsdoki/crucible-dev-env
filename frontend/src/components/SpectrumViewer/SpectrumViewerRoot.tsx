import { SpectrumProvider } from './contexts/SpectrumContext';
import SpectrumViewer from '../SpectrumViewer';
import type { SignalInfo } from '../SpectrumViewer';
import SpectrumRangeImage from './components/SpectrumRangeImage';
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

  // Log when range changes
  const handleRangeSelect = (range: {start: number, end: number} | null) => {
    console.log('SpectrumViewerRoot: Range selection changed:', range);
    setSelectedRange(range);
  };

  console.log('SpectrumViewerRoot: Rendering with range:', selectedRange);

  return (
    <SpectrumProvider>
      <SpectrumViewer {...props} onRangeSelect={handleRangeSelect} />
      <SpectrumRangeImage 
        selectedFile={props.selectedFile}
        signalIndex={props.selectedSignal.index}
        selectedRange={selectedRange}
      />
    </SpectrumProvider>
  );
}

export default SpectrumViewerRoot;
