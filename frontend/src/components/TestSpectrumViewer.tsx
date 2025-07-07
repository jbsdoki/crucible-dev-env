import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import type { PlotData } from 'plotly.js';
import { getNewSpectrum, getEnergyRangeSpectrum } from '../services/api';
import { Box, CircularProgress, Typography, IconButton, Tooltip, Stack, Grid } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CropIcon from '@mui/icons-material/Crop';
import ScaleIcon from '@mui/icons-material/Scale';

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

interface SpectrumData {
  x: number[];
  y: number[];
  x_label: string;
  x_units: string;
  y_label: string;
}

interface TestSpectrumViewerProps {
  selectedFile: string;
  selectedSignal: SignalInfo;
  regionSpectrumData?: SpectrumData | null;
  selectedRegion?: {x1: number, y1: number, x2: number, y2: number} | null;
}

/**
 * TestSpectrumViewer Component
 * 
 * This component handles the visualization of spectrum data using the new data format
 * that includes both x and y values with proper units.
 * 
 * Props:
 * @param selectedFile - Name of the currently selected file
 * @param selectedSignal - Information about the selected signal
 * @param regionSpectrumData - Optional spectrum data for a selected region
 * @param selectedRegion - Optional region coordinates
 */
function TestSpectrumViewer({ 
  selectedFile, 
  selectedSignal,
  regionSpectrumData,
  selectedRegion 
}: TestSpectrumViewerProps) {
  const [spectrumData, setSpectrumData] = useState<SpectrumData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showRegion, setShowRegion] = useState<boolean>(true);
  const [isLogScale, setIsLogScale] = useState<boolean>(false);
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number} | null>(null);
  const [energyFilteredImage, setEnergyFilteredImage] = useState<number[][] | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState<boolean>(false);

  useEffect(() => {
    const fetchSpectrum = async () => {
      if (!selectedFile || !selectedSignal) {
        setSpectrumData(null);
        setError('');
        return;
      }

      if (!selectedSignal.capabilities.hasSpectrum) {
        setError('Selected signal cannot be displayed as a spectrum');
        setSpectrumData(null);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        const data = await getNewSpectrum(selectedFile, selectedSignal.index);
        setSpectrumData(data);
      } catch (err) {
        console.error('Error fetching spectrum:', err);
        setError('Error fetching spectrum: ' + (err as Error).message);
        setSpectrumData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSpectrum();
  }, [selectedFile, selectedSignal]);

  // Handle selection mode toggle
  const handleSelectionModeToggle = () => {
    if (isSelectingRange) {
      setSelectedRange(null);
    }
    setIsSelectingRange(!isSelectingRange);
  };

  // Handle selection events
  const handleSelection = async (event: any) => {
    if (!isSelectingRange || !event?.range?.x || !spectrumData) return;

    const [start, end] = event.range.x;
    // Find the closest x values in our data
    const xValues = spectrumData.x;
    const startIdx = xValues.findIndex(x => x >= start);
    const endIdx = xValues.findIndex(x => x >= end);
    
    console.log('Selection range:', {
      start_x: start,
      end_x: end,
      start_idx: startIdx,
      end_idx: endIdx,
      start_energy: xValues[startIdx],
      end_energy: xValues[endIdx]
    });
    
    setSelectedRange({ 
      start: startIdx >= 0 ? startIdx : 0, 
      end: endIdx >= 0 ? endIdx : xValues.length - 1 
    });

    try {
      setImageLoading(true);
      setImageError(null);
      
      // Get the 2D image data for the selected energy range from the backend
      const imageData = await getEnergyRangeSpectrum(
        selectedFile,
        selectedSignal.index,
        { start: startIdx, end: endIdx }
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

  // Prepare plot data
  const plotData: Array<Partial<Plotly.PlotData>> = [];

  // Add main spectrum
  plotData.push({
    x: spectrumData.x,
    y: spectrumData.y,
    type: 'scatter',
    mode: 'lines',
    name: 'Full Spectrum',
  });

  // Add selected range markers if range is selected
  if (selectedRange) {
    // Add start marker
    plotData.push({
      x: [spectrumData.x[selectedRange.start]],
      y: [spectrumData.y[selectedRange.start]],
      type: 'scatter',
      mode: 'markers',
      marker: { 
        size: 10,
        color: 'green',
        symbol: 'circle'
      },
      name: 'Selection Start',
      showlegend: false
    });

    // Add end marker
    plotData.push({
      x: [spectrumData.x[selectedRange.end]],
      y: [spectrumData.y[selectedRange.end]],
      type: 'scatter',
      mode: 'markers',
      marker: { 
        size: 10,
        color: 'green',
        symbol: 'circle'
      },
      name: 'Selection End',
      showlegend: false
    });

    // Add highlighted region
    plotData.push({
      x: spectrumData.x.slice(selectedRange.start, selectedRange.end + 1),
      y: spectrumData.y.slice(selectedRange.start, selectedRange.end + 1),
      type: 'scatter',
      mode: 'lines',
      line: { 
        color: 'rgba(0, 255, 0, 0.3)',
        width: 2
      },
      fill: 'tonexty',
      name: 'Selected Region'
    });
  }

  // Add region spectrum if available
  if (regionSpectrumData && showRegion) {
    plotData.push({
      x: regionSpectrumData.x,
      y: regionSpectrumData.y,
      type: 'scatter',
      mode: 'lines',
      name: 'Region Spectrum',
      line: { color: '#ff7f0e' },
    });
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                      bgcolor: showRegion ? 'rgba(255, 127, 14, 0.2)' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  {showRegion ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={isLogScale ? "Switch to Linear Scale" : "Switch to Log Scale"}>
              <IconButton
                onClick={() => setIsLogScale(!isLogScale)}
                color={isLogScale ? "primary" : "default"}
              >
                <ScaleIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isSelectingRange ? "Cancel Selection" : "Select Energy Range"}>
              <IconButton 
                onClick={handleSelectionModeToggle}
                color={isSelectingRange ? "success" : "default"}
                sx={{ 
                  bgcolor: isSelectingRange ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: isSelectingRange ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <CropIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Box>
      <Box>
        <Plot
          data={plotData}
          layout={{
            title: {
              text: selectedSignal.title
            },
            xaxis: {
              title: {
                text: `${spectrumData.x_label} (${spectrumData.x_units})`
              },
              type: 'linear'
            },
            yaxis: {
              title: {
                text: spectrumData.y_label
              },
              type: isLogScale ? 'log' : 'linear'
            },
            dragmode: isSelectingRange ? 'select' : 'zoom',
            showlegend: true,
            height: 500
          }}
          config={{
            displayModeBar: true,
            scrollZoom: true,
            displaylogo: false
          }}
          onSelected={handleSelection}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

      {/* Energy-filtered image section */}
      {selectedRange && (
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
      )}
    </Box>
  );
}

export default TestSpectrumViewer; 