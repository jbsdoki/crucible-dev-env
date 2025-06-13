import { Box } from '@mui/material';

/**
 * ImageViewer Component
 * 
 * This component will display the image data from the EMD file.
 * Currently a placeholder until we implement the image data endpoint.
 */
function ImageViewer() {
  return (
    <Box 
      sx={{ 
        width: '100%',
        height: '400px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
      }}
    >
      <p>Image Viewer - Coming Soon</p>
    </Box>
  );
}

export default ImageViewer; 