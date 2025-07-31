/*##########################################################################################################
 * EmissionLineAnalysis Component (EmissionSpectraWidthSum)
 * 
 * Purpose:
 * This component analyzes and displays emission line data for selected elements from the periodic table.
 * It allows users to:
 * 1. View emission line energies range sums for selected elements
 * 2. Set individual custom energy ranges for each emission line (start and end ranges)
 * 3. Toggle visibility of ranges on both spectrum and 2D map visualizations (2D MAP NOT IMPLEMENTED YET)
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
 *    - To EmissionLineRangeVisualizer: Via EmissionRangeToImageContext (../contexts/EmissionAnalysisToEmissionRangeImageContext)
 *      Using addRange and removeRange functions
 *      Sends: start/end range
 * 
 * 4. State Management:
 *    - buttonStates: Tracks UI state for spectrum/map toggles
 *    - sums: Stores API response data for each emission line
 *    - startRange/endRange: User-configurable range parameters from selecting range on component
 ##########################################################################################################*/

import { useState, useEffect } from 'react';
import { Box, TextField, Typography, Paper, Stack, Button } from '@mui/material';
import { useEmissionLineContext } from '../contexts/EmissionLineFromTableContext';
import { useEmissionRange } from '../contexts/EmissionRangeSelectionContext';
import { useEmissionRangeToImageContext } from '../contexts/EmissionAnalysisToEmissionRangeImageContext';
import { getEmissionSpectraWidthSum, getZeroPeakWidth } from '../services/api';
import { getAxesData } from '../services/api';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MapIcon from '@mui/icons-material/Map';

interface EmissionSpectraWidthSumProps {
  selectedFile: string;
  selectedSignalIndex: number;
}

interface ButtonStates {
  spectrum: boolean;
  map: boolean;
  mapRangeId?: number | null; // Track which range ID is associated with this button
}

