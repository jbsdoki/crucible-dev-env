/*##########################################################################################################
 * EmissionLineAnalysis Component (EmissionSpectraWidthSum)
 * 
 * Purpose:
 * This component analyzes and displays emission line data for selected elements from the periodic table.
 * It allows users to:
 * 1. View emission line energies range sums for selected elements
 * 2. Set custom energy ranges around emission lines (start and end offsets)
 * 4. Toggle visibility of ranges on both spectrum and 2D map visualizations (2D MAP NOT IMPLEMENTED YET)
 * 
 * Data Flow:
 * - Receives selected element data from EmissionLineContext (Originally from PeriodicTable component)
 * - Sends range data to EmissionRangeContext for spectrum visualization
 * - Fetches sum calculations from backend API
 * 
 * Props:
 * @param {string} selectedFile - Path to the currently selected data file
 * @param {number} selectedSignalIndex - Index of the selected signal in the file
 * 
 * Context Usage:
 * - EmissionLineContext: Receives selected element and emission line data
 * - EmissionRangeContext: Sends range data for spectrum visualization
 * 
 * Data Operations and Flow:
 * 1. Data Reception:
 *    - selectedEmissionLine: Received from EmissionLineContext (../contexts/EmissionLineFromTableContext)
 *      Contains element details and emission line energies selected in the Periodic Table
 * 
 * 2. API Calls:
 *    - getEmissionSpectraWidthSum: Called from ../services/api
 *      Fetches sum calculations for each emission line range from the backend
 *      Parameters: selectedFile, selectedSignalIndex, start energy, end energy
 *      Returns: numerical sum or error message
 * 
 * 3. Data Transmission:
 *    - To Spectrum Viewer: Via EmissionRangeContext (../contexts/EmissionRangeSelectionContext)
 *      Using addToSpectrum and removeFromSpectrum functions
 *      Sends: line name, energy, start/end range, color for visualization
 *    - To 2D Map: Not yet implemented, but structure is in place
 * 
 * 4. State Management:
 *    - buttonStates: Tracks UI state for spectrum/map toggles
 *    - sums: Stores API response data for each emission line
 *    - startOffset/endOffset: User-configurable range parameters
 ##########################################################################################################*/

