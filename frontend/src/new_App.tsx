import { useState } from 'react';
import { Button, Box } from '@mui/material';
import MainLayout from './WebPageLayouts/MainLayout';
import { SpectrumProvider } from './contexts/SpectrumRangeContext';
import { EmissionLineProvider } from './contexts/EmissionLineContext';
import FileSelector from './components/FileSelector';
import SignalSelector from './components/SignalSelector';
import ImageViewer from './components/ImageViewer';
import SpectrumViewerRoot from './components/SpectrumViewer/SpectrumViewerRoot';
import PeriodicTable from './components/PeriodicTable/PeriodicTable';
import MetadataViewer from './components/MetadataViewer';
import SpectrumToImage from './components/SpectrumRangeVisualizer/SpectrumRangeVisualizer';
import type { SignalInfo } from './types/shared';
import type { SpectrumData } from './components/SpectrumViewer/types';

/**
 * App Component
 * 
 * Root component of the application that manages the main application state
 * and composes the layout using the new grid-based layout.
 */
function App() {
  // State for test mode toggle (temporary)
  const [showTest, setShowTest] = useState(false);
  
  // File and signal selection state
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSignal, setSelectedSignal] = useState<SignalInfo | null>(null);
  
  // Region selection state for spectrum data
  const [regionSpectrumData, setRegionSpectrumData] = useState<SpectrumData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);

  // Handler for region selection
  const handleRegionSelected = (
    region: {x1: number, y1: number, x2: number, y2: number},
    spectrumData: SpectrumData
  ) => {
    setSelectedRegion(region);
    setRegionSpectrumData(spectrumData);
  };

  // Show test view if enabled
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
      </Box>
    );
  }

  return (
    <Box 
      className="App" 
      sx={{ 
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}
    >
      {/* Test toggle button */}
      <Button 
        variant="contained" 
        onClick={() => setShowTest(true)}
        sx={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}
      >
        Test Context
      </Button>

      {/* Main application layout with context providers */}
      <SpectrumProvider>
        <EmissionLineProvider>
          <MainLayout
            headerLeft={
              <FileSelector
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
              />
            }
            headerRight={
              selectedFile ? (
                <SignalSelector
                  selectedFile={selectedFile}
                  onSignalSelect={setSelectedSignal}
                />
              ) : (
                <Box sx={{ 
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%'
                }}>
                  Select a file to view available signals
                </Box>
              )
            }
            topLeft={
              <Box sx={{ 
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'white'
              }}>
                <Box sx={{ 
                  typography: 'h5', 
                  p: 2, 
                  textAlign: 'center',
                  color: 'text.primary',
                  fontWeight: 'medium'
                }}>
                  Select 2D Range
                </Box>
                <Box sx={{ flex: 1, position: 'relative' }}>
                  {selectedSignal?.capabilities.hasImage ? (
                    <ImageViewer
                      selectedFile={selectedFile}
                      selectedSignal={selectedSignal}
                      onRegionSelected={handleRegionSelected}
                    />
                  ) : (
                    <Box sx={{ 
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      {selectedFile 
                        ? "Select a signal with image capabilities to view image"
                        : "Select a file to view image"}
                    </Box>
                  )}
                </Box>
              </Box>
            }
            topCenter={
              <Box sx={{ 
                width: '100%',
                height: '100%',
                display: 'flex',
                bgcolor: 'white'
              }}>
                {selectedSignal?.capabilities.hasSpectrum ? (
                  <Box sx={{ flex: 1, position: 'relative' }}>
                    <SpectrumViewerRoot
                      selectedFile={selectedFile}
                      selectedSignal={selectedSignal}
                      regionSpectrumData={regionSpectrumData}
                      selectedRegion={selectedRegion}
                    />
                  </Box>
                ) : (
                  <Box sx={{ 
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%'
                  }}>
                    {selectedFile 
                      ? "Select a signal with spectrum capabilities to view spectrum"
                      : "Select a file to view spectrum"}
                  </Box>
                )}
              </Box>
            }
            topRight={
              <Box sx={{ 
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'white'
              }}>
                <Box sx={{ 
                  typography: 'h5', 
                  p: 2, 
                  textAlign: 'center',
                  color: 'text.primary',
                  fontWeight: 'medium'
                }}>
                  Periodic Table
                </Box>
                <Box sx={{ 
                  flex: 1, 
                  position: 'relative',
                  overflow: 'auto',
                  display: 'flex',
                  alignItems: 'center',  // Changed to center
                  justifyContent: 'center',
                  p: 2
                }}>
                  <Box sx={{
                    transform: 'scale(0.8)',  // Scale down to 80%
                    transformOrigin: 'center center'  // Scale from center
                  }}>
                    <PeriodicTable />
                  </Box>
                </Box>
              </Box>
            }
            bottomLeft={
              <Box sx={{ 
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'white'
              }}>
                <Box sx={{ 
                  typography: 'h5', 
                  p: 2, 
                  textAlign: 'center',
                  color: 'text.primary',
                  fontWeight: 'medium'
                }}>
                  Metadata
                </Box>
                <Box sx={{ 
                  flex: 1, 
                  position: 'relative',
                  overflow: 'auto',
                  p: 2
                }}>
                  {selectedFile ? (
                    <MetadataViewer 
                      selectedFile={selectedFile}
                      selectedSignalIndex={selectedSignal ? selectedSignal.index : null}
                    />
                  ) : (
                    <Box sx={{ 
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      Select a file to view metadata
                    </Box>
                  )}
                </Box>
              </Box>
            }
            bottomCenter={
              <Box sx={{ 
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'white'
              }}>
                <Box sx={{ 
                  typography: 'h5', 
                  p: 2, 
                  textAlign: 'center',
                  color: 'text.primary',
                  fontWeight: 'medium'
                }}>
                  Spectrum Range
                </Box>
                <Box sx={{ 
                  flex: 1, 
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2
                }}>
                  {selectedSignal?.capabilities.hasSpectrum ? (
                    <SpectrumToImage />
                  ) : (
                    <Box sx={{ 
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      {selectedFile 
                        ? "Select a signal with spectrum capabilities to view spectrum range"
                        : "Select a file to view spectrum range"}
                    </Box>
                  )}
                </Box>
              </Box>
            }
          />
        </EmissionLineProvider>
      </SpectrumProvider>
    </Box>
  );
}

export default App;
