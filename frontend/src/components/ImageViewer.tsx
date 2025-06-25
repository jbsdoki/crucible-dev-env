import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { getImageData, getRegionSpectrum } from '../services/api';
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
  onRegionSelected?: (region: {x1: number, y1: number, x2: number, y2: number}, spectrumData: number[]) => void;
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
  console.log('=== Starting ImageViewer component ===');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [selectionLoading, setSelectionLoading] = useState(false);

  // Effect to fetch image data when file or signal changes
  useEffect(() => {
    const fetchImageData = async () => {
      console.log('=== Starting fetchImageData ===');
      if (!selectedFile || !selectedSignal) {
        setError(null);
        setImageData(null);
        console.log('=== Ending fetchImageData - no file or signal selected ===');
        return;
      }

      if (!selectedSignal.capabilities.hasImage) {
        setError('Selected signal cannot be displayed as an image');
        setImageData(null);
        console.log('=== Ending fetchImageData - signal cannot be displayed as image ===');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching image data for:', {
          file: selectedFile,
          signal: selectedSignal.title,
          type: selectedSignal.type,
          shape: selectedSignal.shape
        });
        
        const data = await getImageData(selectedFile, selectedSignal.index);
        
        if (!data || !data.image_data || !data.data_shape) {
          console.error('Invalid data received:', data);
          setError('Could not load image data from signal');
          console.log('=== Ending fetchImageData - invalid data ===');
          return;
        }

        const [height, width] = data.data_shape;
        console.log('Image dimensions:', width, 'x', height);
        
        setImageData({
          data: data.image_data,
          image_shape: [height, width],
          data_range: {
            min: data.data_range.min,
            max: data.data_range.max
          }
        });

        console.log('=== Ending fetchImageData successfully ===');
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
    console.log('Selection event:', event);
    setSelectionError(null);
    
    // Check if we have a valid selection event
    if (!event || !event.range) {
      console.log('No valid selection event');
      return;
    }

    try {
      // Plotly selection event structure:
      // event.range = { x: [x0, x1], y: [y0, y1] }
      const { x: [x1, x2], y: [y1, y2] } = event.range;
      
      // Round to integers since we're dealing with pixel coordinates
      const region = {
        x1: Math.round(x1),
        y1: Math.round(y1),
        x2: Math.round(x2),
        y2: Math.round(y2)
      };

      console.log('Selected region:', region);
      setSelectedRegion(region);

      // Send region coordinates to backend
      if (selectedFile && selectedSignal) {
        try {
          setSelectionLoading(true);
          console.log('Fetching spectrum for region:', region);
          const spectrumData = await getRegionSpectrum(
            selectedFile,
            selectedSignal.index,
            region
          );
          console.log('Received spectrum data:', spectrumData);
          
          // Pass both region and spectrum data to parent
          if (onRegionSelected) {
            onRegionSelected(region, spectrumData);
          }
        } catch (error) {
          console.error('Error fetching region spectrum:', error);
          setSelectionError(`Error processing region: ${(error as Error).message}`);
        } finally {
          setSelectionLoading(false);
        }
      }
    } catch (error) {
      console.error('Error processing selection:', error);
      setSelectionError('Invalid selection coordinates');
    }
  };

  const result = (
    <Box 
      sx={{ 
        width: '100%',
        height: '400px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        padding: 2
      }}
    >
      {/* Show selection loading/error states */}
      {selectionLoading && (
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <CircularProgress size={20} />
        </Box>
      )}
      {selectionError && (
        <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
          <Alert severity="error" onClose={() => setSelectionError(null)}>
            {selectionError}
          </Alert>
        </Box>
      )}

      {/* Existing loading/error/plot content */}
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
              showscale: true,
              colorbar: {
                title: {
                  text: 'Count',
                  side: 'right'
                }
              },
              zsmooth: 'best'
            }
          ]}
          layout={{
            width: 600,
            height: 400,
            margin: { t: 10, r: 80, b: 10, l: 10 },
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
              rangemode: 'nonnegative'
            },
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
            dragmode: 'select',  // Enable box selection
            selectdirection: 'any'  // Allow selection in any direction
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
          style={{ width: '100%', height: '100%' }}
          onSelected={handleSelection}
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
  );

  console.log('=== Ending ImageViewer component ===');
  return result;
}

export default ImageViewer; 