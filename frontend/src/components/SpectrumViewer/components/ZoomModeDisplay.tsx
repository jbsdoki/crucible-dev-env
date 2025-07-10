// /*#####################################################################################
// ############ DEVELOPMENT FILE ONLY DO NOT COMMIT OR USE IN PRODUCTION ################
// #####################################################################################*/

import { Box, Typography } from '@mui/material';
import { useSpectrumContext } from '../contexts/SpectrumContext';

export function ZoomModeDisplay() {
  const { isZoomMode } = useSpectrumContext();

  return (
    <Box sx={{ p: 1, border: '1px solid #ccc', mb: 2 }}>
      <Typography variant="body2">
        Interaction Mode: {isZoomMode ? 'Zoom' : 'Pan'}
      </Typography>
    </Box>
  );
} 