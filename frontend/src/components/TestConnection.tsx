import { useState, useEffect } from 'react';
import { getFiles, getMetadata, getSpectrum } from '../services/api';

function TestConnection() {
  console.log('=== Starting TestConnection component ===');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [metadata, setMetadata] = useState<any>(null);
  const [spectrum, setSpectrum] = useState<number[]>([]);
  const [error, setError] = useState<string>('');

  // Test file list endpoint
  useEffect(() => {
    const fetchFiles = async () => {
      console.log('=== Starting fetchFiles ===');
      try {
        const fileList = await getFiles();
        setFiles(fileList);
        setError('');
        console.log('=== Ending fetchFiles successfully ===');
      } catch (err) {
        setError('Error fetching files: ' + (err as Error).message);
        console.log('=== Ending fetchFiles with error ===');
      }
    };
    fetchFiles();
  }, []);

  // Test metadata endpoint when a file is selected
  const handleFileSelect = async (filename: string) => {
    console.log('=== Starting handleFileSelect ===');
    try {
      setSelectedFile(filename);
      const fileMetadata = await getMetadata(filename);
      setMetadata(fileMetadata);
      setError('');
      console.log('=== Ending handleFileSelect successfully ===');
    } catch (err) {
      setError('Error fetching metadata: ' + (err as Error).message);
      console.log('=== Ending handleFileSelect with error ===');
    }
  };

  // Test spectrum endpoint
  const handleGetSpectrum = async () => {
    console.log('=== Starting handleGetSpectrum ===');
    if (!selectedFile) {
      console.log('=== Ending handleGetSpectrum - no file selected ===');
      return;
    }
    try {
      const spectrumData = await getSpectrum(selectedFile, 0, 0);
      setSpectrum(spectrumData);
      setError('');
      console.log('=== Ending handleGetSpectrum successfully ===');
    } catch (err) {
      setError('Error fetching spectrum: ' + (err as Error).message);
      console.log('=== Ending handleGetSpectrum with error ===');
    }
  };

  const result = (
    <div style={{ padding: '20px' }}>
      <h2>API Connection Test</h2>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <div>
        <h3>Available Files:</h3>
        <ul>
          {files.map((file) => (
            <li key={file}>
              <button onClick={() => handleFileSelect(file)}>{file}</button>
            </li>
          ))}
        </ul>
      </div>

      {selectedFile && (
        <div>
          <h3>Selected File: {selectedFile}</h3>
          <button onClick={handleGetSpectrum}>Get Spectrum at (0,0)</button>
        </div>
      )}

      {metadata && (
        <div>
          <h3>Metadata:</h3>
          <pre>{JSON.stringify(metadata, null, 2)}</pre>
        </div>
      )}

      {spectrum.length > 0 && (
        <div>
          <h3>Spectrum Data (first 5 points):</h3>
          <pre>{JSON.stringify(spectrum.slice(0, 5), null, 2)}</pre>
        </div>
      )}
    </div>
  );

  console.log('=== Ending TestConnection component ===');
  return result;
}

export default TestConnection; 