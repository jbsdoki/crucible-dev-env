// /*#####################################################################################
// ############ DEVELOPMENT FILE ONLY DO NOT COMMIT OR USE IN PRODUCTION ################
// #####################################################################################*/





import { Box, Typography } from '@mui/material';
import { useSpectrumContext } from '../contexts/SpectrumContext';

export function FWHMDisplay() {
  const { fwhm_index, showFWHM } = useSpectrumContext();

  return (
    <Box sx={{ p: 1, border: '1px solid #ccc', mb: 2 }}>
      <Typography variant="body2">
        FWHM Index: {fwhm_index !== null ? fwhm_index : 'Not set'}
      </Typography>
      <Typography variant="body2">
        FWHM Visible: {showFWHM ? 'Yes' : 'No'}
      </Typography>
    </Box>
  );
} 