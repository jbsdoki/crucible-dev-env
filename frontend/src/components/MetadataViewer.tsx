import { useState, useEffect } from 'react';
// Divider was unused
// import { Box, Paper, Typography, CircularProgress, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Box, Paper, Typography, CircularProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getMetadata } from '../services/api';

interface MetadataViewerProps {
  selectedFile: string;
  selectedSignalIndex: number | null;
}

type MetadataValue = string | number | boolean | object | null;
type MetadataDict = Record<string, Record<string, MetadataValue>>;

/**
 * Renders a metadata value, handling different types appropriately
 */
const MetadataValue = ({ value }: { value: MetadataValue }) => {
  if (value === null) return <Typography>null</Typography>;
  if (typeof value === 'object') {
    return (
      <Box sx={{ pl: 2 }}>
        {Object.entries(value).map(([key, val]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Typography component="span" sx={{ mr: 1 }}>{key}:</Typography>
            <Box component="span">
              <MetadataValue value={val} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }
  return <Typography component="span">{String(value)}</Typography>;
};

/**
 * MetadataViewer Component
 * 
 * Displays metadata for a specific signal in the microscopy file, including:
 * - Signal type and shape
 * - Axes information
 * - Original metadata from the file
 * 
 * @param selectedFile - Name of the currently selected file
 * @param selectedSignalIndex - Index of the selected signal
 */
function MetadataViewer({ selectedFile, selectedSignalIndex }: MetadataViewerProps) {
  const [metadata, setMetadata] = useState<MetadataDict | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!selectedFile || selectedSignalIndex === null) {
        setMetadata(null);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await getMetadata(selectedFile, selectedSignalIndex);
        setMetadata(data);
      } catch (err) {
        setError(`Error loading metadata: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [selectedFile, selectedSignalIndex]);

  if (!selectedFile || selectedSignalIndex === null) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography>Select a file and signal to view metadata</Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, mt: 2, bgcolor: 'error.light' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  if (!metadata) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Signal {selectedSignalIndex} Metadata: {selectedFile}
      </Typography>

      <Box sx={{ mt: 2 }}>
        {Object.entries(metadata).map(([category, data]) => (
          <Accordion key={category}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight="bold">{category}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <MetadataValue value={data} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  );
}

export default MetadataViewer; 