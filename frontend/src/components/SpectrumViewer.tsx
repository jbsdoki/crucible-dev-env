import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import type { PlotData } from 'plotly.js';
import { getSpectrum } from '../services/api';
import { Box, CircularProgress, Typography, IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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
  regionSpectrumData?: number[] | null;
  selectedRegion?: {x1: number, y1: number, x2: number, y2: number} | null;
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
function SpectrumViewer({ 
  selectedFile, 
  selectedSignal, 
  regionSpectrumData,
  selectedRegion 
}: SpectrumViewerProps) {
  console.log('=== Starting SpectrumViewer component ===');
  const [fullSpectrumData, setFullSpectrumData] = useState<number[]>([]);  // Full signal spectrum
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showRegion, setShowRegion] = useState<boolean>(true);

  /**
   * Fetch spectrum data when selectedFile or selectedSignal changes
   */
  useEffect(() => {
    const fetchSpectrum = async () => {
      console.log('=== Starting fetchSpectrum ===');
      if (!selectedFile || !selectedSignal) {
        setFullSpectrumData([]);
        setError('');
        console.log('=== Ending fetchSpectrum - no file or signal selected ===');
        return;
      }

      if (!selectedSignal.capabilities.hasSpectrum) {
        setError('Selected signal cannot be displayed as a spectrum');
        setFullSpectrumData([]);
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
        
        setFullSpectrumData(data);
        console.log('=== Ending fetchSpectrum successfully ===');
      } catch (err) {
        console.error('Error fetching spectrum:', err);
        setError('Error fetching spectrum: ' + (err as Error).message);
        setFullSpectrumData([]);
        console.log('=== Ending fetchSpectrum with error ===');
      } finally {
        setLoading(false);
      }
    };

    if (selectedFile && selectedSignal && selectedSignal.capabilities.hasSpectrum) {
      fetchSpectrum();
    } else {
      setFullSpectrumData([]);
      setError('');
    }
  }, [selectedFile, selectedSignal]);

  const result = (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          {selectedSignal ? selectedSignal.title : 'Spectrum Viewer'}
          {selectedRegion && ' (Region Selected)'}
        </Typography>
        {regionSpectrumData && (
          <Tooltip title={showRegion ? "Hide Selected Region" : "Show Selected Region"}>
            <IconButton 
              onClick={() => setShowRegion(!showRegion)}
              color={showRegion ? "warning" : "default"}
              sx={{ 
                bgcolor: showRegion ? 'rgba(255, 127, 14, 0.1)' : 'transparent',
                '&:hover': {
                  bgcolor: showRegion ? 'rgba(255, 127, 14, 0.2)' : 'action.hover',
                },
                color: showRegion ? '#ff7f0e' : 'default',
              }}
            >
              {showRegion ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
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
      {!loading && !error && (fullSpectrumData.length > 0 || (regionSpectrumData && regionSpectrumData.length > 0)) && (
        <Plot
          data={[
            // Full spectrum trace (dimmed if region is selected)
            {
              x: Array.from({ length: fullSpectrumData.length }, (_, i) => i),
              y: fullSpectrumData,
              type: 'scatter' as const,
              mode: 'lines' as const,
              name: 'Full Spectrum',
              line: {
                color: regionSpectrumData && showRegion ? '#1f77b480' : '#1f77b4', // Dimmed if region selected and shown
                width: 2
              }
            },
            // Region spectrum trace (only shown if region is selected and showRegion is true)
            ...(regionSpectrumData && showRegion ? [{
              x: Array.from({ length: regionSpectrumData.length }, (_, i) => i),
              y: regionSpectrumData,
              type: 'scatter' as const,
              mode: 'lines' as const,
              name: 'Region Spectrum',
              line: {
                color: '#ff7f0e',
                width: 2
              }
            }] : [])
          ]}
          layout={{
            width: 800,
            height: 400,
            margin: { t: 10, r: 50, b: 50, l: 70 },
            showlegend: true,
            legend: {
              x: 1,
              xanchor: 'right',
              y: 1
            },
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
            displaylogo: false,
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