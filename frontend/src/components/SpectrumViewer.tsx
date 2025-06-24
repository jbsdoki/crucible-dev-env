import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { getSpectrum } from '../services/api';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Interface defining the structure of a single data point in the spectrum
 * Used by Recharts to plot the data
 */
interface SpectrumDataPoint {
  energy: number;
  intensity: number;
}

interface SignalCapabilities {
  hasSpectrum: boolean;
  hasImage: boolean;
}

interface SignalInfo {
  index: number;
  title: string;
  type: string;
  shape: number[];
  capabilities: SignalCapabilities;
}

interface SpectrumViewerProps {
  selectedFile: string;
  selectedSignal: SignalInfo;
}

/**
 * SpectrumViewer Component
 * 
 * This component handles the visualization of spectrum data from .emd files.
 * It can display:
 * - 1D signals directly as spectra
 * - Extracted spectra from 3D signals
 * 
 * The component checks the signal's capabilities before attempting to display.
 * 
 * Props:
 * @param selectedFile - Name of the currently selected file
 * @param selectedSignal - Information about the selected signal
 */
function SpectrumViewer({ selectedFile, selectedSignal }: SpectrumViewerProps) {
  console.log('=== Starting SpectrumViewer component ===');
  const [spectrumData, setSpectrumData] = useState<number[]>([]);  // Raw spectrum data
  const [error, setError] = useState<string>('');  // Error messages
  const [loading, setLoading] = useState<boolean>(false);  // Loading state

  /**
   * Fetch spectrum data when selectedFile or selectedSignal changes
   */
  useEffect(() => {
    const fetchSpectrum = async () => {
      console.log('=== Starting fetchSpectrum ===');
      if (!selectedFile || !selectedSignal) {
        setSpectrumData([]);
        setError('');
        console.log('=== Ending fetchSpectrum - no file or signal selected ===');
        return;
      }

      if (!selectedSignal.capabilities.hasSpectrum) {
        setError('Selected signal cannot be displayed as a spectrum');
        setSpectrumData([]);
        console.log('=== Ending fetchSpectrum - signal cannot be displayed as spectrum ===');
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching spectrum data for:', {
          file: selectedFile,
          signal: selectedSignal.title,
          type: selectedSignal.type,
          shape: selectedSignal.shape
        });
        
        const data = await getSpectrum(selectedFile, selectedSignal.index);
        
        if (!Array.isArray(data)) {
          console.log('=== Ending fetchSpectrum - invalid data format ===');
          throw new Error(`Expected array but received ${typeof data}`);
        }
        
        setSpectrumData(data);
        console.log('=== Ending fetchSpectrum successfully ===');
      } catch (err) {
        console.error('Error fetching spectrum:', err);
        setError('Error fetching spectrum: ' + (err as Error).message);
        setSpectrumData([]);
        console.log('=== Ending fetchSpectrum with error ===');
      } finally {
        setLoading(false);
      }
    };

    fetchSpectrum();
  }, [selectedFile, selectedSignal]);

  const result = (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {selectedSignal ? selectedSignal.title : 'Spectrum Viewer'}
      </Typography>
      
      {/* Error message display */}
      {error && (
        <Box sx={{ color: 'error.main', mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography>{error}</Typography>
        </Box>
      )}

      {/* Loading spinner */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No selection message */}
      {!loading && !error && (!selectedFile || !selectedSignal) && (
        <Typography>Select a file and signal to view spectrum</Typography>
      )}

      {/* Spectrum plot */}
      {!loading && !error && spectrumData.length > 0 && (
        <Plot
          data={[
            {
              x: Array.from({ length: spectrumData.length }, (_, i) => i),  // Energy values
              y: spectrumData,  // Count values
              type: 'scatter',
              mode: 'lines',
              name: 'Count',
              line: {
                color: '#1f77b4',
                width: 2
              }
            }
          ]}
          layout={{
            width: 800,
            height: 400,
            margin: { t: 10, r: 50, b: 50, l: 70 },
            showlegend: false,
            xaxis: {
              title: {
                text: 'Energy (eV)',
                standoff: 10
              },
              showgrid: true,
              gridcolor: '#e1e1e1',
              zeroline: false
            },
            yaxis: {
              title: {
                text: 'Count',
                standoff: 10
              },
              showgrid: true,
              gridcolor: '#e1e1e1',
              zeroline: false
            },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white'
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            scrollZoom: true,
            toImageButtonOptions: {
              format: 'svg',
              filename: 'spectrum_plot',
              height: 800,
              width: 1200,
              scale: 2
            }
          }}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </Box>
  );

  console.log('=== Ending SpectrumViewer component ===');
  return result;
}

export default SpectrumViewer; 