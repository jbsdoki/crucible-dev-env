import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getSpectrum } from '../services/api';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Interface defining the structure of a single data point in the spectrum
 * Used by Recharts to plot the data
 */
interface SpectrumDataPoint {
  energy: number;
  intensity: number;
}

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

interface SpectrumViewerProps {
  selectedFile: string;
  selectedSignal: SignalInfo;
}

/**
 * SpectrumViewer Component
 * 
 * This component handles the visualization of spectrum data from .emd files.
 * It can display:
 * - 1D signals directly as spectra
 * - Extracted spectra from 3D signals
 * 
 * The component checks the signal's capabilities before attempting to display.
 * 
 * Props:
 * @param selectedFile - Name of the currently selected file
 * @param selectedSignal - Information about the selected signal
 */
function SpectrumViewer({ selectedFile, selectedSignal }: SpectrumViewerProps) {
  const [spectrumData, setSpectrumData] = useState<SpectrumDataPoint[]>([]);  // Processed spectrum data
  const [error, setError] = useState<string>('');  // Error messages
  const [loading, setLoading] = useState<boolean>(false);  // Loading state

  /**
   * Fetch spectrum data when selectedFile or selectedSignal changes
   */
  useEffect(() => {
    const fetchSpectrum = async () => {
      if (!selectedFile || !selectedSignal) {
        setSpectrumData([]);
        setError('');
        return;
      }

      if (!selectedSignal.capabilities.hasSpectrum) {
        setError('Selected signal cannot be displayed as a spectrum');
        setSpectrumData([]);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching spectrum data for:', {
          file: selectedFile,
          signal: selectedSignal.title,
          type: selectedSignal.type,
          shape: selectedSignal.shape
        });
        
        const data = await getSpectrum(selectedFile, selectedSignal.index);
        
        // Add detailed logging about the received data
        console.log('Raw spectrum data:', {
          type: typeof data,
          isArray: Array.isArray(data),
          length: data.length,
          sampleValue: data[0],
          sampleValueType: typeof data[0]
        });
        
        // Check if data is valid before processing
        if (!Array.isArray(data)) {
          throw new Error(`Expected array but received ${typeof data}`);
        }
        
        // Convert spectrum data to format expected by Recharts
        const formattedData = data.map((value: number, index: number) => ({
          energy: index,
          intensity: value
        }));
        
        // Log the formatted data structure
        console.log('Formatted spectrum data:', {
          length: formattedData.length,
          firstPoint: formattedData[0],
          lastPoint: formattedData[formattedData.length - 1]
        });
        
        setSpectrumData(formattedData);
      } catch (err) {
        console.error('Error fetching spectrum:', err);
        setError('Error fetching spectrum: ' + (err as Error).message);
        setSpectrumData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpectrum();
  }, [selectedFile, selectedSignal]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {selectedSignal ? selectedSignal.title : 'Spectrum Viewer'}
      </Typography>
      
      {/* Error message display */}
      {error && (
        <Box sx={{ color: 'error.main', mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography>{error}</Typography>
        </Box>
      )}

      {/* Loading spinner */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No selection message */}
      {!loading && !error && (!selectedFile || !selectedSignal) && (
        <Typography>Select a file and signal to view spectrum</Typography>
      )}

      {/* Spectrum plot */}
      {!loading && !error && spectrumData.length > 0 && (
        <LineChart
          width={800}
          height={400}
          data={spectrumData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="energy" label={{ value: 'Energy', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="intensity" stroke="#8884d8" name={selectedSignal.title} />
        </LineChart>
      )}
    </Box>
  );
}

export default SpectrumViewer; 