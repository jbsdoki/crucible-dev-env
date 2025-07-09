/*#####################################################################################
############ DEVELOPMENT FILE ONLY DO NOT COMMIT OR USE IN PRODUCTION ################
#####################################################################################*/

import React, { useState, useEffect } from 'react';
import { getFiles } from '../services/api';
import { useFileContext } from '../contexts/fileContext';
import { Box, Typography, Select, MenuItem, Button, CircularProgress, Paper } from '@mui/material';

const TestConnection: React.FC = () => {
  // Get everything from FileContext
  const {
    selectedFile,
    setSelectedFile,
    selectedSignal,
    setSelectedSignal,
    metadata,
    error,
    loading
  } = useFileContext();

  // Local state just for available files list
  const [files, setFiles] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch available files on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const fileList = await getFiles();
      setFiles(fileList);
      setFetchError(null);
    } catch (err) {
      setFetchError('Failed to fetch files');
      console.error('Error fetching files:', err);
    }
  };

  // Test signal selection
  const testSignalSelection = () => {
    // Create a test signal
    const testSignal = {
      index: 0,
      title: "Test Signal",
      type: "spectrum",
      shape: [100, 100],
      capabilities: {
        hasSpectrum: true,
        hasImage: true
      }
    };
    setSelectedSignal(testSignal);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        FileContext Test Panel
      </Typography>

      {/* File Selection Test */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          File Selection Test
        </Typography>
        <Select
          fullWidth
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          sx={{ mb: 2 }}
        >
          {files.map(file => (
            <MenuItem key={file} value={file}>{file}</MenuItem>
          ))}
        </Select>
        {fetchError && (
          <Typography color="error" sx={{ mb: 1 }}>
            {fetchError}
          </Typography>
        )}
      </Paper>

      {/* Signal Selection Test */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Signal Selection Test
        </Typography>
        <Button 
          variant="contained" 
          onClick={testSignalSelection}
          disabled={!selectedFile}
          sx={{ mb: 1 }}
        >
          Set Test Signal
        </Button>
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle1">Current Signal:</Typography>
          <pre>
            {selectedSignal ? JSON.stringify(selectedSignal, null, 2) : 'No signal selected'}
          </pre>
        </Box>
      </Paper>

      {/* Metadata Display */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Metadata Test
        </Typography>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {metadata && (
          <Box>
            <Typography variant="subtitle1">Metadata Result:</Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              <pre>
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TestConnection; 