import React from 'react';
import { FileProvider } from '../contexts/fileContext';
import TestConnection from './TestConnection';
import { Box } from '@mui/material';

/**
 * Test page for FileContext functionality
 * Wraps TestConnection in FileProvider to test context features
 * without modifying the main application
 */
const ContextTest: React.FC = () => {
  return (
    <FileProvider>
      <Box sx={{ p: 2 }}>
        <TestConnection />
      </Box>
    </FileProvider>
  );
};

export default ContextTest; 