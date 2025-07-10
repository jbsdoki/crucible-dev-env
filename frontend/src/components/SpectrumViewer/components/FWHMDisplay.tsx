// /*#####################################################################################
// ############ DEVELOPMENT FILE ONLY DO NOT COMMIT OR USE IN PRODUCTION ################
// #####################################################################################*/





// import { Box, Typography } from '@mui/material';
// import { useSpectrum } from '../contexts/SpectrumContext';

// /**
//  * FWHMDisplay Component
//  * 
//  * A simple component that reads and displays the FWHM index from the SpectrumContext.
//  * This component is useful for testing that the context is working correctly.
//  */
// export function FWHMDisplay() {
//   const { fwhm_index } = useSpectrum();
  
//   return (
//     <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, m: 2 }}>
//       <Typography>
//         FWHM Index from Context: {fwhm_index !== null ? fwhm_index : 'Not set'}
//       </Typography>
//     </Box>
//   );
// } 