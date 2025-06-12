import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getFiles, getSpectrum } from '../services/api';
import { Box, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';

/**
 * Interface defining the structure of a single data point in the spectrum
 * Used by Recharts to plot the data
 */
interface SpectrumDataPoint {
  energy: number;
  intensity: number;
}

/**
 * SpectrumViewer Component
 * 
 * This component handles the visualization of spectrum data from .emd files.
 * It interacts with the backend through the following API endpoints:
 * 
 * 1. GET /files (backend/main.py -> get_file_list() -> file_service.py -> list_files())
 *    - Lists all available .emd files in the backend's sample_data directory
 * 
 * 2. GET /spectrum (backend/main.py -> get_spectrum() -> file_service.py -> extract_spectrum())
 *    - Retrieves spectrum data for a specific file
 *    - Parameters: filename, x coordinate (default: 0)
 *    - Returns: Array of intensity values
 */
function SpectrumViewer() {
  // State variables for managing the component
  const [files, setFiles] = useState<string[]>([]);  // List of available .emd files
  const [selectedFile, setSelectedFile] = useState<string>('');  // Currently selected file
  const [spectrumData, setSpectrumData] = useState<SpectrumDataPoint[]>([]);  // Processed spectrum data
  const [error, setError] = useState<string>('');  // Error messages
  const [loading, setLoading] = useState<boolean>(false);  // Loading state

  /**
   * Initial file list fetch
   * Called when component mounts
   * Makes API call to: GET /files
   * Backend path: main.py -> get_file_list() -> file_service.py -> list_files()
   */
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const fileList = await getFiles();
        setFiles(fileList);
      } catch (err) {
        setError('Error fetching files: ' + (err as Error).message);
      }
    };
    fetchFiles();
  }, []);

  /**
   * Handles file selection and spectrum data fetching
   * Called when user selects a file from the dropdown
   * 
   * API Call: GET /spectrum?filename=<filename>&x=0
   * Backend path: main.py -> get_spectrum() -> file_service.py -> extract_spectrum()
   * 
   * @param filename - Name of the selected .emd file
   */
  const handleFileSelect = async (filename: string) => {
    try {
      console.log('Selected file:', filename);
      setLoading(true);
      setError('');
      setSelectedFile(filename);
      
      console.log('Fetching spectrum data...');
      const data = await getSpectrum(filename);
      console.log('Received spectrum data type:', typeof data);
      console.log('Received spectrum data:', data);
      console.log('Is Array?', Array.isArray(data));
      
      // Check if data is valid before processing
      if (!Array.isArray(data)) {
        throw new Error(`Expected array but received ${typeof data}`);
      }
      
      // Convert spectrum data to format expected by Recharts
      // Each point becomes {energy: index, intensity: value}
      const formattedData = data.map((value: number, index: number) => ({
        energy: index,
        intensity: value
      }));
      console.log('Formatted data:', formattedData);
      
      setSpectrumData(formattedData);
    } catch (err) {
      console.error('Error in handleFileSelect:', err);
      setError('SpectrumViewer.tsx: Error fetching spectrum: ' + (err as Error).message);
      setSpectrumData([]);
    } finally {
      setLoading(false);
    }
  };

  // Render the component
  return (
    <Box sx={{ p: 3 }}>
      <h2>Spectrum Viewer</h2>
      
      {/* Error message display */}
      {error && (
        <Box sx={{ color: 'error.main', mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          {error}
        </Box>
      )}
      
      {/* File selection dropdown */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select EMD File</InputLabel>
        <Select
          value={selectedFile}
          label="Select EMD File"
          onChange={(e) => handleFileSelect(e.target.value)}
        >
          {files.map((file) => (
            <MenuItem key={file} value={file}>
              {file}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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