import { useState, useEffect } from 'react';
import { Box, TextField, Typography, Paper, Stack, Button } from '@mui/material';
import { useEmissionLineContext } from '../contexts/EmissionLineContext';
import { getEmissionSpectraWidthSum } from '../services/api';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MapIcon from '@mui/icons-material/Map';

interface EmissionSpectraWidthSumProps {
  selectedFile: string;
  selectedSignalIndex: number;
}

interface ButtonStates {
  spectrum: boolean;
  map: boolean;
}

export default function EmissionSpectraWidthSum({ selectedFile, selectedSignalIndex }: EmissionSpectraWidthSumProps) {
  // Replace single width with start and end offsets
  const [startOffset, setStartOffset] = useState<number>(0.1); // Default offset of 0.1 keV before the line
  const [endOffset, setEndOffset] = useState<number>(0.1); // Default offset of 0.1 keV after the line
  const [sums, setSums] = useState<Record<string, number | string>>({});
  // Add state for tracking button toggles for each emission line
  const [buttonStates, setButtonStates] = useState<Record<string, ButtonStates>>({});
  const { selectedEmissionLine } = useEmissionLineContext();

  // Initialize button states when emission line changes
  useEffect(() => {
    if (selectedEmissionLine) {
      const initialStates: Record<string, ButtonStates> = {};
      Object.keys(selectedEmissionLine.EmissionLines).forEach(lineName => {
        initialStates[lineName] = { spectrum: false, map: false };
      });
      setButtonStates(initialStates);
    }
  }, [selectedEmissionLine]);

  useEffect(() => {
    async function fetchSums() {
      if (!selectedEmissionLine || !selectedFile) return;

      const newSums: Record<string, number | string> = {};
      
      // Loop through each emission line
      for (const [lineName, energy] of Object.entries(selectedEmissionLine.EmissionLines)) {
        if (energy !== null) {
          try {
            // Calculate range using start and end offsets
            const start = Math.max(0, energy - startOffset);
            const end = energy + endOffset;
            
            console.log(`Calculating range for ${lineName}:`, {
              energy,
              startOffset,
              endOffset,
              start,
              end,
              unit: 'keV'
            });
            
            // Fetch the sum for this range using energy values
            const sum = await getEmissionSpectraWidthSum(
              selectedFile,
              selectedSignalIndex,
              start,
              end
            );
            
            newSums[lineName] = sum;
          } catch (error) {
            console.error(`Error fetching sum for ${lineName}:`, error);
            newSums[lineName] = 'Error fetching data';
          }
        }
      }
      
      setSums(newSums);
    }

    fetchSums();
  }, [selectedEmissionLine, selectedFile, selectedSignalIndex, startOffset, endOffset]);

  const handleStartOffsetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newOffset = parseFloat(event.target.value);
    if (!isNaN(newOffset) && newOffset >= 0) {
      setStartOffset(newOffset);
    }
  };

  const handleEndOffsetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newOffset = parseFloat(event.target.value);
    if (!isNaN(newOffset) && newOffset >= 0) {
      setEndOffset(newOffset);
    }
  };

  const handleSpectrumToggle = (lineName: string) => {
    setButtonStates(prev => ({
      ...prev,
      [lineName]: {
        ...prev[lineName],
        spectrum: !prev[lineName].spectrum
      }
    }));
  };

  const handleMapToggle = (lineName: string) => {
    setButtonStates(prev => ({
      ...prev,
      [lineName]: {
        ...prev[lineName],
        map: !prev[lineName].map
      }
    }));
  };

  if (!selectedEmissionLine) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Select an element from the periodic table</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">
          {selectedEmissionLine.Element} Emission Line Sums
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Start Offset (keV)"
            type="number"
            value={startOffset}
            onChange={handleStartOffsetChange}
            inputProps={{ step: 0.1, min: 0 }}
            size="small"
            helperText="Distance before emission line"
          />
          <TextField
            label="End Offset (keV)"
            type="number"
            value={endOffset}
            onChange={handleEndOffsetChange}
            inputProps={{ step: 0.1, min: 0 }}
            size="small"
            helperText="Distance after emission line"
          />
        </Stack>
      </Box>
      
      <Box>
        {Object.entries(selectedEmissionLine.EmissionLines).map(([lineName, energy]) => {
          if (energy === null) return null;
          
          const sum = sums[lineName];
          const start = Math.max(0, energy - startOffset);
          const end = energy + endOffset;
          
          return (
            <Box 
              key={lineName} 
              sx={{ 
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography>
                  {lineName.toUpperCase()}: {energy.toFixed(2)} keV
                  <Box component="span" sx={{ ml: 2 }}>
                    Range: {start.toFixed(2)} - {end.toFixed(2)} keV
                  </Box>
                  <Box component="span" sx={{ ml: 2, fontWeight: 'bold' }}>
                    Sum: {typeof sum === 'number' ? sum.toLocaleString() : sum || 'Loading...'}
                  </Box>
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  variant={buttonStates[lineName]?.spectrum ? "contained" : "outlined"}
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => {
                    handleSpectrumToggle(lineName);
                    console.log('Display on Spectrum Viewer clicked for', lineName);
                  }}
                  sx={{
                    ...(buttonStates[lineName]?.spectrum && {
                      backgroundColor: '#1976d2', // Material-UI primary blue
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#1565c0' // Slightly darker blue on hover
                      }
                    })
                  }}
                >
                  Display on Spectrum
                </Button>
                <Button
                  variant={buttonStates[lineName]?.map ? "contained" : "outlined"}
                  size="small"
                  startIcon={<MapIcon />}
                  onClick={() => {
                    handleMapToggle(lineName);
                    console.log('Display on 2D Mapping clicked for', lineName);
                  }}
                  sx={{
                    ...(buttonStates[lineName]?.map && {
                      backgroundColor: '#1976d2', // Material-UI primary blue
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#1565c0' // Slightly darker blue on hover
                      }
                    })
                  }}
                >
                  Display on 2D Map
                </Button>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