import { useState, useEffect } from 'react';
import { Box, TextField, Typography, Paper, Stack, Button } from '@mui/material';
import { useEmissionLineContext } from '../contexts/EmissionLineFromTableContext';
import { useEmissionRange } from '../contexts/EmissionRangeSelectionContext';
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
  
  /*##########################################################################################################
   * Data Reception Section
   * 
   * Hooks used:
   * - useEmissionLineContext: Receives selected element data from Periodic Table
   * - useEmissionRange: Gets functions to send data to Spectrum Viewer
   * 
   * Context Sources:
   * - EmissionLineContext: ../contexts/EmissionLineFromTableContext
   * - EmissionRangeContext: ../contexts/EmissionRangeSelectionContext
   ##########################################################################################################*/
  const { selectedEmissionLine } = useEmissionLineContext();
  const { addToSpectrum, removeFromSpectrum } = useEmissionRange();

  // Initialize button states when emission line changes
  useEffect(() => {
    if (selectedEmissionLine) { //Code inside () doesn't run until selectedEmissionLine changes
      const initialStates: Record<string, ButtonStates> = {};
      Object.keys(selectedEmissionLine.EmissionLines).forEach(lineName => { //For each emission line, create new entry in initialStates
        initialStates[lineName] = { spectrum: false, map: false }; //Initialize button states to false
      });
      setButtonStates(initialStates); //Set the button states to the initial states
    }
  }, [selectedEmissionLine]);

  /*##########################################################################################################
   * Data Fetching Section
   * 
   * Function: fetchSums
   * Purpose: Retrieves sum calculations for each emission line range
   * 
   * API Call:
   * - Function: getEmissionSpectraWidthSum from ../services/api
   * - Parameters:
   *   - selectedFile: current data file path
   *   - selectedSignalIndex: current signal index
   *   - start: calculated start energy (energy - startOffset)
   *   - end: calculated end energy (energy + endOffset)
   * 
   * Data Storage:
   * - Updates 'sums' state with results
   * - Format: Record<string, number | string>
   *   - Key: emission line name
   *   - Value: numerical sum or error message
   ##########################################################################################################*/
  useEffect(() => {
    async function fetchSums() { //This is the function that fetches the sums from the backend
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
            // This calls the backend API for the sum of the emission line
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
    //Code inside () doesn't run until selectedEmissionLine, selectedFile, selectedSignalIndex, startOffset, or endOffset changes
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

  /*##########################################################################################################
   * Data Transmission Section
   * 
   * Function: handleSpectrumToggle
   * Purpose: Sends emission line range data to Spectrum Viewer
   * 
   * Data Flow:
   * 1. Source: Local state and props
   *    - Uses: selectedEmissionLine, startOffset, endOffset
   * 
   * 2. Destination: EmissionRangeContext
   *    - Via: addToSpectrum/removeFromSpectrum functions
   *    - Data Sent:
   *      {
   *        lineName: string,    // Emission line identifier
   *        energy: number,      // Center energy value
   *        start: number,       // Range start (energy - startOffset)
   *        end: number,         // Range end (energy + endOffset)
   *        color: string        // Visual styling
   *      }
   * 
   * 3. Effect: Updates Spectrum Viewer display through context
   ##########################################################################################################*/
  const handleSpectrumToggle = (lineName: string, energy: number) => {
    const newButtonStates = {
      ...buttonStates,
      [lineName]: {
        ...buttonStates[lineName],
        spectrum: !buttonStates[lineName].spectrum
      }
    };
    setButtonStates(newButtonStates);

    // If turning on, add to spectrum ranges
    if (newButtonStates[lineName].spectrum) {
      const start = Math.max(0, energy - startOffset);
      const end = energy + endOffset;
      addToSpectrum({
        lineName,
        energy,
        start,
        end,
        color: 'rgba(255, 0, 0, 0.2)'  // Semi-transparent red
      });
    } else {
      // If turning off, remove from spectrum ranges
      removeFromSpectrum(lineName);
    }

    console.log('Display on Spectrum clicked for', lineName, 'new state:', newButtonStates[lineName].spectrum);
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

  // Update ranges when offsets change
  useEffect(() => {
    if (!selectedEmissionLine) return;

    // Update ranges for all displayed lines
    Object.entries(selectedEmissionLine.EmissionLines).forEach(([lineName, energy]) => {
      if (energy !== null && buttonStates[lineName]?.spectrum) {
        const start = Math.max(0, energy - startOffset);  // energy is emission line value in keV
        const end = energy + endOffset;
        // Assuming addToSpectrum and removeFromSpectrum are defined elsewhere or will be added.
        // For now, we'll just log the action.
        console.log('Updating spectrum ranges for', lineName, { start, end });
      }
    });
  }, [selectedEmissionLine, startOffset, endOffset, buttonStates]);

  if (!selectedEmissionLine) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Select an element from the periodic table</Typography>
      </Box>
    );
  }

  /*
  This is the main component that displays the emission line ranges
  */

  return (
    // Main container with padding and margin
    <Paper sx={{ p: 2, m: 2 }}>
      {/* Header section with element name and offset controls */}
      <Box sx={{ mb: 2 }}>
        {/* Display selected element name */}
        <Typography variant="h6">
          {selectedEmissionLine.Element} Emission Line Sums
        </Typography>
        
        {/* Offset input controls arranged horizontally */}
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          {/* Start offset input field */}
          <TextField
            label="Start Offset (keV)"
            type="number"
            value={startOffset}
            onChange={handleStartOffsetChange}
            inputProps={{ step: 0.1, min: 0 }}
            size="small"
            helperText="Distance before emission line"
          />
          {/* End offset input field */}
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
      
      {/* Emission lines list container */}
      <Box>
        {/* Map through each emission line of the selected element */}
        {Object.entries(selectedEmissionLine.EmissionLines).map(([lineName, energy]) => {
          if (energy === null) return null; // Skip null energy values
          
          const sum = sums[lineName];
          const start = Math.max(0, energy - startOffset);
          const end = energy + endOffset;
          
          return (
            // Individual emission line row with flex layout
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
              {/* Left side: Line information display */}
              <Box sx={{ flexGrow: 1 }}>
                <Typography>
                  {/* Emission line name and energy */}
                  {lineName.toUpperCase()}: {energy.toFixed(2)} keV
                  {/* Range display */}
                  <Box component="span" sx={{ ml: 2 }}>
                    Range: {start.toFixed(2)} - {end.toFixed(2)} keV
                  </Box>
                  {/* Sum display with loading state handling */}
                  <Box component="span" sx={{ ml: 2, fontWeight: 'bold' }}>
                    Sum: {typeof sum === 'number' ? sum.toLocaleString() : sum || 'Loading...'}
                  </Box>
                </Typography>
              </Box>
              
              {/* Right side: Action buttons */}
              <Stack direction="row" spacing={1}>
                {/* Spectrum display toggle button */}
                <Button
                  variant={buttonStates[lineName]?.spectrum ? "contained" : "outlined"}
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => {
                    handleSpectrumToggle(lineName, energy);
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
                
                {/* 2D Map display toggle button */}
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
