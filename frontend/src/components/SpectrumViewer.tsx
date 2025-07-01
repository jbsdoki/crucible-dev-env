import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import type { PlotData } from 'plotly.js';
import { getSpectrum, getEnergyRangeSpectrum } from '../services/api';
import { Box, CircularProgress, Typography, IconButton, Tooltip, Stack, Grid } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CropIcon from '@mui/icons-material/Crop';
import ScaleIcon from '@mui/icons-material/Scale';

/**
 * Interface defining the structure of a single data point in the spectrum
 * Used by Recharts to plot the data
 */
// interface SpectrumDataPoint {
//   energy: number;
//   intensity: number;
// }

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
  // console.log('=== Starting SpectrumViewer component ===');
  const [fullSpectrumData, setFullSpectrumData] = useState<number[]>([]);  // Full signal spectrum
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showRegion, setShowRegion] = useState<boolean>(true);
  const [isSelectingRange, setIsSelectingRange] = useState<boolean>(false);
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number} | null>(null);
  const [energyFilteredImage, setEnergyFilteredImage] = useState<number[][] | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isLogScale, setIsLogScale] = useState<boolean>(false);

  /**
   * Fetch spectrum data when selectedFile or selectedSignal changes
   */
  useEffect(() => {
    const fetchSpectrum = async () => {
      // console.log('=== Starting fetchSpectrum ===');
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
        
        // console.log('Fetching spectrum data for:', {
        //   file: selectedFile,
        //   signal: selectedSignal.title,
        //   type: selectedSignal.type,
        //   shape: selectedSignal.shape
        // });
        
        const data = await getSpectrum(selectedFile, selectedSignal.index);
        
        if (!Array.isArray(data)) {
          console.log('=== Ending fetchSpectrum - invalid data format ===');
          throw new Error(`Expected array but received ${typeof data}`);
        }
        
        setFullSpectrumData(data);
        // console.log('=== Ending fetchSpectrum successfully ===');
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

  // Handle selection events
  const handleSelection = async (event: any) => {
    if (!isSelectingRange || !event?.range?.x) return;

    const [start, end] = event.range.x;
    const rangeStart = Math.max(0, Math.round(start));
    const rangeEnd = Math.min(fullSpectrumData.length - 1, Math.round(end));

    // console.log('Selection range:', { start: rangeStart, end: rangeEnd });
    setSelectedRange({ start: rangeStart, end: rangeEnd });

    try {
      setImageLoading(true);
      setImageError(null);
      
      // Get the 2D image data for the selected energy range from the backend
      const imageData = await getEnergyRangeSpectrum(
        selectedFile,
        selectedSignal.index,
        { start: rangeStart, end: rangeEnd }
      );
      
      setEnergyFilteredImage(imageData);
    } catch (error) {
      console.error('Error fetching energy-filtered image:', error);
      setImageError('Failed to load energy-filtered image');
      setEnergyFilteredImage(null);
    } finally {
      setImageLoading(false);
    }
  };

  // Reset selection when toggling mode off
  const handleSelectionModeToggle = () => {
    if (isSelectingRange) {
      setSelectedRange(null);
    }
    setIsSelectingRange(!isSelectingRange);
  };

  const result = (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              {selectedSignal ? selectedSignal.title : 'Spectrum Viewer'}
              {selectedRegion && ' (Region Selected)'}
            </Typography>
            <Stack direction="row" spacing={1}>
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
              <Tooltip title={isLogScale ? "Switch to Linear Scale" : "Switch to Log Scale"}>
                <IconButton 
                  onClick={() => setIsLogScale(!isLogScale)}
                  color={isLogScale ? "info" : "default"}
                  sx={{ 
                    bgcolor: isLogScale ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                    '&:hover': {
                      bgcolor: isLogScale ? 'rgba(33, 150, 243, 0.2)' : 'action.hover',
                    },
                    color: isLogScale ? '#2196f3' : 'default',
                  }}
                >
                  <ScaleIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={isSelectingRange ? "Cancel Selection" : "Isolate Spectrum Region"}>
                <IconButton 
                  onClick={handleSelectionModeToggle}
                  color={isSelectingRange ? "success" : "default"}
                  sx={{ 
                    bgcolor: isSelectingRange ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                    '&:hover': {
                      bgcolor: isSelectingRange ? 'rgba(76, 175, 80, 0.2)' : 'action.hover',
                    },
                    color: isSelectingRange ? '#4caf50' : 'default',
                  }}
                >
                  <CropIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12}>
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
                // Full spectrum trace
                {
                  x: Array.from({ length: fullSpectrumData.length }, (_, i) => i),
                  y: fullSpectrumData,
                  type: 'scatter' as const,
                  mode: 'lines' as const,
                  name: 'Full Spectrum',
                  line: {
                    color: regionSpectrumData && showRegion ? '#1f77b480' : '#1f77b4',
                    width: 2
                  }
                },
                // Region spectrum trace (orange)
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
                }] : []),
                // Selected range highlight (green)
                ...(selectedRange ? [{
                  x: Array.from({ length: fullSpectrumData.length }, (_, i) => i)
                    .filter(i => i >= selectedRange.start && i <= selectedRange.end),
                  y: fullSpectrumData
                    .filter((_, i) => i >= selectedRange.start && i <= selectedRange.end),
                  type: 'scatter' as const,
                  mode: 'lines' as const,
                  name: 'Selected Range',
                  line: {
                    color: '#4caf50',
                    width: 2
                  },
                  showlegend: false,
                  hoverinfo: 'skip' as const
                },
                // Start point marker (green)
                {
                  x: [selectedRange.start],
                  y: [fullSpectrumData[selectedRange.start]],
                  type: 'scatter' as const,
                  mode: 'markers' as const,
                  marker: {
                    color: '#4caf50',
                    size: 10,
                    line: {
                      color: 'white',
                      width: 2
                    }
                  },
                  name: 'Selection Start',
                  showlegend: false,
                  hovertemplate: 'Start: %{x}<br>Count: %{y}<extra></extra>'
                },
                // End point marker (green)
                {
                  x: [selectedRange.end],
                  y: [fullSpectrumData[selectedRange.end]],
                  type: 'scatter' as const,
                  mode: 'markers' as const,
                  marker: {
                    color: '#4caf50',
                    size: 10,
                    line: {
                      color: 'white',
                      width: 2
                    }
                  },
                  name: 'Selection End',
                  showlegend: false,
                  hovertemplate: 'End: %{x}<br>Count: %{y}<extra></extra>'
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
                    text: 'Energy (keV)',
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
                  zeroline: false,
                  type: isLogScale ? 'log' : 'linear'
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'white',
                dragmode: isSelectingRange ? 'select' : 'zoom', // Toggle between select and zoom modes
                selectdirection: 'h' // Only allow horizontal selection
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
              onSelected={handleSelection}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </Grid>

        {/* Energy-filtered image section */}
        {selectedRange && (
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Energy-Filtered Image (Channels {selectedRange.start} - {selectedRange.end})
              </Typography>
              
              {imageLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              )}
              
              {imageError && (
                <Box sx={{ color: 'error.main', mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography>{imageError}</Typography>
                </Box>
              )}
              
              {energyFilteredImage && !imageLoading && !imageError && (
                <Plot
                  data={[{
                    z: energyFilteredImage,
                    type: 'heatmap',
                    colorscale: 'Viridis',
                    showscale: true,
                    colorbar: {
                      title: {
                        text: 'Intensity',
                        side: 'right'
                      }
                    },
                    zsmooth: 'best'
                  }]}
                  layout={{
                    width: 600,
                    height: 400,
                    margin: { t: 10, r: 80, b: 10, l: 10 },
                    xaxis: { 
                      visible: false,
                      showgrid: false,
                      scaleanchor: 'y',
                      constrain: 'domain'
                    },
                    yaxis: { 
                      visible: false,
                      showgrid: false,
                      constrain: 'domain',
                      autorange: "reversed"
                    },
                    plot_bgcolor: 'transparent',
                    paper_bgcolor: 'transparent'
                  }}
                  config={{
                    responsive: true,
                    displayModeBar: true,
                    displaylogo: false,
                    scrollZoom: true,
                    toImageButtonOptions: {
                      format: 'svg',
                      filename: 'energy_filtered_image',
                      height: 800,
                      width: 800,
                      scale: 2
                    }
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  // console.log('=== Ending SpectrumViewer component ===');
  return result;
}

export default SpectrumViewer; 