/**
 * Main Application Component
 * 
 * This is the root component of the React application, rendered in main.tsx.
 * It serves as the entry point for the application's component tree.
 * 
 * Component Structure:
 * - App (You are here)
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
import SpectrumViewer from './components/SpectrumViewer'
import ImageViewer from './components/ImageViewer'
import MetadataViewer from './components/MetadataViewer'
import FileSelector from './components/FileSelector'
import SignalSelector from './components/SignalSelector'
import { Box, Typography, Paper } from '@mui/material'
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
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSignal, setSelectedSignal] = useState<SignalInfo | null>(null);

  return (
    <Box className="App">
      {/* File and Signal Selection */}
      <Box sx={{ maxWidth: '800px', margin: '0 auto', mt: 4, mb: 4 }}>
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
        /> {/* This triggers the signal selector to load the file */}
        {selectedFile && (
          <SignalSelector 
            selectedFile={selectedFile} 
            onSignalSelect={setSelectedSignal}
          />
        )}
      </Box>

      {/* Viewers Grid - Only shown when signal is selected */}
      {selectedSignal && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '2rem',
            padding: '2rem',
            maxWidth: '1600px',
            margin: '0 auto',
          }}
        >
          {/* Left Column: Image and Metadata */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {selectedSignal.capabilities.hasImage && (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Image View
                </Typography>
                <ImageViewer 
                  selectedFile={selectedFile}
                  selectedSignal={selectedSignal}
                />
              </Paper>
            )}
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Metadata
              </Typography>
              <MetadataViewer selectedFile={selectedFile} />
            </Paper>
          </Box>

          {/* Right Column: Spectrum */}
          {selectedSignal.capabilities.hasSpectrum && (
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Spectrum View
              </Typography>
              <SpectrumViewer 
                selectedFile={selectedFile}
                selectedSignal={selectedSignal}
              />
            </Paper>
          )}
        </Box>
      )}
    </Box>
  )
}

export default App
