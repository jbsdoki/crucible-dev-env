import { Box, CircularProgress, Typography } from '@mui/material';
import { useSpectrumContext } from '../../contexts/SpectrumRangeToImageContext';
import { useEffect, useState } from 'react';
import * as api from '../../services/api';
import Plot from 'react-plotly.js';

/**
 * SpectrumToImage Component
 * 
 * Creates a 2D spatial map showing the distribution of X-rays within a selected energy range.
 * The intensity at each pixel represents the count of X-rays detected within the specified
 * energy range at that spatial location.
 * 
 * This component receives the Spectrum Range from the SpectrumRangeContext
 * It also receives the selected file and signal index from the SpectrumRangeContext
 * It then uses the selected file and signal index to fetch the image data from the backend
 * and then displays the image data in a 2D spatial map'
 * 
 * The data only flows one way:
 * - SpectrumViewer -> SpectrumRangeContext -> SpectrumToImage
 * 
 */
export function SpectrumToImage() {
  const { selectedRange, selectedFile, signalIndex } = useSpectrumContext();
  const [energyFilteredImage, setEnergyFilteredImage] = useState<number[][] | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Fetch image data when selectedRange changes
  useEffect(() => {
    console.log('SpectrumToImage: Range changed:', selectedRange?.energy);
    
    const fetchImageData = async () => {
      if (!selectedRange || !selectedFile || signalIndex === null) {
        console.log('SpectrumToImage: Missing required data:', { selectedFile, selectedRange, signalIndex });
        return;
      }

      try {
        console.log('SpectrumToImage: Fetching image data for range:', selectedRange.indices);
        setImageLoading(true);
        setImageError(null);
        
        // Call backend API to get 2D image data for the selected energy range using indices
        const imageData = await api.getEnergyRangeSpectrum(
          selectedFile,
          signalIndex,
          selectedRange.indices  // Use indices for API call
        );
        
        console.log('SpectrumToImage: Successfully fetched image data');
        setEnergyFilteredImage(imageData);
      } catch (error) {
        console.error('SpectrumToImage: Error fetching image:', error);
        setImageError('Failed to load energy-filtered image');
        setEnergyFilteredImage(null);
      } finally {
        setImageLoading(false);
      }
    };

    fetchImageData();
  }, [selectedFile, signalIndex, selectedRange]);

  if (!selectedRange) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {selectedRange && `X-ray Distribution Map (${selectedRange.energy.start.toFixed(2)} - ${selectedRange.energy.end.toFixed(2)} KeV)`}
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
  );
}

export default SpectrumToImage;
