import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import { getSignals } from '../services/api';

interface SignalInfo {
  index: number;
  title: string;
  dimensions: number;
  shape: number[];
  type: string;
}

interface SignalSelectorProps {
  selectedFile: string;
  onImageSignalSelect: (signalIndex: number) => void;
  onSpectrumSignalSelect: (signalIndex: number) => void;
}

/**
 * SignalSelector Component
 * 
 * Provides two dropdown menus for selecting image and spectrum signals from a file.
 * - Left dropdown: Shows 2D signals and 3D signals (which can be displayed as images)
 * - Right dropdown: Shows 1D signals and 3D signals (which can be displayed as spectra)
 * 
 * @param selectedFile - Currently selected file
 * @param onImageSignalSelect - Callback when an image signal is selected
 * @param onSpectrumSignalSelect - Callback when a spectrum signal is selected
 */
function SignalSelector({ selectedFile, onImageSignalSelect, onSpectrumSignalSelect }: SignalSelectorProps) {
  const [signals, setSignals] = useState<SignalInfo[]>([]);
  const [selectedImageSignal, setSelectedImageSignal] = useState<number>(-1);
  const [selectedSpectrumSignal, setSelectedSpectrumSignal] = useState<number>(-1);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSignals = async () => {
      if (!selectedFile) {
        console.log('No file selected, clearing signals');
        setSignals([]);
        setSelectedImageSignal(-1);
        setSelectedSpectrumSignal(-1);
        return;
      }

      try {
        console.log('Fetching signals for file:', selectedFile);
        setLoading(true);
        setError('');
        const data = await getSignals(selectedFile);
        console.log('Received signals:', data);
        setSignals(data.signals);
        
        // Reset selections
        setSelectedImageSignal(-1);
        setSelectedSpectrumSignal(-1);
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

  // Filter signals that can be displayed as images (2D or 3D)
  const imageSignals = signals.filter(signal => 
    signal.dimensions === 2 || signal.dimensions === 3
  );

  // Filter signals that can be displayed as spectra (1D or 3D)
  const spectrumSignals = signals.filter(signal => 
    signal.dimensions === 1 || signal.dimensions === 3
  );

  console.log('Available signals:', {
    all: signals,
    image: imageSignals,
    spectrum: spectrumSignals
  });

  const handleImageSignalChange = (index: number) => {
    console.log('Image signal selected:', index);
    setSelectedImageSignal(index);
    onImageSignalSelect(index);
  };

  const handleSpectrumSignalChange = (index: number) => {
    console.log('Spectrum signal selected:', index);
    setSelectedSpectrumSignal(index);
    onSpectrumSignalSelect(index);
  };

  if (!selectedFile) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Image Signal Selector */}
        <FormControl fullWidth>
          <InputLabel>Select Image Signal</InputLabel>
          <Select
            value={selectedImageSignal}
            label="Select Image Signal"
            onChange={(e) => handleImageSignalChange(e.target.value as number)}
          >
            <MenuItem value={-1}>None</MenuItem>
            {imageSignals.map((signal) => (
              <MenuItem key={signal.index} value={signal.index}>
                {signal.title} ({signal.dimensions}D: {signal.shape.join('×')})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Spectrum Signal Selector */}
        <FormControl fullWidth>
          <InputLabel>Select Spectrum Signal</InputLabel>
          <Select
            value={selectedSpectrumSignal}
            label="Select Spectrum Signal"
            onChange={(e) => handleSpectrumSignalChange(e.target.value as number)}
          >
            <MenuItem value={-1}>None</MenuItem>
            {spectrumSignals.map((signal) => (
              <MenuItem key={signal.index} value={signal.index}>
                {signal.title} ({signal.dimensions}D: {signal.shape.join('×')})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

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