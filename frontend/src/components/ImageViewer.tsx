import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { getImageData } from '../services/api';
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
}

/**
 * ImageViewer Component
 * 
 * Displays a 2D image from a signal using Plotly heatmap. Can handle:
 * - 2D signals directly as images
 * - 3D signals by summing across the spectrum dimension
 * 
 * The component checks the signal's capabilities before attempting to display.
 */
function ImageViewer({ selectedFile, selectedSignal }: ImageViewerProps) {
  console.log('=== Starting ImageViewer component ===');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);

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
            paper_bgcolor: 'transparent'
          }}
          config={{
            responsive: true,
            displayModeBar: true,
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