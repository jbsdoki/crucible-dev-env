import { Box, CircularProgress, Typography } from '@mui/material';
import { useEmissionRangeToImageContext } from '../../contexts/EmissionAnalysisToEmissionRangeImageContext';
import { useEffect, useState } from 'react';
import * as api from '../../services/api';
import Plot from 'react-plotly.js';
import EmissionLineRangeDisplayDropdown from './components/EmissionLineRangeDisplayDropdown';

/**
 * EmissionLineRangeVisualizer Component
 * 
 * Creates a 2D spatial map showing the distribution of X-rays within a selected emission line energy range.
 * The intensity at each pixel represents the count of X-rays detected within the specified
 * energy range at that spatial location.
 * 
 * This component receives the displayed range ID from the EmissionRangeToImageContext
 * It looks up the range data from the ranges collection and uses the selected file and signal index
 * to fetch the image data from the backend and display it in a 2D spatial map.
 * 
 * The data only flows one way:
 * - EmissionLineAnalysis -> EmissionRangeToImageContext -> EmissionLineRangeVisualizer
 * 
 */
export function EmissionLineRangeVisualizer() {
  const { ranges, displayedRangeId, selectedFile, signalIndex } = useEmissionRangeToImageContext();
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
        console.log('EmissionLineRangeVisualizer: Fetching sum for range:', displayedRange.energy);
        setSumLoading(true);
        
        const sum = await api.getEmissionSpectraWidthSum(
          selectedFile,
          signalIndex,
          displayedRange.energy.start,
          displayedRange.energy.end
        );
        
        setRangeSum(sum);
        console.log('EmissionLineRangeVisualizer: Sum fetched successfully:', sum);
      } catch (error) {
        console.error('EmissionLineRangeVisualizer: Error fetching sum:', error);
        setRangeSum('Error fetching sum data');
      } finally {
        setSumLoading(false);
      }
    };

    fetchRangeSum();
  }, [selectedFile, signalIndex, displayedRange]);

  // Fetch image data when displayedRange changes
  useEffect(() => {
    console.log('EmissionLineRangeVisualizer: Displayed range changed:', displayedRange?.energy);
    
    const fetchImageData = async () => {
      if (!displayedRange || !selectedFile || signalIndex === null) {
        console.log('EmissionLineRangeVisualizer: Missing required data:', { 
          selectedFile, 
          displayedRange: displayedRange ? `${displayedRange.element} ${displayedRange.lineName}` : null, 
          signalIndex 
        });
        setEnergyFilteredImage(null);
        return;
      }

      try {
        console.log('EmissionLineRangeVisualizer: Fetching image data for range:', displayedRange.indices);
        console.log('EmissionLineRangeVisualizer: Using indices - Start:', displayedRange.indices.start, 'End:', displayedRange.indices.end);
        console.log('EmissionLineRangeVisualizer: Corresponding energy range - Start:', displayedRange.energy.start, 'keV, End:', displayedRange.energy.end, 'keV');
        setImageLoading(true);
        setImageError(null);
        
        // Call backend API to get 2D image data for the selected energy range using indices
        const imageData = await api.getEnergyRangeSpectrum(
          selectedFile,
          signalIndex,
          displayedRange.indices  // Use indices for API call
        );
        
        console.log('EmissionLineRangeVisualizer: Successfully fetched image data');
        setEnergyFilteredImage(imageData);
      } catch (error) {
        console.error('EmissionLineRangeVisualizer: Error fetching image:', error);
        setImageError('Failed to load emission line energy-filtered image');
        setEnergyFilteredImage(null);
      } finally {
        setImageLoading(false);
      }
    };

    fetchImageData();
  }, [selectedFile, signalIndex, displayedRange]);

  return (
    <Box sx={{ mt: 2 }}>
      {/* Emission Line Range Selection Controls */}
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
          Emission Line Distribution Map
        </Typography>
        <EmissionLineRangeDisplayDropdown />
      </Box>

      {/* Display current emission line range info if one is selected */}
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
            {displayedRange.element} {displayedRange.lineName.toUpperCase()}: {displayedRange.energy.start.toFixed(2)} - {displayedRange.energy.end.toFixed(2)} keV
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
            No emission line range selected for display
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the dropdown above to select an emission line range, or create ranges in the Emission Line Analysis first.
          </Typography>
        </Box>
      )}
      
      {/* Loading state */}
      {displayedRange && imageLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
            Loading emission line energy-filtered image...
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
                filename: `emission_line_${displayedRange.element}_${displayedRange.lineName}`,
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

export default EmissionLineRangeVisualizer;
