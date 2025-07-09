import { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { getHAADFData } from '../services/api';

interface HAADFViewerProps {
  selectedFile: string;
}

/**
 * HAADFViewer Component
 * 
 * Automatically displays the HAADF image from a file if available.
 * Unlike ImageViewer, this component doesn't require signal selection
 * as it automatically finds and displays the HAADF signal.
 */
function HAADFViewer({ selectedFile }: HAADFViewerProps) {
  // console.log('=== Starting HAADFViewer component ===');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<{
    data: number[][],
    width: number,
    height: number
  } | null>(null);

  // Effect to fetch HAADF data when file changes
  useEffect(() => {
    const fetchHAADFData = async () => {
      // console.log('=== Starting fetchHAADFData ===');
      if (!selectedFile) {
        setError(null);
        setImageData(null);
        console.log('=== Ending fetchHAADFData - no file selected ===');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // console.log('Fetching HAADF data for:', { file: selectedFile });
        
        const data = await getHAADFData(selectedFile);
        // console.log('Received raw data:', {
        //   type: typeof data,
        //   keys: Object.keys(data),
        //   dataShape: data.data_shape,
        //   imageDataType: typeof data.image_data,
        //   imageDataIsArray: Array.isArray(data.image_data),
        //   imageDataLength: data.image_data?.length,
        //   sampleRow: data.image_data?.[0]?.slice(0, 5),  // First 5 pixels of first row
        // });
        
        if (!data || !data.image_data || !data.data_shape) {
          console.error('Invalid data received:', data);
          setError('No HAADF Image Found');
          // console.log('=== Ending fetchHAADFData - invalid data ===');
          return;
        }

        const [height, width] = data.data_shape;
        // console.log('Image dimensions:', width, 'x', height);
        
        setImageData({
          data: data.image_data,
          width: width,
          height: height
        });

        // console.log('Processed image data:', {
        //   dimensions: `${width} x ${height}`,
        //   totalPixels: width * height,
        //   samplePixelValues: {
        //     topLeft: data.image_data[0][0],
        //     topRight: data.image_data[0][width-1],
        //     bottomLeft: data.image_data[height-1][0],
        //     bottomRight: data.image_data[height-1][width-1],
        //   }
        // });
        // console.log('=== Ending fetchHAADFData successfully ===');
      } catch (err) {
        console.error('Error fetching HAADF data:', err);
        setError('No HAADF Image Found');
        console.log(`${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchHAADFData();
  }, [selectedFile]);

  // Effect to draw image when canvas and image data are both ready
  useEffect(() => {
    if (!imageData) return;

    const drawImage = () => {
      // console.log('=== Starting drawImage ===');
      // console.log('Attempting to draw image...');
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log('Canvas not ready yet, waiting...');
        console.log('=== Ending drawImage - canvas not ready ===');
        return;
      }

      // console.log('Canvas found, dimensions:', canvas.width, 'x', canvas.height);
      
      // Set canvas dimensions to match image dimensions
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      // console.log('Set canvas dimensions to:', canvas.width, 'x', canvas.height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        console.log('=== Ending drawImage - could not get context ===');
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
      // console.log('Canvas rendering details:', {
      //   canvasDimensions: `${canvas.width} x ${canvas.height}`,
      //   dataBufferSize: data.length,
      //   firstFewPixels: Array.from(data.slice(0, 20)),  // Show first 5 RGBA values
      //   imageDataSize: `${imageDataObj.width} x ${imageDataObj.height}`
      // });
      // console.log('Image drawn to canvas successfully');
      // console.log('=== Ending drawImage successfully ===');
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
      <Typography variant="h6" gutterBottom>
        HAADF Image
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : !selectedFile ? (
        <Typography>Select a file to view HAADF image</Typography>
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

export default HAADFViewer; 