import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { getImageData, getRegionSpectrum } from '../services/api';
import type { SpectrumData } from './SpectrumViewer/types';
import Plot from 'react-plotly.js';

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

interface ImageData {
  data: number[][];
  image_shape: [number, number];
  data_range: {
    min: number;
    max: number;
  };
}

interface ImageViewerProps {
  selectedFile: string;
  selectedSignal: SignalInfo;
  onRegionSelected?: (region: {x1: number, y1: number, x2: number, y2: number}, spectrumData: SpectrumData) => void;
}

/**
 * ImageViewer Component
 * 
 * Displays a 2D image from a signal using Plotly heatmap. Can handle:
 * - 2D signals directly as images
 * - 3D signals by summing across the spectrum dimension
 * 
 * The component checks the signal's capabilities before attempting to display.
 * Now supports rectangular region selection for spectrum analysis.
 */
function ImageViewer({ selectedFile, selectedSignal, onRegionSelected }: ImageViewerProps) {
  /* console.log('=== Starting ImageViewer component ==='); */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectionLoading, setSelectionLoading] = useState(false);
  
  // Click-based polygon drawing state
  const [clickPoints, setClickPoints] = useState<{x: number, y: number}[]>([]);
  const [finalShape, setFinalShape] = useState<any[]>([]);
  const [usePolygonMode, setUsePolygonMode] = useState(false);

  // Effect to fetch image data when file or signal changes
  useEffect(() => {
    const fetchImageData = async () => {
      /* console.log('=== Starting fetchImageData ==='); */
      if (!selectedFile || !selectedSignal) {
        setError(null);
        setImageData(null);
        /* console.log('=== Ending fetchImageData - no file or signal selected ==='); */
        return;
      }

      if (!selectedSignal.capabilities.hasImage) {
        setError('Selected signal cannot be displayed as an image');
        setImageData(null);
        /* console.log('=== Ending fetchImageData - signal cannot be displayed as image ==='); */
        return;
      }

      try {
        setLoading(true);
        setError(null);
        /* console.log('Fetching image data for:', {
          file: selectedFile,
          signal: selectedSignal.title,
          type: selectedSignal.type,
          shape: selectedSignal.shape
        }); */
        
        const data = await getImageData(selectedFile, selectedSignal.index);
        
        if (!data || !data.image_data || !data.data_shape) {
          console.error('Invalid data received:', data);
          setError('Could not load image data from signal');
          /* console.log('=== Ending fetchImageData - invalid data ==='); */
          return;
        }

        const [height, width] = data.data_shape;
        /* console.log('Image dimensions:', width, 'x', height); */
        
        setImageData({
          data: data.image_data,
          image_shape: [height, width],
          data_range: {
            min: data.data_range.min,
            max: data.data_range.max
          }
        });

        // Clear any existing polygon shapes when loading new image data
        setClickPoints([]);
        setFinalShape([]);
        setSelectedRegion(null);

        /* console.log('=== Ending fetchImageData successfully ==='); */
      } catch (err) {
        console.error('Error fetching image data:', err);
        setError(`Error loading image: ${(err as Error).message}`);
        console.log('=== Ending fetchImageData with error ===');
      } finally {
        setLoading(false);
      }
    };

    fetchImageData();
  }, [selectedFile, selectedSignal]);

  // Image selection, selects 2 x,y coordinates and sends them to parent component
  const handleSelection = async (event: any) => {
    /* console.log('Selection event:', event);
    console.log('Raw selection coordinates:', {
      x: event?.range?.x,
      y: event?.range?.y
    }); */
    setSelectionError(null);
    
    // Check if we have a valid selection event
    if (!event || !event.range) {
      /* console.log('No valid selection event');  // Keep this as it's error-related */
      return;
    }

    try {
      // Plotly selection event structure:
      // event.range = { x: [x0, x1], y: [y0, y1] }
      const { x: [x1, x2], y: [y1, y2] } = event.range;
      
      /* console.log('Pre-rounding coordinates:', {
        x1, y1, x2, y2,
        imageShape: imageData?.image_shape
      }); */
      
      // Round to integers since we're dealing with pixel coordinates
      const region = {
        x1: Math.round(x1),
        y1: Math.round(y1),
        x2: Math.round(x2),
        y2: Math.round(y2)
      };

      // console.log('Final rounded coordinates being sent to backend:', region);
      
      // Log z-values at selected points
      /* Commented out z-value logging for now
      if (imageData?.data) {
        // Get z-values at each corner of selection
        const corners = [
          { x: region.x1, y: region.y1, label: 'Top-Left' },
          { x: region.x1, y: region.y2, label: 'Bottom-Left' },
          { x: region.x2, y: region.y1, label: 'Top-Right' },
          { x: region.x2, y: region.y2, label: 'Bottom-Right' }
        ];

        console.log('\nFrontend z-values at selection corners:');
        corners.forEach(corner => {
          if (corner.y >= 0 && corner.y < imageData.data.length &&
              corner.x >= 0 && corner.x < imageData.data[0].length) {
            console.log(`${corner.label} (${corner.x}, ${corner.y}):`, imageData.data[corner.y][corner.x]);
          }
        });
      }
      */

      setSelectedRegion(region);

      // Send region coordinates to backend
      if (selectedFile && selectedSignal) {
        try {
          setSelectionLoading(true);
          /* console.log('Fetching spectrum for region:', region); */
          const spectrumData = await getRegionSpectrum(
            selectedFile,
            selectedSignal.index,
            region
          );
          /* console.log('Received spectrum data:', spectrumData); */
          
          // Pass both region and spectrum data to parent
          if (onRegionSelected) {
            onRegionSelected(region, spectrumData);
          }
        } catch (error) {
          /* console.error('Error fetching region spectrum:', error);  // Keep this as it's error-related */
          setSelectionError(`Error processing region: ${(error as Error).message}`);
        } finally {
          setSelectionLoading(false);
        }
      }
    } catch (error) {
      /* console.error('Error processing selection:', error);  // Keep this as it's error-related */
      setSelectionError('Invalid selection coordinates');
    }
  };

  // Handle clicks for polygon drawing
  const handlePolygonClick = (event: any) => {
    if (!usePolygonMode || !event.points || event.points.length === 0) return;
    
    const x = Math.round(event.points[0].x);
    const y = Math.round(event.points[0].y);
    
    console.log('Polygon click at:', { x, y });
    setClickPoints(prev => [...prev, { x, y }]);
  };

  // Submit polygon and create closed shape
  const handleSubmitPolygon = async () => {
    if (clickPoints.length < 3) {
      setSelectionError('Need at least 3 points to create a polygon');
      return;
    }

    // Create closed polygon path
    const path = `M ${clickPoints.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
    
    const polygonShape = {
      type: 'path',
      path,
      line: { color: 'blue', width: 2 },
      fillcolor: 'rgba(0, 0, 255, 0.3)'
    };

    setFinalShape([polygonShape]);
    console.log('Created polygon with path:', path);

    // Calculate bounding box for backend API
    const xCoords = clickPoints.map(p => p.x);
    const yCoords = clickPoints.map(p => p.y);
    
    const region = {
      x1: Math.min(...xCoords),
      y1: Math.min(...yCoords),
      x2: Math.max(...xCoords),
      y2: Math.max(...yCoords)
    };

    console.log('Polygon bounding box:', region);
    setSelectedRegion(region);

    // Send region to backend (same as other selection methods)
    if (selectedFile && selectedSignal) {
      try {
        setSelectionLoading(true);
        setSelectionError(null);
        console.log('Fetching spectrum for polygon region:', region);
        
        const spectrumData = await getRegionSpectrum(
          selectedFile,
          selectedSignal.index,
          region
        );
        
        console.log('Received spectrum data from polygon:', spectrumData);
        
        if (onRegionSelected) {
          onRegionSelected(region, spectrumData);
        }
      } catch (error) {
        console.error('Error fetching polygon region spectrum:', error);
        setSelectionError(`Error processing polygon region: ${(error as Error).message}`);
      } finally {
        setSelectionLoading(false);
      }
    }

    // Clear click points for next polygon
    setClickPoints([]);
  };

  // Clear/reset polygon drawing
  const handleClearPolygon = () => {
    setClickPoints([]);
    setFinalShape([]);
    setSelectedRegion(null);
    setSelectionError(null);
  };

  const result = (
    <Box 
      sx={{ 
        width: '100%',
        height: '100%',
        border: '1px solid #ccc',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        position: 'relative',  // For absolute positioning of tools
        overflow: 'hidden'
      }}
    >
      {/* Tools and Status Section - Centered at Top */}
      <Box sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 1,
        gap: 2,
        borderBottom: '1px solid #ccc'
      }}>
        <Button
          variant={usePolygonMode ? "contained" : "outlined"}
          size="small"
          onClick={() => {
            setUsePolygonMode(!usePolygonMode);
            // Clear existing selections when switching modes
            handleClearPolygon();
            setSelectedRegion(null);
          }}
          sx={{ minWidth: '120px' }}
        >
          {usePolygonMode ? 'Polygon Mode' : 'Selection Mode'}
        </Button>
        
        {usePolygonMode && (
          <>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSubmitPolygon}
              disabled={clickPoints.length < 3}
              sx={{ minWidth: '100px' }}
            >
              Submit ({clickPoints.length})
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearPolygon}
              sx={{ minWidth: '80px' }}
            >
              Clear
            </Button>
          </>
        )}
        
        {selectionLoading && (
          <CircularProgress size={20} />
        )}
        {selectionError && (
          <Alert 
            severity="error" 
            onClose={() => setSelectionError(null)}
            sx={{ maxWidth: '300px' }}
          >
            {selectionError}
          </Alert>
        )}
      </Box>

      {/* Main Content Area */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        justifyContent: 'flex-start',  // Align to left
        alignItems: 'center',
        padding: 2,
        overflow: 'auto'
      }}>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : !selectedFile || !selectedSignal ? (
          <Typography>Select a file and signal to view image</Typography>
        ) : imageData ? (
          <Plot
            data={[
              {
                z: imageData.data,
                type: 'heatmap',
                colorscale: 'Viridis',
                showscale: false,
                zsmooth: 'best'
              }
            ]}
            layout={{
              width: 400,  // Reduced width to fit better
              height: 400,
              margin: { t: 30, r: 80, b: 30, l: 30 },  // Increased margins for better tool access
              xaxis: { 
                visible: false,
                showgrid: false,
                range: [0, imageData.image_shape[1] - 1],
                scaleanchor: 'y',
                constrain: 'domain',
                rangemode: 'nonnegative'
              },
              yaxis: { 
                visible: false,
                showgrid: false,
                range: [0, imageData.image_shape[0] - 1],
                constrain: 'domain',
                rangemode: 'nonnegative',
                autorange: 'reversed'
              },
              plot_bgcolor: 'transparent',
              paper_bgcolor: 'transparent',
              dragmode: usePolygonMode ? 'pan' : 'select',
              selectdirection: 'any',
              shapes: [
                ...finalShape,
                // Show temporary dots for click points
                ...clickPoints.map((point, index) => ({
                  type: 'circle',
                  xref: 'x', yref: 'y',
                  x0: point.x - 2, y0: point.y - 2,
                  x1: point.x + 2, y1: point.y + 2,
                  fillcolor: 'red',
                  line: { color: 'red', width: 1 }
                })),
                // Show connecting lines between points
                ...(clickPoints.length > 1 ? [{
                  type: 'path',
                  path: `M ${clickPoints.map(p => `${p.x},${p.y}`).join(' L ')}`,
                  line: { color: 'red', width: 1, dash: 'dot' }
                }] : [])
              ]
            }}
            config={{
              responsive: true,
              displayModeBar: true,
              displaylogo: false,
              scrollZoom: true,
              modeBarButtonsToRemove: ['autoScale2d'],
              toImageButtonOptions: {
                format: 'svg',
                filename: `${selectedSignal.title}_image`,
                height: 800,
                width: 800,
                scale: 2
              }
            }}
            style={{ 
              maxWidth: '100%',
              maxHeight: '100%'
            }}
            onSelected={usePolygonMode ? undefined : handleSelection}
            onClick={usePolygonMode ? handlePolygonClick : undefined}
            onRelayout={(e: any) => {
              const xRange = e['xaxis.range'] || e['xaxis.range[0]'];
              const yRange = e['yaxis.range'] || e['yaxis.range[0]'];
              if (xRange && (xRange[0] < 0 || xRange[1] > imageData.image_shape[1] - 1) ||
                  yRange && (yRange[0] < 0 || yRange[1] > imageData.image_shape[0] - 1)) {
                const update = {
                  'xaxis.range': [0, imageData.image_shape[1] - 1],
                  'yaxis.range': [0, imageData.image_shape[0] - 1]
                };
                // @ts-ignore (Plotly types are incomplete)
                e.target.relayout(update);
              }
            }}
          />
        ) : null}
      </Box>
    </Box>
  );

  /* console.log('=== Ending ImageViewer component ==='); */
  return result;
}

export default ImageViewer; 