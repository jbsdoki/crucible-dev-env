/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { useState, useEffect, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { PlotData, Layout } from 'plotly.js';
import { debounce } from 'lodash';
import { getSpectrum, getEnergyRangeSpectrum } from '../services/api';
import { Box, CircularProgress, Typography, IconButton, Tooltip, Stack, Grid } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CropIcon from '@mui/icons-material/Crop';
import ScaleIcon from '@mui/icons-material/Scale';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import PanToolIcon from '@mui/icons-material/PanTool';
import BlockIcon from '@mui/icons-material/Block';

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

interface SpectrumViewerProps {
  selectedFile: string;
  selectedSignal: SignalInfo;
  regionSpectrumData?: SpectrumData | null;
  selectedRegion?: {x1: number, y1: number, x2: number, y2: number} | null;
}

interface AxisRange {
  x?: [number, number];
  y?: [number, number];
}

/**
 * SpectrumViewer Component
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
function SpectrumViewer({ 
  selectedFile, 
  selectedSignal,
  regionSpectrumData,
  selectedRegion 
}: SpectrumViewerProps) {
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
  const [layoutRange, setLayoutRange] = useState<AxisRange>({});
  const [isZoomMode, setIsZoomMode] = useState(true);

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
        
        const data = await getSpectrum(selectedFile, selectedSignal.index);
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

  // Debounced relayout handler for zoom/pan
  const handleRelayout = useCallback(
    debounce((event: any) => {
      if (!event) return;
      
      // Only update ranges if they've changed
      if (event['xaxis.range[0]'] !== undefined && event['xaxis.range[1]'] !== undefined) {
        setLayoutRange(prev => ({
          ...prev,
          x: [event['xaxis.range[0]'], event['xaxis.range[1]']]
        }));
      }
      
      if (event['yaxis.range[0]'] !== undefined && event['yaxis.range[1]'] !== undefined) {
        setLayoutRange(prev => ({
          ...prev,
          y: [event['yaxis.range[0]'], event['yaxis.range[1]']]
        }));
      }
    }, 150),
    []
  );

  // Handle zoom mode toggle
  const handleZoomModeToggle = () => {
    setIsZoomMode(!isZoomMode);
  };

  // Handle selection mode toggle
  const handleSelectionModeToggle = () => {
    if (isSelectingRange) {
      setSelectedRange(null);
    }
    setIsSelectingRange(!isSelectingRange);
  };

  // Handle selection events
  const handleSelection = async (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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

  // Create static layout object
  const baseLayout: Partial<Layout> = {
    showlegend: true,
    height: 500,
    xaxis: {
      title: spectrumData ? {
        text: `${spectrumData.x_label} (${spectrumData.x_units})`
      } : undefined,
      type: 'linear',
      range: layoutRange.x
    },
    yaxis: {
      title: spectrumData ? {
        text: spectrumData.y_label
      } : undefined,
      type: isLogScale ? 'log' : 'linear',
      range: layoutRange.y
    }
  };

  // Prepare plot data
  const plotData: Array<Partial<PlotData>> = [];

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
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {!isSelectingRange && (
                <Tooltip title={isZoomMode ? "Switch to Pan Mode" : "Switch to Zoom Mode"}>
                  <IconButton 
                    onClick={handleZoomModeToggle} 
                    color={isZoomMode ? "primary" : "default"}
                    sx={{ position: 'relative' }}
                  >
                    {isZoomMode ? <ZoomInIcon /> : <PanToolIcon />}
                  </IconButton>
                </Tooltip>
              )}
              {isSelectingRange && (
                <Tooltip title="Zoom/Pan disabled during selection">
                  <span>
                    <IconButton 
                      disabled
                      sx={{ 
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: '50%',
                          left: '-10%',
                          width: '120%',
                          height: '2px',
                          backgroundColor: 'red',
                          transform: 'rotate(-45deg)',
                        }
                      }}
                    >
                      {isZoomMode ? <ZoomInIcon /> : <PanToolIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <Tooltip title={isSelectingRange ? "Disable Selection" : "Enable Selection"}>
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
              <Tooltip title={isLogScale ? "Switch to Linear Scale" : "Switch to Log Scale"}>
                <IconButton onClick={() => setIsLogScale(!isLogScale)} color={isLogScale ? "primary" : "default"}>
                  <ScaleIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>
      </Box>
      <Box>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Plot
          data={plotData}
          layout={{
            ...baseLayout,
            dragmode: isSelectingRange ? 'select' : (isZoomMode ? 'zoom' : 'pan'),
            title: {
              text: selectedSignal.title
            }
          }}
          config={{
            displayModeBar: true,
            scrollZoom: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d']
          }}
          onSelected={handleSelection}
          onRelayout={handleRelayout}
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

export default SpectrumViewer; 