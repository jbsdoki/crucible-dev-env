// /*#####################################################################################
// ############ DEVELOPMENT FILE ONLY DO NOT COMMIT OR USE IN PRODUCTION ################
// #####################################################################################*/

import { Box, Typography } from '@mui/material';
import { useSpectrumContext } from '../contexts/SpectrumContext';

export function RegionDisplay() {
  const { showRegion } = useSpectrumContext();

  return (
    <Box sx={{ p: 1, border: '1px solid #ccc', mb: 2 }}>
      <Typography variant="body2">
        Region Spectrum Visible: {showRegion ? 'Yes' : 'No'}
      </Typography>
    </Box>
  );
} 