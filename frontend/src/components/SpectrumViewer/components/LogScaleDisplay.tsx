import { Box, Typography } from '@mui/material';
import { useSpectrumContext } from '../contexts/SpectrumContext';

/**
 * LogScaleDisplay Component
 * 
 * A simple component that reads and displays the isLogScale value from the SpectrumContext.
 * This component is useful for testing that the context is working correctly.
 */
export function LogScaleDisplay() {
  const { isLogScale } = useSpectrumContext();
  
  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, m: 2 }}>
      <Typography>
        Log Scale from Context: {isLogScale ? 'Enabled' : 'Disabled'}
      </Typography>
    </Box>
  );
} 