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
 *   ├─ ImageViewer (./components/ImageViewer.tsx)
 *   │   - Displays the image from the file
 *   ├─ MetadataViewer (./components/MetadataViewer.tsx)
 *   │   - Shows metadata for selected file
 *   └─ SpectrumViewer (./components/SpectrumViewer.tsx)
 *        - Handles spectrum visualization
 *        - Makes API calls to the FastAPI backend
 * 
 * Layout:
 * - Uses CSS Grid for a responsive layout
 * - Left column: Image and Metadata
 * - Right column: Spectrum
 */

import { useState } from 'react'
import SpectrumViewer from './components/SpectrumViewer'
import ImageViewer from './components/ImageViewer'
import MetadataViewer from './components/MetadataViewer'
import FileSelector from './components/FileSelector'
import { Box } from '@mui/material'
import './App.css'

/**
 * App Component
 * 
 * Manages the main application state and layout.
 * Handles file selection and distributes the selected file to child components.
 */
function App() {
  const [selectedFile, setSelectedFile] = useState<string>('');

  return (
    <Box className="App">
      {/* File Selector */}
      <Box sx={{ maxWidth: '800px', margin: '0 auto', mb: 4 }}>
        <FileSelector 
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />
      </Box>

      {/* Main Content Grid */}
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
          <ImageViewer />
          <MetadataViewer selectedFile={selectedFile} />
        </Box>

        {/* Right Column: Spectrum Viewer */}
        <Box>
          <SpectrumViewer />
        </Box>
      </Box>
    </Box>
  )
}

export default App
