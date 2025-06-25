import React, { useState, useEffect } from 'react';
import { getFiles, getMetadata, getSpectrum, getRegionSpectrum } from '../services/api';

const TestConnection: React.FC = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const fileList = await getFiles();
      setFiles(fileList);
      if (fileList.length > 0) {
        setSelectedFile(fileList[0]);
      }
    } catch (err) {
      setError('Failed to fetch files');
      console.error('Error fetching files:', err);
    }
  };

  const fetchMetadata = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMetadata(selectedFile, 0);
      setMetadata(data);
    } catch (err) {
      setError('Failed to fetch metadata');
      console.error('Error fetching metadata:', err);
    }
    setLoading(false);
  };

  const testRegionSpectrum = async () => {
    if (!selectedFile) {
      console.error('No file selected');
      return;
    }
    try {
      console.log('Testing region spectrum with:', selectedFile);
      const result = await getRegionSpectrum(
        selectedFile,
        0,  // First signal
        {
          x1: 10,
          y1: 10,
          x2: 20,
          y2: 20
        }
      );
      console.log('Region spectrum result:', result);
    } catch (error) {
      console.error('Error testing region spectrum:', error);
    }
  };

  return (
    <div>
      <h2>Test Connection</h2>
      
      <div>
        <h3>Files</h3>
        <select 
          value={selectedFile} 
          onChange={(e) => setSelectedFile(e.target.value)}
        >
          {files.map(file => (
            <option key={file} value={file}>{file}</option>
          ))}
        </select>
      </div>

      <div>
        <button onClick={fetchMetadata} disabled={loading || !selectedFile}>
          Test Metadata
        </button>
        <button onClick={testRegionSpectrum} disabled={!selectedFile}>
          Test Region Spectrum
        </button>
      </div>

      {error && (
        <div style={{ color: 'red' }}>
          Error: {error}
        </div>
      )}

      {loading && <div>Loading...</div>}

      {metadata && (
        <div>
          <h3>Metadata Result:</h3>
          <pre>{JSON.stringify(metadata, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestConnection; 