export default function EmissionSpectraWidthSum({ selectedFile, selectedSignalIndex }: EmissionSpectraWidthSumProps) {
  // Global default ranges - set by zero peak width API, used as defaults for new emission lines
  const [startRange, setStartRange] = useState<number>(0.1); // Default range of 0.1 keV before the line
  const [endRange, setEndRange] = useState<number>(0.1); // Default range of 0.1 keV after the line
  const [sums, setSums] = useState<Record<string, number | string>>({});
  // Add state for tracking button toggles for each emission line
  const [buttonStates, setButtonStates] = useState<Record<string, ButtonStates>>({});
  // Add state for individual ranges for each emission line
  const [individualRanges, setIndividualRanges] = useState<Record<string, {start: number, end: number}>>({});
  
  /*##########################################################################################################
   * Data Reception Section
   * 
   * Hooks used:
   * - useEmissionLineContext: Receives selected element data from Periodic Table
   * - useEmissionRange: Gets functions to send data to Spectrum Viewer
   * - useEmissionRangeToImageContext: Sends range data to EmissionLineRangeVisualizer 
   * 
   * Context Sources:
   * - EmissionLineContext: ../contexts/EmissionLineFromTableContext
   * - EmissionRangeContext: ../contexts/EmissionRangeSelectionContext
   * - EmissionRangeToImageContext: ../contexts/EmissionAnalysisToEmissionRangeImageContext
   ##########################################################################################################*/
  const { selectedEmissionLine } = useEmissionLineContext();
  const { addToSpectrum, removeFromSpectrum } = useEmissionRange();
  const { 
    addRange,
    removeRange,
    setSelectedFile: setEmissionImageFile, 
    setSignalIndex: setEmissionImageSignalIndex 
  } = useEmissionRangeToImageContext();

  // Initialize button states and individual ranges when emission line changes
  useEffect(() => {
    if (selectedEmissionLine) { //Code inside () doesn't run until selectedEmissionLine changes
      const initialStates: Record<string, ButtonStates> = {};
      const initialRanges: Record<string, {start: number, end: number}> = {};
      
      Object.keys(selectedEmissionLine.EmissionLines).forEach(lineName => { //For each emission line, create new entry in initialStates
        initialStates[lineName] = { spectrum: false, map: false, mapRangeId: null }; //Initialize button states to false
        initialRanges[lineName] = { start: startRange, end: endRange }; //Initialize individual ranges with global defaults
      });
      
      setButtonStates(initialStates); //Set the button states to the initial states
      setIndividualRanges(initialRanges); //Set the individual ranges to the initial ranges
    }
  }, [selectedEmissionLine, startRange, endRange]);

  /*##########################################################################################################
   * Default Range Setting Section
   * 
   * Purpose: Set the default emission width to zeroPeakWidth or 0.1 as fallback
   * This useEffect fetches the zero peak width from the backend and updates the default ranges
   ##########################################################################################################*/
  useEffect(() => {
    async function fetchDefaultRange() {
      if (!selectedFile || selectedSignalIndex === undefined) return;
      
      try {
        const zeroPeakWidth = await getZeroPeakWidth(selectedFile, selectedSignalIndex);
        if (typeof zeroPeakWidth === 'number' && zeroPeakWidth > 0) {
          // Use half of the zero peak width as the default range
          const defaultRange = zeroPeakWidth;
          setStartRange(defaultRange);
          setEndRange(defaultRange);
          console.log(`Set default emission range to ${defaultRange.toFixed(3)} keV (half of zero peak width: ${zeroPeakWidth.toFixed(3)} keV)`);
        } else {
          // Fallback to 0.1 if zeroPeakWidth is invalid
          setStartRange(0.1);
          setEndRange(0.1);
          console.log('Using fallback default emission range of 0.1 keV');
        }
      } catch (error) {
        console.error('Error fetching zero peak width:', error);
        // Fallback to 0.1 if there's an error
        setStartRange(0.1);
        setEndRange(0.1);
        console.log('Using fallback default emission range of 0.1 keV due to error');
      }
    }

    fetchDefaultRange();
  }, [selectedFile, selectedSignalIndex]);

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
   *   - start: calculated start energy (energy - startRange)
   *   - end: calculated end energy (energy + endRange)
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
            // Use individual ranges if available, otherwise fall back to global ranges
            const lineRanges = individualRanges[lineName] || { start: startRange, end: endRange };
            
            // Calculate range using individual start and end ranges
            const start = Math.max(0, energy - lineRanges.start);
            const end = energy + lineRanges.end;
            
            console.log(`Calculating range for ${lineName}:`, {
              energy,
              startRange: lineRanges.start,
              endRange: lineRanges.end,
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
    //Code inside () doesn't run until selectedEmissionLine, selectedFile, selectedSignalIndex, or individualRanges changes
    //startRange and endRange are still dependencies as they provide defaults for individual ranges
  }, [selectedEmissionLine, selectedFile, selectedSignalIndex, startRange, endRange, individualRanges]); 



  // Handler for individual emission line range changes
  const handleIndividualRangeChange = (lineName: string, type: 'start' | 'end', value: string) => {
    const newValue = parseFloat(value);
    if (!isNaN(newValue) && newValue >= 0) {
      setIndividualRanges(prev => ({
        ...prev,
        [lineName]: {
          ...prev[lineName],
          [type]: newValue
        }
      }));
    }
  };

  /*##########################################################################################################
   * Data Transmission Section
   * 
   * Function: handleSpectrumToggle
   * Purpose: Sends emission line range data to Spectrum Viewer 
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
      // Use individual ranges if available, otherwise fall back to global ranges
      const lineRanges = individualRanges[lineName] || { start: startRange, end: endRange };
      const start = Math.max(0, energy - lineRanges.start);
      const end = energy + lineRanges.end;
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

  const handleMapToggle = async (lineName: string, energy: number) => {
    const currentState = buttonStates[lineName];
    const newMapState = !currentState.map;

    // If turning on, add to emission range collection
    if (newMapState) {
      // Use individual ranges if available, otherwise fall back to global ranges
      const lineRanges = individualRanges[lineName] || { start: startRange, end: endRange };
      const start = Math.max(0, energy - lineRanges.start);
      const end = energy + lineRanges.end;
      



      // Get the axes data from the backend for energy-to-index conversion
      const axesData = await getAxesData(selectedFile, selectedSignalIndex);
      console.log('Complete axes data object:', axesData);
      console.log('Axes Data Properties - Offset:', axesData.offset, 'Scale:', axesData.scale, 'Units:', axesData.units);

      // Convert from energy in KeV to index in 0 - 4095 indices
      // Translation formula for converting from 0 - 4095 indices to 0 ~ 40 KeV indices
      // Index = (Real - Offset) / Scale (Real is KeV, Index is 0 - 4095)
      // Real = (Index * Scale) + Offset
      const startIndex = Math.round((start - axesData.offset) / axesData.scale);
      const endIndex = Math.round((end - axesData.offset) / axesData.scale);
       
      console.log('EmissionLineAnalysis: Energy to Index Conversion:');
      console.log('  - Energy range:', start.toFixed(4), 'to', end.toFixed(4), 'keV');
      console.log('  - Axes data: offset =', axesData.offset, ', scale =', axesData.scale);
      console.log('  - Calculated indices:', startIndex, 'to', endIndex);
      console.log('  - Index range width:', endIndex - startIndex + 1, 'channels');
       
      // Add the range to the collection
      const newRangeId = addRange({
        indices: { start: startIndex, end: endIndex },
        energy: { start, end },
        lineName,
        element: selectedEmissionLine?.Element || 'Unknown'
      });

      if (newRangeId) {
        // Update button state with the new range ID
        const newButtonStates = {
          ...buttonStates,
          [lineName]: {
            ...currentState,
            map: true,
            mapRangeId: newRangeId
          }
        };
        setButtonStates(newButtonStates);

        // Set the file and signal index context
        setEmissionImageFile(selectedFile);
        setEmissionImageSignalIndex(selectedSignalIndex);
        
        console.log(`Added emission range ${newRangeId} for ${lineName}`);
      } else {
        console.warn('Failed to add emission range - maximum of 10 ranges reached');
      }
    } else {
      // If turning off, remove from emission range collection
      if (currentState.mapRangeId) {
        removeRange(currentState.mapRangeId);
        
        // Update button state to clear the range ID
        const newButtonStates = {
          ...buttonStates,
          [lineName]: {
            ...currentState,
            map: false,
            mapRangeId: null
          }
        };
        setButtonStates(newButtonStates);
        
        console.log(`Removed emission range ${currentState.mapRangeId} for ${lineName}`);
      }
    }
  };

  // Update ranges when range values change
  useEffect(() => {
    if (!selectedEmissionLine) return;

    // Update ranges for all displayed lines
    Object.entries(selectedEmissionLine.EmissionLines).forEach(([lineName, energy]) => {
      if (energy !== null && buttonStates[lineName]?.spectrum) {
        // Use individual ranges if available, otherwise fall back to global ranges
        const lineRanges = individualRanges[lineName] || { start: startRange, end: endRange };
        const start = Math.max(0, energy - lineRanges.start);  // energy is emission line value in keV
        const end = energy + lineRanges.end;
        console.log('Updating spectrum ranges for', lineName, { start, end });
      }
    });
  }, [selectedEmissionLine, startRange, endRange, buttonStates, individualRanges]);

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
    // Main container with padding and margin - let parent handle scrolling
    <Paper sx={{ 
      p: 2, 
      m: 2, 
      display: 'flex',
      flexDirection: 'column',
      height: '100%' // Fill the allocated grid space
    }}>
      {/* Header section with element name */}
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        {/* Display selected element name */}
        <Typography variant="h6">
          {selectedEmissionLine.Element} Emission Line Sums
        </Typography>
      </Box>
      
      {/* Emission lines list container */}
      <Box>
        {/* Map through each emission line of the selected element */}
        {Object.entries(selectedEmissionLine.EmissionLines).map(([lineName, energy]) => {
          if (energy === null) return null; // Skip null energy values
          
          const sum = sums[lineName];
          // Use individual ranges if available, otherwise fall back to global ranges
          const lineRanges = individualRanges[lineName] || { start: startRange, end: endRange };
          const start = Math.max(0, energy - lineRanges.start);
          const end = energy + lineRanges.end;
          
          return (
            // Individual emission line row with flex layout
            <Box 
              key={lineName} 
              sx={{ 
                mb: 2,
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                backgroundColor: '#fafafa'
              }}
            >
              {/* Emission line header */}
              <Typography variant="h6" sx={{ mb: 1 }}>
                {lineName.toUpperCase()}: {energy.toFixed(2)} keV
              </Typography>
              
              {/* Individual range controls for this emission line */}
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  label="Start Range (keV)"
                  type="number"
                  value={lineRanges.start}
                  onChange={(e) => handleIndividualRangeChange(lineName, 'start', e.target.value)}
                  inputProps={{ step: 0.01, min: 0 }}
                  size="small"
                  sx={{ minWidth: 120 }}
                />
                <TextField
                  label="End Range (keV)"
                  type="number" 
                  value={lineRanges.end}
                  onChange={(e) => handleIndividualRangeChange(lineName, 'end', e.target.value)}
                  inputProps={{ step: 0.01, min: 0 }}
                  size="small"
                  sx={{ minWidth: 120 }}
                />
              </Stack>
              
              {/* Range and sum information */}
              <Typography variant="body2" sx={{ mb: 1 }}>
                Range: {start.toFixed(2)} - {end.toFixed(2)} keV
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Sum: {typeof sum === 'number' ? sum.toLocaleString() : sum || 'Loading...'}
              </Typography>
              
              {/* Action buttons */}
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
                    handleMapToggle(lineName, energy);
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
