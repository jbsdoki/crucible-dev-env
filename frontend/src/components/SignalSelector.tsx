import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import { getSignals } from '../services/api';

interface SignalInfo {
  index: number;    // Position in the file's signal list
  title: string;    // Signal title from metadata or default
  type: string;     // HyperSpy signal class name
  shape: number[];  // Data dimensions
}

interface SignalSelectorProps {
  selectedFile: string;
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
 * 
 * @param selectedFile - Currently selected file path
 */
function SignalSelector({ selectedFile }: SignalSelectorProps) {
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
      console.log('\n=== Signal Selector: File Selection Changed ===');
      console.log('Selected file:', selectedFile);

      // Reset states if no file selected
      if (!selectedFile) {
        console.log('No file selected, resetting states');
        setSignals([]);
        setSelectedSignal(-1);
        return;
      }

      try {
        console.log('Fetching signals from file...');
        setLoading(true);
        setError('');

        // Get signals from backend
        const data = await getSignals(selectedFile);
        console.log('Received signals from backend:', data);

        // Update signals list
        setSignals(data.signals);
        console.log(`Loaded ${data.signals.length} signals:`, 
          data.signals.map((s: SignalInfo) => ({
            title: s.title,
            type: s.type,
            shape: s.shape
          }))
        );

        // Reset signal selection
        setSelectedSignal(-1);
        
      } catch (err) {
        console.error('Error fetching signals:', err);
        setError(`Error fetching signals: ${(err as Error).message}`);
        setSignals([]);
      } finally {
        setLoading(false);
        console.log('=== Signal fetching complete ===\n');
      }
    };

    fetchSignals();
  }, [selectedFile]);

  return (
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
          onChange={(e) => {
            console.log('Signal selected:', {
              index: e.target.value,
              signal: signals.find(s => s.index === e.target.value)
            });
            setSelectedSignal(e.target.value as number);
          }}
        >
          <MenuItem value={-1}>None</MenuItem>
          {signals.map((signal) => (
            <MenuItem key={signal.index} value={signal.index}>
              {signal.title} ({signal.type}, Shape: {signal.shape ? signal.shape.join('×') : 'unknown'})
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
}

export default SignalSelector; 