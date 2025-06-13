import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getSpectrum } from '../services/api';
import { Box, CircularProgress } from '@mui/material';

/**
 * Interface defining the structure of a single data point in the spectrum
 * Used by Recharts to plot the data
 */
interface SpectrumDataPoint {
  energy: number;
  intensity: number;
}

interface SpectrumViewerProps {
  selectedFile: string;
}

/**
 * SpectrumViewer Component
 * 
 * This component handles the visualization of spectrum data from .emd files.
 * It receives the selected file as a prop and fetches the corresponding spectrum data.
 * 
 * Props:
 * @param selectedFile - Name of the currently selected file
 */
function SpectrumViewer({ selectedFile }: SpectrumViewerProps) {
  const [spectrumData, setSpectrumData] = useState<SpectrumDataPoint[]>([]);  // Processed spectrum data
  const [error, setError] = useState<string>('');  // Error messages
  const [loading, setLoading] = useState<boolean>(false);  // Loading state

  /**
   * Fetch spectrum data when selectedFile changes
   */
  useEffect(() => {
    const fetchSpectrum = async () => {
      if (!selectedFile) return;
      
      try {
        setLoading(true);
        setError('');
        
        console.log('Fetching spectrum data for:', selectedFile);
        const data = await getSpectrum(selectedFile);
        
        // Check if data is valid before processing
        if (!Array.isArray(data)) {
          throw new Error(`Expected array but received ${typeof data}`);
        }
        
        // Convert spectrum data to format expected by Recharts
        const formattedData = data.map((value: number, index: number) => ({
          energy: index,
          intensity: value
        }));
        
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
  }, [selectedFile]);

  return (
    <Box sx={{ p: 3 }}>
      <h2>Spectrum Viewer</h2>
      
      {/* Error message display */}
      {error && (
        <Box sx={{ color: 'error.main', mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          {error}
        </Box>
      )}

      {/* Loading spinner */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Spectrum plot */}
      {!loading && spectrumData.length > 0 && (
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
          <Line type="monotone" dataKey="intensity" stroke="#8884d8" />
        </LineChart>
      )}
    </Box>
  );
}

export default SpectrumViewer; 