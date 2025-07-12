import { Box, Typography } from '@mui/material';
import SpectrumViewerRoot from './SpectrumViewer/SpectrumViewerRoot';
import type { SignalInfo } from './SpectrumViewer/types';

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
  onRangeSelect?: (range: {start: number, end: number} | null) => void;
  isSelectingRange: boolean;
}

/**
 * SpectrumViewer Component
 * 
 * This is now a wrapper component that uses the refactored SpectrumViewerRoot.
 * All core functionality has been moved to the SpectrumViewer directory components.
 * 
 * @param props - See SpectrumViewerProps interface for details
 */
function SpectrumViewer(props: SpectrumViewerProps) {
  return <SpectrumViewerRoot {...props} />;
}

export default SpectrumViewer; 