/**
 * Main Application Component
 * 
 * This is the root component of the React application, rendered in main.tsx.
 * It serves as the entry point for the application's component tree.
 * 
 * Component Structure:
 * - App.tsx (You are here)
 *   ├─ FileSelector (./components/FileSelector.tsx)
 *   │   - Handles file selection
 *   │   - Shared between components
 *   ├─ SignalSelector (./components/SignalSelector.tsx)
 *   │   - Handles signal selection from files
 *   │   - Shows signal capabilities
 *   ├─ ImageViewer (./components/ImageViewer.tsx)
 *   │   - Displays 2D images or slices from 3D data
 *   └─ SpectrumViewer (./components/SpectrumViewer.tsx)
 *        - Displays 1D spectra or extracted spectra from 3D data
 * 
 * Layout:
 * - Vertical layout for selection controls
 * - Grid layout for viewers when signal is selected
 */

import { useState } from 'react'
// import SpectrumViewer from './components/SpectrumViewer'
import SpectrumViewerRoot from './components/SpectrumViewer/SpectrumViewerRoot'
import ImageViewer from './components/ImageViewer'
import HAADFViewer from './components/HAADFViewer'
import MetadataViewer from './components/MetadataViewer'
import FileSelector from './components/FileSelector'
import SignalSelector from './components/SignalSelector'
import ContextTest from './components/ContextTest'
import { Box, Typography, Paper, Button } from '@mui/material'
import './App.css'

// Import SignalInfo type from SignalSelector
interface SignalCapabilities {
  hasSpectrum: boolean;
  hasImage: boolean;
}

interface SignalInfo {
  index: number;
  title: string;
  type: string;
  shape: number[];
  capabilities: SignalCapabilities;
}

/**
 * App Component
 * 
 * Manages the main application state and layout.
 * Handles file selection and signal selection.
 * Shows/hides viewers based on signal capabilities.
 */
function App() {
  // Add a temporary toggle for testing
  const [showTest, setShowTest] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSignal, setSelectedSignal] = useState<SignalInfo | null>(null);
  const [regionSpectrumData, setRegionSpectrumData] = useState<number[] | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);

  // Handler for region selection from ImageViewer
  const handleRegionSelected = (
    region: {x1: number, y1: number, x2: number, y2: number},
    spectrumData: number[]
  ) => {
    // console.log('Region selected in App:', region);
    // console.log('Spectrum data received:', spectrumData);
    setSelectedRegion(region);
    setRegionSpectrumData(spectrumData);
  };

  // Add temporary test toggle button at the top
  if (showTest) {
    return (
      <Box>
        <Button 
          variant="contained" 
          onClick={() => setShowTest(false)}
          sx={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}
        >
          Show Main App
        </Button>
        <ContextTest />
      </Box>
    );
  }

  return (
    <Box className="App">
      {/* Add test toggle button */}
      <Button 
        variant="contained" 
        onClick={() => setShowTest(true)}
        sx={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}
      >
        Test Context
      </Button>

      {/* File and Signal Selection */}
      <Box sx={{ maxWidth: '800px', margin: '0 auto', mt: 2, mb: 2 }}>
        <Box sx={{ 
          typography: 'h5', 
          mb: 2, 
          textAlign: 'center',
          color: 'text.primary',
          fontWeight: 'medium'
        }}>
          Select File
        </Box>
        <FileSelector 
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />
        {selectedFile && (
          <SignalSelector 
            selectedFile={selectedFile} 
            onSignalSelect={setSelectedSignal}
          />
        )}
      </Box>

      {/* Main Three-Column Layout */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '25% 50% 25%', // Three columns with center being larger
        gap: '1rem',
        padding: '1rem',
        width: '100%',
        maxWidth: '1800px', // Increased max width to accommodate all content
        margin: '0 auto',
        '& > *': { // Style all direct children
          minHeight: '300px', // Minimum height for consistency
        }
      }}>
        {/* Left Column: HAADF and Metadata */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          height: '100%',
          position: 'relative'  // Add this for absolute positioning context
        }}>
          {/* HAADF Viewer */}
          <Paper elevation={3} sx={{ 
            flex: '0 0 50%',  // Fixed at 50% height, won't grow or shrink
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <HAADFViewer selectedFile={selectedFile} />
            </Box>
          </Paper>

          {/* Metadata Viewer */}
          <Paper elevation={3} sx={{ 
            flex: '0 0 50%',  // Fixed at 50% height, won't grow or shrink
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'  // Allow scrolling within the metadata container
          }}>
            <Typography variant="h6" gutterBottom>
              Metadata
            </Typography>
            <Box sx={{ 
              overflow: 'auto',  // Enable scrolling
              flex: 1
            }}>
              <MetadataViewer 
                selectedFile={selectedFile} 
                selectedSignalIndex={selectedSignal ? selectedSignal.index : null} 
              />
            </Box>
          </Paper>
        </Box>

        {/* Center Column: Spectrum Viewer */}
        <Paper elevation={3} sx={{ 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'  // Prevent any overflow
        }}>
          <Typography variant="h6" gutterBottom>
            Spectrum View
          </Typography>
          <Box sx={{ flex: 1, position: 'relative' }}>
            {selectedSignal?.capabilities.hasSpectrum && (
              <SpectrumViewerRoot
                selectedFile={selectedFile}
                selectedSignal={selectedSignal}
                regionSpectrumData={regionSpectrumData}
                selectedRegion={selectedRegion}
              />
            )}
          </Box>
        </Paper>

        {/* Right Column: Periodic Table and Image Viewer */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          height: '100%'
        }}>
          {/* Periodic Table */}
          <Paper elevation={3} sx={{ 
            flex: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" gutterBottom>
              Periodic Table
            </Typography>
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default',
              borderRadius: 1
            }}>
              <Typography variant="h5" color="text.secondary">
                Periodic Table Here
              </Typography>
            </Box>
          </Paper>

          {/* Image Viewer */}
          {selectedSignal?.capabilities.hasImage && (
            <Paper elevation={3} sx={{ 
              flex: 1,
              p: 2,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" gutterBottom>
                Image View
              </Typography>
              <Box sx={{ flex: 1, position: 'relative' }}>
                <ImageViewer 
                  selectedFile={selectedFile}
                  selectedSignal={selectedSignal}
                  onRegionSelected={handleRegionSelected}
                />
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default App
