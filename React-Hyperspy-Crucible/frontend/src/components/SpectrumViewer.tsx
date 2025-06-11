import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getFiles, getSpectrum } from '../services/api';
import { Box, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';

function SpectrumViewer() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [spectrumData, setSpectrumData] = useState<number[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch available files
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

  // Fetch spectrum when file is selected
  const handleFileSelect = async (filename: string) => {
    try {
      setLoading(true);
      setError('');
      setSelectedFile(filename);
      const data = await getSpectrum(filename);
      // Convert spectrum data to format expected by Recharts
      const formattedData = data.map((value: number, index: number) => ({
        energy: index,
        intensity: value
      }));
      setSpectrumData(formattedData);
    } catch (err) {
      setError('Error fetching spectrum: ' + (err as Error).message);
      setSpectrumData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <h2>Spectrum Viewer</h2>
      
      {error && (
        <Box sx={{ color: 'error.main', mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          {error}
        </Box>
      )}
      
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

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

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