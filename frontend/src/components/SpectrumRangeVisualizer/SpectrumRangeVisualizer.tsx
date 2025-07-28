import { Box, CircularProgress, Typography } from '@mui/material';
import { useSpectrumContext } from '../../contexts/SpectrumViewerToSpectrumRangeVisualizer';
import { useEffect, useState } from 'react';
import * as api from '../../services/api';
import Plot from 'react-plotly.js';
import RangeDisplayDropdown from './components/RangeDisplayDropdown';

/**
 * SpectrumToImage Component
 * 
 * Creates a 2D spatial map showing the distribution of X-rays within a selected energy range.
 * The intensity at each pixel represents the count of X-rays detected within the specified
 * energy range at that spatial location.
 * 
 * This component receives the displayed range ID from the SpectrumRangeContext
 * It looks up the range data from the ranges collection and uses the selected file and signal index
 * to fetch the image data from the backend and display it in a 2D spatial map.
 * 
 * The data only flows one way:
 * - SpectrumViewer -> SpectrumRangeContext -> SpectrumToImage
 * 
 */
export function SpectrumToImage() {
  const { ranges, displayedRangeId, selectedFile, signalIndex } = useSpectrumContext();
  const [energyFilteredImage, setEnergyFilteredImage] = useState<number[][] | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [rangeSum, setRangeSum] = useState<number | string | null>(null);
  const [sumLoading, setSumLoading] = useState(false);

  // Get the currently displayed range from the collection
  const displayedRange = displayedRangeId ? ranges[displayedRangeId] : null;

  // Fetch sum data when displayedRange changes
  useEffect(() => {
    const fetchRangeSum = async () => {
      if (!displayedRange || !selectedFile || signalIndex === null) {
        setRangeSum(null);
        return;
      }

      try {
        console.log('SpectrumRangeVisualizer: Fetching sum for range:', displayedRange.energy);
        setSumLoading(true);
        
        const sum = await api.getEmissionSpectraWidthSum(
          selectedFile,
          signalIndex,
          displayedRange.energy.start,
          displayedRange.energy.end
        );
        
        setRangeSum(sum);
        console.log('SpectrumRangeVisualizer: Sum fetched successfully:', sum);
      } catch (error) {
        console.error('SpectrumRangeVisualizer: Error fetching sum:', error);
        setRangeSum('Error fetching sum data');
      } finally {
        setSumLoading(false);
      }
    };

    fetchRangeSum();
  }, [selectedFile, signalIndex, displayedRange]);

  // Fetch image data when displayedRange changes
  useEffect(() => {
    console.log('SpectrumToImage: Displayed range changed:', displayedRange?.energy);
    
    const fetchImageData = async () => {
      if (!displayedRange || !selectedFile || signalIndex === null) {
        console.log('SpectrumToImage: Missing required data:', { 
          selectedFile, 
          displayedRange: displayedRange ? `Range ${displayedRange.id}` : null, 
          signalIndex 
        });
        setEnergyFilteredImage(null);
        return;
      }

      try {
        console.log('SpectrumToImage: Fetching image data for range:', displayedRange.indices);
        console.log('SpectrumToImage: Using indices - Start:', displayedRange.indices.start, 'End:', displayedRange.indices.end);
        console.log('SpectrumToImage: Corresponding energy range - Start:', displayedRange.energy.start, 'keV, End:', displayedRange.energy.end, 'keV');
        setImageLoading(true);
        setImageError(null);
        
        // Call backend API to get 2D image data for the selected energy range using indices
        const imageData = await api.getEnergyRangeSpectrum(
          selectedFile,
          signalIndex,
          displayedRange.indices  // Use indices for API call
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
  }, [selectedFile, signalIndex, displayedRange]);

  return (
    <Box sx={{ mt: 2 }}>
      {/* Range Selection Controls */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        p: 2,
        bgcolor: 'grey.50',
        borderRadius: 1
      }}>
        <Typography variant="h6">
          X-ray Distribution Map
        </Typography>
        <RangeDisplayDropdown />
      </Box>

      {/* Display current range info if one is selected */}
      {displayedRange && (
        <Box sx={{ 
          mb: 2, 
          p: 2, 
          bgcolor: 'white', 
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: 1 
        }}>
          <Typography variant="subtitle1" color="primary.main" gutterBottom>
            Range {displayedRange.id}: {displayedRange.energy.start.toFixed(2)} - {displayedRange.energy.end.toFixed(2)} keV
          </Typography>
          <Typography variant="body2" color="text.primary">
            <strong>Sum: </strong>
            {sumLoading ? (
              'Loading...'
            ) : (
              typeof rangeSum === 'number' ? rangeSum.toLocaleString() : rangeSum || 'No data'
            )}
          </Typography>
        </Box>
      )}

      {/* Show message when no range is selected for display */}
      {!displayedRange && (
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No range selected for display
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the dropdown above to select a range, or create ranges in the Spectrum Viewer first.
          </Typography>
        </Box>
      )}
      
      {/* Loading state */}
      {displayedRange && imageLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
            Loading energy-filtered image...
          </Typography>
        </Box>
      )}
      
      {/* Error state */}
      {displayedRange && imageError && (
        <Box sx={{ color: 'error.main', mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography>{imageError}</Typography>
        </Box>
      )}
      
      {/* Image display */}
      {displayedRange && energyFilteredImage && !imageLoading && !imageError && (
        <Box sx={{ 
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 1,
          overflow: 'hidden'
        }}>
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
                filename: `energy_filtered_range_${displayedRange.id}`,
                height: 800,
                width: 800,
                scale: 2
              }
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      )}
    </Box>
  );
}

export default SpectrumToImage;
