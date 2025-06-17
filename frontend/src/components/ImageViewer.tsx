import { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { getImageData } from '../services/api';

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

interface ImageViewerProps {
  selectedFile: string;
  selectedSignal: SignalInfo;
}

/**
 * ImageViewer Component
 * 
 * Displays a 2D image from a signal. Can handle:
 * - 2D signals directly as images
 * - 3D signals by summing across the spectrum dimension
 * 
 * The component checks the signal's capabilities before attempting to display.
 */
function ImageViewer({ selectedFile, selectedSignal }: ImageViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<{
    data: number[][],
    width: number,
    height: number
  } | null>(null);

  // Effect to fetch image data when file or signal changes
  useEffect(() => {
    const fetchImageData = async () => {
      if (!selectedFile || !selectedSignal) {
        setError(null);
        setImageData(null);
        return;
      }

      if (!selectedSignal.capabilities.hasImage) {
        setError('Selected signal cannot be displayed as an image');
        setImageData(null);
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
        console.log('Received raw data:', {
          type: typeof data,
          keys: Object.keys(data),
          dataShape: data.data_shape,
          imageDataType: typeof data.image_data,
          imageDataIsArray: Array.isArray(data.image_data),
          imageDataLength: data.image_data?.length,
          sampleRow: data.image_data?.[0]?.slice(0, 5),  // First 5 pixels of first row
        });
        
        if (!data || !data.image_data || !data.data_shape) {
          console.error('Invalid data received:', data);
          setError('Could not load image data from signal');
          return;
        }

        const [height, width] = data.data_shape;
        console.log('Image dimensions:', width, 'x', height);
        
        setImageData({
          data: data.image_data,
          width: width,
          height: height
        });

        console.log('Processed image data:', {
          dimensions: `${width} x ${height}`,
          totalPixels: width * height,
          samplePixelValues: {
            topLeft: data.image_data[0][0],
            topRight: data.image_data[0][width-1],
            bottomLeft: data.image_data[height-1][0],
            bottomRight: data.image_data[height-1][width-1],
          }
        });
      } catch (err) {
        console.error('Error fetching image data:', err);
        setError(`Error loading image: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchImageData();
  }, [selectedFile, selectedSignal]);

  // Effect to draw image when canvas and image data are both ready
  useEffect(() => {
    if (!imageData) return;

    const drawImage = () => {
      console.log('Attempting to draw image...');
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log('Canvas not ready yet, waiting...');
        return;
      }

      console.log('Canvas found, dimensions:', canvas.width, 'x', canvas.height);
      
      // Set canvas dimensions to match image dimensions
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      console.log('Set canvas dimensions to:', canvas.width, 'x', canvas.height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }

      // Create ImageData object
      const data = new Uint8ClampedArray(imageData.width * imageData.height * 4);
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const value = imageData.data[y][x];
          const index = (y * imageData.width + x) * 4;
          // Set RGB values to the same value for grayscale
          data[index] = value;     // R
          data[index + 1] = value; // G
          data[index + 2] = value; // B
          data[index + 3] = 255;   // A
        }
      }
      
      const imageDataObj = new ImageData(data, imageData.width, imageData.height);
      ctx.putImageData(imageDataObj, 0, 0);
      console.log('Canvas rendering details:', {
        canvasDimensions: `${canvas.width} x ${canvas.height}`,
        dataBufferSize: data.length,
        firstFewPixels: Array.from(data.slice(0, 20)),  // Show first 5 RGBA values
        imageDataSize: `${imageDataObj.width} x ${imageDataObj.height}`
      });
      console.log('Image drawn to canvas successfully');
    };

    // Try to draw immediately
    drawImage();

    // Also try again in the next frame in case the canvas wasn't ready
    requestAnimationFrame(drawImage);
  }, [imageData]);

  return (
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
      ) : (
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
        />
      )}
    </Box>
  );
}

export default ImageViewer; 