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
  console.log('=== Starting FileSelector component from FileSelector.tsx ===');
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchFiles = async () => {
      console.log('=== Starting fetchFiles ===');
      try {
        //Calls getFiles in frontend/src/services/api.ts 
        // which calls get_file_list() in backend/main.py
        const fileList = await getFiles();  
        setFiles(fileList);
        setError('');
        console.log('=== Ending fetchFiles successfully from FileSelector.tsx ===');
      } catch (err) {
        setError(`Error fetching files: ${(err as Error).message}`);
        console.log('=== Ending fetchFiles with error from FileSelector.tsx ===');
      }
    };

    fetchFiles();
  }, []);

  const result = (
    <Box sx={{ width: '100%', mb: 2 }}>
      <FormControl fullWidth error={!!error}>
        <InputLabel>Select File</InputLabel>
        <Select
          value={selectedFile}
          label="Select File"
          onChange={(e) => {
            console.log('=== Starting file selection change handler ===');
            onFileSelect(e.target.value);
            console.log('=== Ending file selection change handler ===');
          }}
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
  
  console.log('=== Ending FileSelector component from FileSelector.tsx ===');
  return result;
}

export default FileSelector; 