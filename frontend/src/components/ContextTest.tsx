import React, { useState } from 'react';
import { FileProvider } from '../contexts/fileContext';
import TestConnection from './TestConnection';
import FileSelector from './FileSelector';
import SignalSelector from './SignalSelector';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { getAxesData } from '../services/api';

/**
 * Component to test axes data functionality
 */
const AxesDataTest: React.FC<{ filename: string | null; signalIdx: number | null }> = ({ filename, signalIdx }) => {
  const [axesData, setAxesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAxesData = async () => {
    if (!filename || signalIdx === null) return;
    
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching axes data for:', { filename, signalIdx });
      const data = await getAxesData(filename, signalIdx);
      console.log('Received axes data:', data);
      setAxesData(data);
      if (!data) {
        setError('No axes data returned from the server');
      }
    } catch (err) {
      console.error('Error fetching axes data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch axes data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAxesData();
  }, [filename, signalIdx]);

  return (
    <Paper sx={{ p: 2, my: 2 }}>
      <Typography variant="h6" gutterBottom>Axes Data Test</Typography>
      <Typography variant="body2" gutterBottom>
        {filename && signalIdx !== null 
          ? `Testing file: ${filename}, signal index: ${signalIdx}`
          : 'Please select a file and signal above'}
      </Typography>
      
      {loading && <CircularProgress />}
      {error && (
        <Typography color="error" gutterBottom>
          Error: {error}
        </Typography>
      )}
      {axesData === null && !loading && !error && (
        <Typography color="warning.main">
          No axes data available for this signal
        </Typography>
      )}
      {axesData && (
        <Box>
          <Typography><strong>Offset:</strong> {axesData.offset}</Typography>
          <Typography><strong>Scale:</strong> {axesData.scale}</Typography>
          <Typography><strong>Units:</strong> {axesData.units}</Typography>
        </Box>
      )}
    </Paper>
  );
};

interface SignalInfo {
  index: number;
  title: string;
  type: string;
  shape: number[];
  capabilities: {
    hasSpectrum: boolean;
    hasImage: boolean;
  };
}

/**
 * Test page for FileContext functionality
 * Wraps TestConnection and AxesDataTest in FileProvider to test context features
 * without modifying the main application
 */
const ContextTest: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSignal, setSelectedSignal] = useState<SignalInfo | null>(null);

  return (
    <FileProvider>
      <Box sx={{ p: 2 }}>
        <TestConnection />
        
        {/* File and Signal Selection */}
        <Box sx={{ maxWidth: '800px', margin: '0 auto', mt: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Select Data to Test</Typography>
          <FileSelector 
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
          />
          {selectedFile && (
            <SignalSelector 
              selectedFile={selectedFile} 
              onSignalSelect={setSelectedSignal}
            />
          )}
        </Box>

        {/* Axes Data Test */}
        <AxesDataTest 
          filename={selectedFile || null} 
          signalIdx={selectedSignal ? selectedSignal.index : null} 
        />
      </Box>
    </FileProvider>
  );
};

export default ContextTest; 