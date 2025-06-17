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
 *   └─ SignalSelector (./components/SignalSelector.tsx)
 *        - Handles signal selection from files
 * 
 * Layout:
 * - Simple vertical layout focusing on file and signal selection
 */

import { useState } from 'react'
// import SpectrumViewer from './components/SpectrumViewer'
// import ImageViewer from './components/ImageViewer'
// import MetadataViewer from './components/MetadataViewer'
import FileSelector from './components/FileSelector'
import SignalSelector from './components/SignalSelector'
import { Box } from '@mui/material'
import './App.css'

/**
 * App Component
 * 
 * Manages the main application state and layout.
 * Handles file selection and signal selection.
 */
function App() {
  const [selectedFile, setSelectedFile] = useState<string>('');

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
        />
        {selectedFile && <SignalSelector selectedFile={selectedFile} />}
      </Box>

      {/* Commented out main content grid for now */}
      {/* <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '2rem',
          padding: '2rem',
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <ImageViewer selectedFile={selectedFile} />
          <MetadataViewer selectedFile={selectedFile} />
        </Box>

        <Box>
          <SpectrumViewer selectedFile={selectedFile} />
        </Box>
      </Box> */}
    </Box>
  )
}

export default App
