// import { useState, useEffect } from 'react';
// import Plot from 'react-plotly.js';
// import { Box, CircularProgress, Typography } from '@mui/material';
// // import { getEnergyRangeSpectrum } from '../../../services/api';
// import * as api from '../../../services/api';  // Import entire API module

// interface SpectrumRangeImageProps {
//   selectedFile: string;
//   signalIndex: number;
//   selectedRange: {
//     start: number;
//     end: number;
//   } | null;
// }

// /**
//  * SpectrumRangeImage Component
//  * 
//  * Creates a 2D spatial map showing the distribution of X-rays within a selected energy range.
//  * The intensity at each pixel represents the count of X-rays detected within the specified
//  * energy range at that spatial location.
//  * 
//  * @param selectedFile - The file containing the spectrum data
//  * @param signalIndex - Index of the signal in the file
//  * @param selectedRange - The selected range of energy values to map
//  */
// function SpectrumRangeImage({ selectedFile, signalIndex, selectedRange }: SpectrumRangeImageProps) {
//   const [energyFilteredImage, setEnergyFilteredImage] = useState<number[][] | null>(null);
//   const [imageLoading, setImageLoading] = useState(false);
//   const [imageError, setImageError] = useState<string | null>(null);

//   // Fetch image data when selectedRange changes
//   useEffect(() => {
//     console.log('SpectrumRangeImage: Range changed:', selectedRange);
    
//     const fetchImageData = async () => {
//       if (!selectedRange || !selectedFile) {
//         console.log('SpectrumRangeImage: Missing required data:', { selectedFile, selectedRange });
//         return;
//       }

//       try {
//         console.log('SpectrumRangeImage: Fetching image data for range:', selectedRange);
//         setImageLoading(true);
//         setImageError(null);
        
//         // Call backend API to get 2D image data for the selected energy range
//         const imageData = await api.getEnergyRangeSpectrum(
//           selectedFile,
//           signalIndex,
//           { start: selectedRange.start, end: selectedRange.end }
//         );
        
//         console.log('SpectrumRangeImage: Successfully fetched image data');
//         setEnergyFilteredImage(imageData);
//       } catch (error) {
//         console.error('SpectrumRangeImage: Error fetching image:', error);
//         setImageError('Failed to load energy-filtered image');
//         setEnergyFilteredImage(null);
//       } finally {
//         setImageLoading(false);
//       }
//     };

//     fetchImageData();
//   }, [selectedFile, signalIndex, selectedRange]);

//   if (!selectedRange) return null;

//   return (
//     <Box sx={{ mt: 2 }}>
//       <Typography variant="h6" gutterBottom>
//         X-ray Distribution Map (Channels {selectedRange.start} - {selectedRange.end})
//       </Typography>
      
//       {imageLoading && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
//           <CircularProgress />
//         </Box>
//       )}
      
//       {imageError && (
//         <Box sx={{ color: 'error.main', mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
//           <Typography>{imageError}</Typography>
//         </Box>
//       )}
      
//       {energyFilteredImage && !imageLoading && !imageError && (
//         <Plot
//           data={[{
//             z: energyFilteredImage,
//             type: 'heatmap',
//             colorscale: 'Viridis',
//             showscale: true,
//             colorbar: {
//               title: {
//                 text: 'Intensity',
//                 side: 'right'
//               }
//             },
//             zsmooth: 'best'
//           }]}
//           layout={{
//             width: 600,
//             height: 400,
//             margin: { t: 10, r: 80, b: 10, l: 10 },
//             xaxis: { 
//               visible: false,
//               showgrid: false,
//               scaleanchor: 'y',
//               constrain: 'domain'
//             },
//             yaxis: { 
//               visible: false,
//               showgrid: false,
//               constrain: 'domain',
//               autorange: "reversed"
//             },
//             plot_bgcolor: 'transparent',
//             paper_bgcolor: 'transparent'
//           }}
//           config={{
//             responsive: true,
//             displayModeBar: true,
//             displaylogo: false,
//             scrollZoom: true,
//             toImageButtonOptions: {
//               format: 'svg',
//               filename: 'energy_filtered_image',
//               height: 800,
//               width: 800,
//               scale: 2
//             }
//           }}
//           style={{ width: '100%', height: '100%' }}
//         />
//       )}
//     </Box>
//   );
// }

// export default SpectrumRangeImage;
