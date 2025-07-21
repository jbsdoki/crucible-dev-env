import { useState, useEffect } from 'react';
import { Box, TextField, Typography, Paper } from '@mui/material';
import { useEmissionLineContext } from '../contexts/EmissionLineContext';
import { getEmissionSpectraWidthSum } from '../services/api';

interface EmissionSpectraWidthSumProps {
  selectedFile: string;
  selectedSignalIndex: number;
}

export default function EmissionSpectraWidthSum({ selectedFile, selectedSignalIndex }: EmissionSpectraWidthSumProps) {
  const [width, setWidth] = useState<number>(0.1); // Default width of 0.1 keV
  const [sums, setSums] = useState<Record<string, number | string>>({});
  const { selectedEmissionLine } = useEmissionLineContext();

  useEffect(() => {
    async function fetchSums() {
      if (!selectedEmissionLine || !selectedFile) return;

      const newSums: Record<string, number | string> = {};
      
      // Loop through each emission line
      for (const [lineName, energy] of Object.entries(selectedEmissionLine.EmissionLines)) {
        if (energy !== null) {
          try {
            // Convert energy ± width to energy range in keV
            const start = Math.max(0, energy - width);
            const end = energy + width;
            
            console.log(`Calculating range for ${lineName}:`, {
              energy,
              width,
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
  }, [selectedEmissionLine, selectedFile, selectedSignalIndex, width]);

  const handleWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseFloat(event.target.value);
    if (!isNaN(newWidth) && newWidth > 0) {
      setWidth(newWidth);
    }
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
        <TextField
          label="Energy Width (keV)"
          type="number"
          value={width}
          onChange={handleWidthChange}
          inputProps={{ step: 0.1, min: 0.1 }}
          size="small"
          sx={{ mt: 1 }}
        />
      </Box>
      
      <Box>
        {Object.entries(selectedEmissionLine.EmissionLines).map(([lineName, energy]) => {
          if (energy === null) return null;
          
          const sum = sums[lineName];
          
          return (
            <Box key={lineName} sx={{ mb: 1 }}>
              <Typography>
                {lineName.toUpperCase()}: {energy.toFixed(2)} keV
                <Box component="span" sx={{ ml: 2, fontWeight: 'bold' }}>
                  Sum: {typeof sum === 'number' ? sum.toLocaleString() : sum || 'Loading...'}
                </Box>
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
