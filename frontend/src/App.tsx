/**
 * Main Application Component
 * 
 * This is the root component of the React application, rendered in main.tsx.
 * It serves as the entry point for the application's component tree.
 * 
 * Data Flow:
 * ↓ = Data passed down to child components
 * ↑ = Callbacks/events passed up from child components
 * 
 * Component Structure:
 * - App.tsx (You are here)
 *   ├─ FileSelector
 *   │   ↓ selectedFile: Current selected file path
 *   │   ↑ onFileSelect: Notifies parent of file selection
 *   ├─ SignalSelector
 *   │   ↓ selectedFile: Current file to get signals from
 *   │   ↑ onSignalSelect: Notifies parent of signal selection
 *   ├─ HAADFViewer
 *   │   ↓ selectedFile: File to display HAADF image from
 *   ├─ MetadataViewer
 *   │   ↓ selectedFile: File to show metadata for
 *   │   ↓ selectedSignalIndex: Specific signal's metadata to show
 *   ├─ SpectrumViewerRoot
 *   │   ↓ selectedFile: File to get spectrum from
 *   │   ↓ selectedSignal: Signal containing spectrum data
 *   │   ↓ regionSpectrumData: Spectrum data for selected region
 *   │   ↓ selectedRegion: Currently selected region coordinates
 *   └─ ImageViewer
 *       ↓ selectedFile: File to display image from
 *       ↓ selectedSignal: Signal containing image data
 *       ↑ onRegionSelected: Notifies parent of region selection with spectrum data
 */

import { useState } from 'react'
import SpectrumViewerRoot from './components/SpectrumViewer/SpectrumViewerRoot'
import type { SpectrumData } from './components/SpectrumViewer/types'
import ImageViewer from './components/ImageViewer'
import HAADFViewer from './components/HAADFViewer'
import MetadataViewer from './components/MetadataViewer'
import FileSelector from './components/FileSelector'
import SignalSelector from './components/SignalSelector'
import SpectrumToImage from './components/SpectrumToImage/SpectrumRangeVisualizer'
import PeriodicTable from './components/PeriodicTable/PeriodicTable'
import { Box, Typography, Paper, Button } from '@mui/material'
import { SpectrumProvider } from './contexts/SpectrumRangeContext'
import { EmissionLineProvider } from './contexts/EmissionLineContext'
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
  const [regionSpectrumData, setRegionSpectrumData] = useState<SpectrumData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);

  // Handler for region selection from ImageViewer
  const handleRegionSelected = (
    region: {x1: number, y1: number, x2: number, y2: number},
    spectrumData: SpectrumData
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
        {/* <ContextTest /> */}
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
        {/* FileSelector Props:
           * ↓ selectedFile: Data passed down - current selected file path
           * ↑ onFileSelect: Callback passed up - notifies parent of file selection
           */}
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
      <SpectrumProvider>
        <EmissionLineProvider>
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
                {/* HAADFViewer Props:
                  * ↓ selectedFile: Data passed down - file to display HAADF image from
                  */}
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
                {/* This is where the metadata is passed from the file to the metadata viewer
                  * MetadataViewer Props:
                  * ↓ selectedFile: Data passed down - file to show metadata for
                  * ↓ selectedSignalIndex: Data passed down - specific signal's metadata to show
                  */}
                <MetadataViewer 
                  selectedFile={selectedFile} 
                  selectedSignalIndex={selectedSignal ? selectedSignal.index : null} 
                />
              </Box>
            </Paper>
          </Box>

          {/* Center Column: Spectrum Viewer and SpectrumToImage */}
          {/* SpectrumProvider is the shared context for SpectrumViewer and SpectrumToImage*/}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Spectrum Viewer */}
              <Paper elevation={3} sx={{ 
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden'
              }}>
                <Typography variant="h6" gutterBottom>
                  Spectrum View
                </Typography>
                <Box sx={{ flex: 1, position: 'relative' }}>
                  {/* SpectrumViewerRoot Props:
                    * ↓ selectedFile: Data passed down - file to get spectrum from
                    * ↓ selectedSignal: Data passed down - signal containing spectrum data
                    * ↓ regionSpectrumData: Data passed down - spectrum data for selected region
                    * ↓ selectedRegion: Data passed down - currently selected region coordinates
                    */}
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

              {/* SpectrumToImage */}
              <Paper elevation={3} sx={{ 
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '200px'
              }}>
                <SpectrumToImage />
              </Paper>
            </Box>

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
              flexDirection: 'column',
              overflow: 'auto',
              minWidth: '700px', // Ensure minimum width for periodic table
              '& > .MuiBox-root': {
                minHeight: 'min-content' // Allow content to determine height
              }
            }}>
              <Typography variant="h6" gutterBottom>
                Periodic Table
              </Typography>
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                bgcolor: 'background.default',
                borderRadius: 1,
                overflow: 'auto',
                padding: 1
              }}>
                <PeriodicTable />
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
                  {/* This is where the image data is passed from App.tsx to the image viewer */}
                  {/* ImageViewer Props:
                    * ↓ selectedFile: Data passed down - file to display image from
                    * ↓ selectedSignal: Data passed down - signal containing image data
                    * ↑ onRegionSelected: Callback passed up - notifies parent of region selection with spectrum data
                    */}
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
      </EmissionLineProvider>
    </SpectrumProvider>   
  </Box>
  );
}

export default App
