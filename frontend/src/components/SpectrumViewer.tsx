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
import { useSpectrumContext } from './SpectrumViewer/contexts/SpectrumContext';

interface SignalCapabilities {
  hasSpectrum: boolean;
  hasImage: boolean;
}

export interface SignalInfo {
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
  zero_index: number | null;
  fwhm_index: number | null;
}

interface SpectrumViewerProps {
  selectedFile: string;
  selectedSignal: SignalInfo;
  regionSpectrumData?: SpectrumData | null;
  selectedRegion?: {x1: number, y1: number, x2: number, y2: number} | null;
  onRangeSelect?: (range: {start: number, end: number} | null) => void;
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
 * @param onRangeSelect - Optional callback for when a range is selected
 */
function SpectrumViewer({ 
  selectedFile, 
  selectedSignal,
  regionSpectrumData,
  selectedRegion,
  onRangeSelect 
}: SpectrumViewerProps) {
  // Get context values
  const { 
    fwhm_index, 
    setFwhmIndex, 
    isLogScale, 
    setIsLogScale,
    showFWHM,
    setShowFWHM,
    isZoomMode,
    setIsZoomMode,
    showRegion,
    setShowRegion
  } = useSpectrumContext();
  
  const [spectrumData, setSpectrumData] = useState<SpectrumData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  // const [showRegion, setShowRegion] = useState<boolean>(true);
  // Comment out local showFWHM state as it's now in context
  // const [showFWHM, setShowFWHM] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number} | null>(null);
  // Image state now handled by SpectrumRangeImage
  // const [energyFilteredImage, setEnergyFilteredImage] = useState<number[][] | null>(null);
  // const [imageLoading, setImageLoading] = useState(false);
  // const [imageError, setImageError] = useState<string | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState<boolean>(false);
  // const [layoutRange, setLayoutRange] = useState<AxisRange>({});
  // const [isZoomMode, setIsZoomMode] = useState(true);
  // const [showFWHM, setShowFWHM] = useState(false);

  useEffect(() => {
    const fetchSpectrum = async () => {
      if (!selectedFile || !selectedSignal) {
        setSpectrumData(null);
        setError('');
        // Clear FWHM index in context when no data
        setFwhmIndex(null);
        return;
      }

      if (!selectedSignal.capabilities.hasSpectrum) {
        setError('Selected signal cannot be displayed as a spectrum');
        setSpectrumData(null);
        // Clear FWHM index in context when error
        setFwhmIndex(null);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        const data = await getSpectrum(selectedFile, selectedSignal.index);
        setSpectrumData(data);
        // Update FWHM index in context
        setFwhmIndex(data.fwhm_index);
      } catch (err) {
        console.error('Error fetching spectrum:', err);
        setError('Error fetching spectrum: ' + (err as Error).message);
        setSpectrumData(null);
        // Clear FWHM index in context on error
        setFwhmIndex(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSpectrum();
  }, [selectedFile, selectedSignal, setFwhmIndex]);

  // ##################################################################################
  // ############### PLOTLY EVENT HANDLER: RELAYOUT (ZOOM/PAN) ########################
  // ##################################################################################
  // This section handles zoom and pan events from the plot, updating the layout ranges
  const handleRelayout = useCallback(
    debounce((event: any) => {
      if (!event) return;
      
      // Only handle y-axis updates, let Plotly manage x-axis
      if (event['yaxis.range[0]'] !== undefined && event['yaxis.range[1]'] !== undefined) {
        // setLayoutRange({ // Removed as per edit hint
        //   ...layoutRange,
        //   y: [event['yaxis.range[0]'], event['yaxis.range[1]']]
        // });
      }
    }, 150),
    [] // Removed layoutRange from dependency array
  );
  // ##################################################################################
  // ############### END PLOTLY EVENT HANDLER: RELAYOUT ##############################
  // ##################################################################################

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
    
    // setSelectedRange({ 
    const range = { 
      start: startIdx >= 0 ? startIdx : 0, 
      end: endIdx >= 0 ? endIdx : xValues.length - 1 
    };
    
    setSelectedRange(range);
    if (onRangeSelect) {
      onRangeSelect(range);
    }

    // Comment out image fetching since it's now handled by SpectrumRangeImage
    // try {
    //   setImageLoading(true);
    //   setImageError(null);
    //   
    //   // Get the 2D image data for the selected energy range from the backend
    //   const imageData = await getEnergyRangeSpectrum(
    //     selectedFile,
    //     selectedSignal.index,
    //     { start: startIdx, end: endIdx }
    //   );
    //   
    //   setEnergyFilteredImage(imageData);
    // } catch (error) {
    //   console.error('Error fetching energy-filtered image:', error);
    //   setImageError('Failed to load energy-filtered image');
    //   setEnergyFilteredImage(null);
    // } finally {
    //   setImageLoading(false);
    // }
  };

  // ##################################################################################
  // ############### PLOTLY DATA PROCESSING: LOG SCALE AND RANGE CALCULATION ##########
  // ##################################################################################
  // These functions process y-values for log scale and calculate appropriate axis ranges
  const processYValuesForLogScale = (yValues: number[]): number[] => {
    if (!isLogScale) return yValues;
    
    // Find minimum non-zero value to use as floor
    const minNonZero = yValues.reduce((min, val) => {
      if (val > 0 && (min === null || val < min)) {
        return val;
      }
      return min;
    }, null as number | null) || 1e-10;  // default to 1e-10 if all values are 0/negative
    
    // Replace zeros/negatives with minimum/100 to avoid infinity
    return yValues.map(val => val <= 0 ? minNonZero / 100 : val);
  };

  // Function to calculate y-axis range with buffer
  const calculateYAxisRange = (yValues: number[]): [number, number] => {
    const processedValues = processYValuesForLogScale(yValues);
    const minY = Math.min(...processedValues);
    const maxY = Math.max(...processedValues);
    
    if (isLogScale) {
      // For log scale, add buffer in log space
      const logMin = Math.log10(minY);
      const logMax = Math.log10(maxY);
      const logBuffer = (logMax - logMin) * 0.1; // 10% buffer
      return [logMin - logBuffer, logMax + logBuffer];
    } else {
      // For linear scale, add buffer in linear space
      const range = maxY - minY;
      const buffer = range * 0.1; // 10% buffer
      return [minY - buffer, maxY + buffer];
    }
  };
  // ##################################################################################
  // ############### END PLOTLY DATA PROCESSING #####################################
  // ##################################################################################

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

  // ##################################################################################
  // ############### PLOTLY LAYOUT CONFIGURATION ####################################
  // ##################################################################################
  // This section defines the base layout for the plot including axes configuration
  const baseLayout: Partial<Layout> = {
    showlegend: true,
    height: 500,
    xaxis: {
      title: spectrumData ? {
        text: `${spectrumData.x_label} (${spectrumData.x_units})`
      } : undefined,
      type: 'linear'
      // Removed range constraint to test zoom functionality
    },
    yaxis: {
      title: spectrumData ? {
        text: spectrumData.y_label
      } : undefined,
      type: isLogScale ? 'log' : 'linear',
      range: calculateYAxisRange(spectrumData.y) // Removed layoutRange.y
    }
  };
  // ##################################################################################
  // ############### END PLOTLY LAYOUT CONFIGURATION ###############################
  // ##################################################################################

  // ##################################################################################
  // ############### PLOTLY DATA PREPARATION #######################################
  // ##################################################################################
  // This section prepares all the traces that will be displayed on the plot
  const plotData: Array<Partial<PlotData>> = [];

  // Add main spectrum with log scale handling
  plotData.push({
    x: spectrumData.x,
    y: processYValuesForLogScale(spectrumData.y),
    type: 'scatter',
    mode: 'lines',
    name: 'Full Spectrum',
    line: {
      color: '#1f77b4',  // Consistent blue color
      width: 2
    }
  });

  // Add FWHM line if enabled and index exists
  if (showFWHM && fwhm_index !== null) {
    const fwhmX = spectrumData.x[fwhm_index];
    const maxY = Math.max(...spectrumData.y);
    plotData.push({
      x: [fwhmX, fwhmX],
      y: processYValuesForLogScale([0, maxY]),  // Handle log scale for FWHM line
      type: 'scatter',
      mode: 'lines',
      name: 'FWHM',
      line: {
        color: '#d62728',  // Consistent red color
        width: 2,
        dash: 'dash',
      },
    });
  }

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
        color: '#2ca02c',  // Consistent green color
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
        color: '#2ca02c',  // Same green color
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
        color: '#2ca02c',  // Same green color
        width: 2
      },
      fill: 'tonexty',
      fillcolor: 'rgba(44, 160, 44, 0.3)',  // Semi-transparent green
      name: 'Selected Region'
    });
  }

  // Add region spectrum if available
  if (showRegion && regionSpectrumData) {
    plotData.push({
      x: regionSpectrumData.x,
      y: regionSpectrumData.y,
      type: 'scatter',
      mode: 'lines',
      name: 'Region Spectrum',
      line: {
        color: '#ff7f0e',  // Consistent orange color
        width: 2
      }
    });
  }
  // ##################################################################################
  // ############### END PLOTLY DATA PREPARATION ##################################
  // ##################################################################################

  // ##################################################################################
  // ############### PLOTLY COMPONENT RENDERING ###################################
  // ##################################################################################
  // This section renders the actual Plot component with all configurations
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
                    sx={{ position: 'relative', '&.disabled': { color: 'grey.500' } }}
                    disabled={isSelectingRange}
                  >
                    {isZoomMode ? <ZoomInIcon /> : <PanToolIcon />}
                    {isSelectingRange && (
                      <BlockIcon 
                        sx={{ 
                          position: 'absolute',
                          color: 'red',
                          opacity: 0.7,
                        }} 
                      />
                    )}
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
            {fwhm_index !== null && (
              <Tooltip title={showFWHM ? "Hide FWHM Line" : "Show FWHM Line"}>
                <IconButton 
                  onClick={() => setShowFWHM(!showFWHM)}
                  color={showFWHM ? "primary" : "default"}
                >
                  <Box component="span" sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    FWHM
                  </Box>
                </IconButton>
              </Tooltip>
            )}
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
            },
            // Add explicit zoom configuration
            xaxis: {
              ...baseLayout.xaxis,
              autorange: true,  // Force autorange
              fixedrange: false // Ensure axis is not fixed
            }
          }}
          config={{
            displayModeBar: true,
            scrollZoom: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['select2d', 'lasso2d'],  // Keep zoom buttons
            responsive: true
          }}
          onSelected={handleSelection}
          onRelayout={handleRelayout}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

      {/* Comment out Energy-filtered image section since it's now handled by SpectrumRangeImage */}
      {/* {selectedRange && (
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
      )} */}
    </Box>
  );
  // ##################################################################################
  // ############### END PLOTLY COMPONENT RENDERING ##############################
  // ##################################################################################
}

export default SpectrumViewer; 