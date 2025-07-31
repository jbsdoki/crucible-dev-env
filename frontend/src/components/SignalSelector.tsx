// React was unused
// import React, { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, Chip, Stack } from '@mui/material';
import { getSignals } from '../services/api';

interface SignalCapabilities {
  hasSpectrum: boolean;
  hasImage: boolean;
}

interface SignalInfo {
  index: number;    // Position in the file's signal list
  title: string;    // Signal title from metadata or default
  type: string;     // HyperSpy signal class name
  shape: number[];  // Data dimensions
  capabilities: SignalCapabilities;  // What the signal can be used for
}

interface SignalSelectorProps {
  selectedFile: string;
  onSignalSelect: (signal: SignalInfo | null) => void;  // Callback when signal is selected
}

/**
 * SignalSelector Component
 * 
 * Provides a dropdown menu for selecting a signal from a file.
 * When a file is selected, it fetches all available signals from that file
 * and displays them in a dropdown menu.
 * 
 * Each signal shows:
 * - Title (from metadata or "Signal X")
 * - Type (Signal1D, Signal2D, etc.)
 * - Shape (dimensions of the data)
 * - Capabilities (Spectrum and/or Image)
 * 
 * @param selectedFile - Currently selected file path
 * @param onSignalSelect - Callback when a signal is selected
 */
function SignalSelector({ selectedFile, onSignalSelect }: SignalSelectorProps) {
  // State for list of available signals
  const [signals, setSignals] = useState<SignalInfo[]>([]);
  // State for currently selected signal index (-1 means none selected)
  const [selectedSignal, setSelectedSignal] = useState<number>(-1);
  // State for error messages
  const [error, setError] = useState<string>('');
  // State for loading indicator
  const [loading, setLoading] = useState<boolean>(false);

  // Effect to fetch signals when selectedFile changes
  useEffect(() => {
    const fetchSignals = async () => {
      // console.log('Selected file:', selectedFile);

      // Reset states immediately when file changes
      setSignals([]);
      setSelectedSignal(-1);
      onSignalSelect(null);

      // Reset states if no file selected
      if (!selectedFile) {
        console.log('No file selected, resetting states');
        console.log('=== Ending fetchSignals - no file selected in SignalSelector.tsx SignalSelector.tsx ===');
        return;
      }

      try {
        // console.log('Fetching signals from file...');
        setLoading(true);
        setError('');

        // Get signals from backend
        const data = await getSignals(selectedFile);
        // console.log('Received signals from backend:', data);

        // Update signals list
        setSignals(data.signals);
        // console.log(`Loaded ${data.signals.length} signals:`, 
        //   data.signals.map((s: SignalInfo) => ({
        //     title: s.title,
        //     type: s.type,
        //     shape: s.shape,
        //     capabilities: s.capabilities
        //   }))
        // );
        // console.log('=== Ending fetchSignals successfully in SignalSelector.tsx ===');
        
      } catch (err) {
        console.error('Error fetching signals:', err);
        setError(`Error fetching signals: ${(err as Error).message}`);
        console.log('=== Ending fetchSignals with error ===');
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, [selectedFile, onSignalSelect]);

  const handleSignalChange = (event: any) => {
    const index = event.target.value as number;
    setSelectedSignal(index);
    
    if (index === -1) {
      console.log('No signal selected');
      onSignalSelect(null);
    } else {
      const signal = signals.find(s => s.index === index);
      if (signal) {
        // console.log('Signal selected:', {
        //   index: signal.index,
        //   title: signal.title,
        //   capabilities: signal.capabilities
        // });
        onSignalSelect(signal);
      }
    }
  };

  const result = (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ 
        typography: 'h5', 
        mb: 2, 
        textAlign: 'center',
        color: 'text.primary',
        fontWeight: 'medium'
      }}>
        Select Signal
      </Box>
      <FormControl fullWidth error={!!error}>
        <InputLabel>Select Signal</InputLabel>
        <Select
          value={selectedSignal}
          label="Select Signal"
          onChange={handleSignalChange}
        >
          <MenuItem value={-1}>None</MenuItem>
          {signals.map((signal) => (
            <MenuItem key={signal.index} value={signal.index}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Typography>
                  {signal.title} ({signal.type}, Shape: {signal.shape ? signal.shape.join('×') : 'unknown'})
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  {signal.capabilities.hasSpectrum && (
                    <Chip 
                      label="Spectrum" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  )}
                  {signal.capabilities.hasImage && (
                    <Chip 
                      label="Image" 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      {loading && (
        <Typography sx={{ mt: 1 }}>
          Loading signals...
        </Typography>
      )}
    </Box>
  );

  return result;
}

export default SignalSelector; 