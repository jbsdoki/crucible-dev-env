import { Box, Typography } from '@mui/material';
import { useSpectrumContext } from '../../contexts/SpectrumContext';

/**
 * SpectrumToImage Component
 * 
 * This component will eventually handle the creation and display of multiple 
 * 2D spatial maps from selected spectrum ranges.
 * Currently just displays the selected range from context.
 */
export function SpectrumToImage() {
  const { selectedRange } = useSpectrumContext();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">
        Spectrum To Image
      </Typography>
      <Typography>
        {selectedRange 
          ? `Selected Range: ${selectedRange.start.toFixed(2)} - ${selectedRange.end.toFixed(2)}`
          : 'No range selected'}
      </Typography>
    </Box>
  );
}

export default SpectrumToImage;
