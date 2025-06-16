import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import { getSignals } from '../services/api';

interface SignalInfo {
  index: number;
  title: string;
  type: string;
  shape: number[] | null;
}

interface SignalSelectorProps {
  selectedFile: string;
}

/**
 * SignalSelector Component
 * 
 * Provides a dropdown menu for selecting a signal from a file.
 * 
 * @param selectedFile - Currently selected file
 */
function SignalSelector({ selectedFile }: SignalSelectorProps) {
  const [signals, setSignals] = useState<SignalInfo[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<number>(-1);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSignals = async () => {
      if (!selectedFile) {
        setSignals([]);
        setSelectedSignal(-1);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await getSignals(selectedFile);
        setSignals(data.signals);
        setSelectedSignal(-1);
      } catch (err) {
        console.error('Error fetching signals:', err);
        setError(`Error fetching signals: ${(err as Error).message}`);
        setSignals([]);
      } finally {
        setLoading(false);
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
          onChange={(e) => setSelectedSignal(e.target.value as number)}
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