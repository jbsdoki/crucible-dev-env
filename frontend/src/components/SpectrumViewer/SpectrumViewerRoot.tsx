import { SpectrumProvider } from './contexts/SpectrumContext';
import SpectrumViewer from '../SpectrumViewer';
import type { SignalInfo } from '../SpectrumViewer';
// import { FWHMDisplay } from './components/FWHMDisplay';

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
  return (
    <SpectrumProvider>
      {/* Test component to verify context values */}
      {/* <FWHMDisplay /> */}
      <SpectrumViewer {...props} />
    </SpectrumProvider>
  );
}

export default SpectrumViewerRoot;
