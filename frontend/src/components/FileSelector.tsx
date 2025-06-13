import { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { getFiles } from '../services/api';

interface FileSelectorProps {
  selectedFile: string;
  onFileSelect: (filename: string) => void;
}

/**
 * FileSelector Component
 * 
 * Provides a dropdown menu for selecting files from the backend.
 * Handles fetching the file list and managing selection.
 * 
 * @param selectedFile - Currently selected file
 * @param onFileSelect - Callback function when a file is selected
 */
function FileSelector({ selectedFile, onFileSelect }: FileSelectorProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const fileList = await getFiles();
        setFiles(fileList);
        setError('');
      } catch (err) {
        setError(`Error fetching files: ${(err as Error).message}`);
      }
    };

    fetchFiles();
  }, []);

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <FormControl fullWidth error={!!error}>
        <InputLabel>Select File</InputLabel>
        <Select
          value={selectedFile}
          label="Select File"
          onChange={(e) => onFileSelect(e.target.value)}
        >
          {files.map((file) => (
            <MenuItem key={file} value={file}>
              {file}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default FileSelector; 