/**
 * RemoteDataTest Component
 * -----------------------
 * Test component for validating remote Crucible API data access using ORCID authentication.
 * This component provides a UI to test the backend's remote data router endpoints without
 * hardcoding ORCID credentials in the application.
 * 
 * Features:
 * - Input field for ORCID ID entry
 * - Buttons to test different remote API endpoints
 * - Display area for API responses and errors
 * - Loading states for better UX
 * 
 * Endpoints Tested:
 * - GET /remote/datasets (list all datasets)
 * - GET /remote/datasets?keyword=search (search datasets by keyword)
 * - GET /remote/datasets/{id} (get specific dataset details)
 * - POST /remote/datasets/{id}/download (download dataset to user directory)
 * - GET /remote/discover (discover available API endpoints)
 * - GET /remote/datasets/{id}/location (get dataset storage location)
 * - POST /remote/datasets/{id}/drive-location (get Google Drive location - most promising!)
 * - GET /remote/user/{orcid}/datasets (get user-specific datasets)
 * - GET /remote/datasets/{id}/access/{orcid} (check dataset access permissions)
 * - GET /remote/user/apikey (get API key permission information)
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

// API client setup for remote data endpoints
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false
});

interface Dataset {
  unique_id: string;
  dataset_name: string;
  [key: string]: any; // Allow additional properties
}

interface TestState {
  keyword: string;
  datasetId: string;
  loading: boolean;
  results: any;
  error: string | null;
  lastEndpoint: string | null;
}

interface RemoteDataTestProps {
  orcidId: string;
  onOrcidChange: (orcidId: string) => void;
}

const RemoteDataTest: React.FC<RemoteDataTestProps> = ({ orcidId, onOrcidChange }) => {
  const [state, setState] = useState<TestState>({
    keyword: '',
    datasetId: '',
    loading: false,
    results: null,
    error: null,
    lastEndpoint: null
  });

  /**
   * Updates component state with new values
   * @param updates - Partial state object to merge with current state
   */
  const updateState = (updates: Partial<TestState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  /**
   * Generic function to make API calls to remote data endpoints
   * @param endpoint - The API endpoint to call
   * @param method - HTTP method (GET, POST, etc.)
   * @param params - Query parameters for the request
   */
  const makeApiCall = async (endpoint: string, method: string = 'GET', params: any = {}) => {
    updateState({ loading: true, error: null, lastEndpoint: endpoint });
    
    try {
      // Add ORCID ID as query parameter for authentication
      const queryParams = {
        ...params,
        orcid_id: orcidId  // Add ORCID ID to query parameters
      };
      
      const response = await api.request({
        method,
        url: endpoint,
        params: queryParams,  // Always send ORCID as query parameter for authentication
        data: method !== 'GET' ? params : undefined,  // Send original params as body data for POST
      });

      updateState({ 
        results: response.data, 
        loading: false,
        error: null 
      });
      
    } catch (error: any) {
      console.error('API call error:', error);
      
      const errorData = error.response?.data;
      let errorMessage = error.response?.data?.error || 
                        error.response?.data?.detail || 
                        error.message || 
                        'Unknown error occurred';
      
      // If there's detailed remote error info, include it
      if (errorData?.remote_error) {
        console.log('Remote API error details:', errorData.remote_error);
        errorMessage += `\n\nRemote API Details: ${JSON.stringify(errorData.remote_error, null, 2)}`;
        
        if (errorData.endpoint) {
          errorMessage += `\nEndpoint: ${errorData.endpoint}`;
        }
        if (errorData.orcid_used) {
          errorMessage += `\nORCID: ${errorData.orcid_used}`;
        }
      }
                          
      updateState({ 
        error: `${error.response?.status || 'Network'} Error: ${errorMessage}`,
        loading: false,
        results: null 
      });
    }
  };

  /**
   * Test endpoint to list all datasets
   */
  const testListDatasets = async () => {
    if (!orcidId.trim()) {
      updateState({ error: 'Please enter an ORCID ID first' });
      return;
    }
    await makeApiCall('/remote/datasets');
  };

  /**
   * Test endpoint to search datasets by keyword
   */
  const testSearchDatasets = async () => {
    if (!orcidId.trim()) {
      updateState({ error: 'Please enter an ORCID ID first' });
      return;
    }
    if (!state.keyword.trim()) {
      updateState({ error: 'Please enter a keyword to search' });
      return;
    }
    await makeApiCall('/remote/datasets', 'GET', { keyword: state.keyword });
  };

  /**
   * Test endpoint to get specific dataset details
   */
  const testGetDataset = async () => {
    if (!orcidId.trim()) {
      updateState({ error: 'Please enter an ORCID ID first' });
      return;
    }
    if (!state.datasetId.trim()) {
      updateState({ error: 'Please enter a dataset ID' });
      return;
    }
    await makeApiCall(`/remote/datasets/${state.datasetId}`);
  };

  /**
   * Test endpoint to download a specific dataset
   */
  const testDownloadDataset = async () => {
    if (!orcidId.trim()) {
      updateState({ error: 'Please enter an ORCID ID first' });
      return;
    }
    if (!state.datasetId.trim()) {
      updateState({ error: 'Please enter a dataset ID to download' });
      return;
    }
    await makeApiCall(`/remote/datasets/${state.datasetId}/download`, 'POST');
  };

  /**
   * Test endpoint to discover available API endpoints
   */
  const testDiscoverEndpoints = async () => {
    if (!orcidId.trim()) {
      updateState({ error: 'Please enter an ORCID ID first' });
      return;
    }
    await makeApiCall('/remote/discover');
  };

  /**
   * Test endpoint to get dataset location (might contain download URLs)
   */
  const testGetDatasetLocation = async () => {
    if (!orcidId.trim()) {
      updateState({ error: 'Please enter an ORCID ID first' });
      return;
    }
    if (!state.datasetId.trim()) {
      updateState({ error: 'Please enter a dataset ID' });
      return;
    }
    await makeApiCall(`/remote/datasets/${state.datasetId}/location`);
  };

  /**
   * Test endpoint to get dataset drive location (POST - most promising!)
   */
  const testGetDatasetDriveLocation = async () => {
    if (!orcidId.trim()) {
      updateState({ error: 'Please enter an ORCID ID first' });
      return;
    }
    if (!state.datasetId.trim()) {
      updateState({ error: 'Please enter a dataset ID' });
      return;
    }
    await makeApiCall(`/remote/datasets/${state.datasetId}/drive-location`, 'POST');
  };

  /**
   * Test endpoint to get user datasets using discovered endpoint
   */
  const testGetUserDatasets = async () => {
    if (!orcidId.trim()) {
      updateState({ error: 'Please enter an ORCID ID first' });
      return;
    }
    await makeApiCall(`/remote/user/${orcidId}/datasets`);
  };

  /**
   * Test endpoint to check dataset access for user
   */
  const testGetDatasetAccess = async () => {
    if (!orcidId.trim()) {
      updateState({ error: 'Please enter an ORCID ID first' });
      return;
    }
    if (!state.datasetId.trim()) {
      updateState({ error: 'Please enter a dataset ID' });
      return;
    }
    await makeApiCall(`/remote/datasets/${state.datasetId}/access/${orcidId}`);
  };

  /**
   * Test endpoint to get API key information and permissions
   */
  const testGetApiKeyInfo = async () => {
    if (!orcidId.trim()) {
      updateState({ error: 'Please enter an ORCID ID first' });
      return;
    }
    await makeApiCall('/remote/user/apikey');
  };

  /**
   * Test rclone download functionality (bypasses API, downloads directly from GCS)
   */
  const testRcloneDownload = async () => {
    updateState({ error: null });
    await makeApiCall('/remote/test-rclone-download', 'POST');
  };

  /**
   * Renders dataset information in a readable format
   * @param datasets - Array of dataset objects to display
   */
  const renderDatasets = (datasets: Dataset[]) => {
    if (!Array.isArray(datasets)) {
      return <Typography>Invalid dataset format</Typography>;
    }

    return (
      <Stack spacing={2}>
        <Typography variant="h6">
          Found {datasets.length} dataset(s)
        </Typography>
        {datasets.map((dataset, index) => (
          <Card key={dataset.unique_id || index} variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {dataset.dataset_name || 'Unnamed Dataset'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {dataset.unique_id || 'N/A'}
              </Typography>
              {/* Display additional dataset properties */}
              {Object.entries(dataset).map(([key, value]) => {
                if (key !== 'dataset_name' && key !== 'unique_id') {
                  return (
                    <Typography key={key} variant="caption" display="block">
                      {key}: {String(value)}
                    </Typography>
                  );
                }
                return null;
              })}
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  };

  return (
    <Box sx={{ 
      maxWidth: 800, 
      margin: 'auto', 
      padding: 2,
      maxHeight: '90vh',
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: '#f1f1f1',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#888',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: '#555',
      },
    }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            🧪 Remote Data API Test
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Test the remote Crucible API endpoints using your ORCID ID. This component allows you to
            validate the backend's ability to fetch data from the remote server without hardcoding credentials.
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* ORCID ID Input */}
          <TextField
            fullWidth
            label="ORCID ID"
            placeholder="0000-0000-0000-0000"
            value={orcidId}
            onChange={(e) => onOrcidChange(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Enter your ORCID ID for authentication with the remote API"
          />

          {/* Test Controls */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Test Endpoints</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                
                {/* List All Datasets */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    1. List All Datasets
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    GET /remote/datasets - Retrieves all datasets available to your ORCID
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={testListDatasets}
                    disabled={state.loading}
                  >
                    Test List Datasets
                  </Button>
                </Box>

                {/* Search Datasets */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    2. Search Datasets by Keyword
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    GET /remote/datasets?keyword=search - Search for datasets containing specific keywords
                  </Typography>
                  <TextField
                    fullWidth
                    label="Search Keyword"
                    placeholder="e.g., electron, microscopy, catalyst"
                    value={state.keyword}
                    onChange={(e) => updateState({ keyword: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={testSearchDatasets}
                    disabled={state.loading}
                  >
                    Test Search Datasets
                  </Button>
                </Box>

                {/* Get Specific Dataset */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    3. Get Dataset Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    GET /remote/datasets/{'{id}'} - Get detailed information about a specific dataset
                  </Typography>
                  <TextField
                    fullWidth
                    label="Dataset ID"
                    placeholder="Enter dataset unique_id from above results"
                    value={state.datasetId}
                    onChange={(e) => updateState({ datasetId: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={testGetDataset}
                    disabled={state.loading}
                  >
                    Test Get Dataset
                  </Button>
                </Box>

                {/* Download Dataset */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    4. Download Dataset
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    POST /remote/datasets/{'{id}'}/download - Download a dataset file to user/data/{'{orcid_id}'}/
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Note:</strong> Uses the same Dataset ID field as above. Files will be saved to your ORCID directory.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="warning"
                    onClick={testDownloadDataset}
                    disabled={state.loading}
                    sx={{ mt: 1 }}
                  >
                    Test Download Dataset
                  </Button>
                </Box>

                {/* Discover API Endpoints */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    5. Discover API Endpoints
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    GET /remote/discover - Query the remote API to discover available endpoints and capabilities
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Useful for:</strong> Finding correct download URLs, discovering new features, API debugging
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="info"
                    onClick={testDiscoverEndpoints}
                    disabled={state.loading}
                    sx={{ mt: 1 }}
                  >
                    Discover API Endpoints
                  </Button>
                </Box>

                {/* Get Dataset Location */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    6. Get Dataset Location
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    GET /remote/datasets/{'{id}'}/location - Get storage location for a dataset (discovered from API)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>This might provide:</strong> Download URLs, file paths, or storage locations for datasets
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Note:</strong> Uses the same Dataset ID field as above.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={testGetDatasetLocation}
                    disabled={state.loading}
                    sx={{ mt: 1 }}
                  >
                    Get Dataset Location
                  </Button>
                </Box>

                {/* Get Dataset Drive Location - MOST PROMISING */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    7. Get Dataset Drive Location ⭐
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    POST /remote/datasets/{'{id}'}/drive-location - Get Google Drive location (POST method - most promising!)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Why promising:</strong> POST method suggests it might trigger download preparation or return actual URLs
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Note:</strong> Uses the same Dataset ID field as above.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="error"
                    onClick={testGetDatasetDriveLocation}
                    disabled={state.loading}
                    sx={{ mt: 1 }}
                  >
                    🚀 Get Drive Location (POST)
                  </Button>
                </Box>

                {/* Get User Datasets */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    8. Get User Datasets
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    GET /remote/user/{'{orcid}'}/datasets - Get datasets specific to your ORCID ID
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>This might show:</strong> Different permissions or additional dataset information for your user
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={testGetUserDatasets}
                    disabled={state.loading}
                    sx={{ mt: 1 }}
                  >
                    Get My Datasets
                  </Button>
                </Box>

                {/* Check Dataset Access */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    9. Check Dataset Access
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    GET /remote/datasets/{'{id}'}/access/{'{orcid}'} - Check what access you have to a specific dataset
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>This explains:</strong> Why location data might be empty - shows your permission level
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Note:</strong> Uses the same Dataset ID field as above.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={testGetDatasetAccess}
                    disabled={state.loading}
                    sx={{ mt: 1 }}
                  >
                    Check My Access
                  </Button>
                </Box>

                {/* Get API Key Info */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    10. Get API Key Info
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    GET /remote/user/apikey - Get information about your API key permissions and access level
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>This reveals:</strong> What permissions your API key has and why some endpoints might be restricted
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="info"
                    onClick={testGetApiKeyInfo}
                    disabled={state.loading}
                    sx={{ mt: 1 }}
                  >
                    Check API Key Permissions
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Test rclone Download */}
                <Box sx={{ 
                  border: '2px solid', 
                  borderColor: 'success.main', 
                  borderRadius: 2, 
                  padding: 2,
                  backgroundColor: 'rgba(76, 175, 80, 0.04)'
                }}>
                  <Typography variant="subtitle1" gutterBottom color="success.main">
                    🚀 11. Test rclone Download (DIRECT GCS ACCESS)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    POST /remote/test-rclone-download - Test direct download from Google Cloud Storage using rclone
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>What this does:</strong> Bypasses the Crucible API completely and downloads directly from GCS bucket
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Dataset:</strong> 0t4h5d3xc1tdq00023ew6czsbc (hardcoded for testing)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Requirements:</strong> Requires GCS credentials in backend/.env file (GCS_CLIENT_ID, GCS_CLIENT_SECRET, GCS_PROJECT_NUMBER, GCS_SA)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Downloads to:</strong> backend/downloads/0t4h5d3xc1tdq00023ew6czsbc/
                  </Typography>
                  <Typography variant="body2" color="warning.main" paragraph>
                    ⚠️ <strong>Note:</strong> This will only work if you have the complete GCS credentials in your .env file
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={testRcloneDownload}
                    disabled={state.loading}
                    size="large"
                    sx={{ 
                      mt: 1,
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    🧪 Test rclone Download
                  </Button>
                </Box>

              </Stack>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 3 }} />

          {/* Results Display */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Results
            </Typography>

            {state.loading && (
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={20} />
                <Typography>Testing {state.lastEndpoint}...</Typography>
              </Box>
            )}

            {state.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {state.error}
              </Alert>
            )}

            {state.results && !state.loading && (
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Chip 
                      label={state.lastEndpoint} 
                      color="primary" 
                      size="small" 
                    />
                    <Chip 
                      label="Success" 
                      color="success" 
                      size="small" 
                    />
                  </Stack>

                  {/* Special handling for different response types */}
                  {Array.isArray(state.results) ? (
                    renderDatasets(state.results)
                  ) : state.results?.success && state.results?.file_path ? (
                    // Special handling for download responses
                    <Box>
                      <Typography variant="subtitle2" gutterBottom color="success.main">
                        ✅ Download Successful!
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>File:</strong> {state.results.filename}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Size:</strong> {(state.results.file_size / 1024).toFixed(1)} KB
                        </Typography>
                        <Typography variant="body2">
                          <strong>Saved to:</strong> {state.results.orcid_directory}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Full Path:</strong> {state.results.file_path}
                        </Typography>
                      </Stack>
                      <Box
                        component="pre"
                        sx={{
                          backgroundColor: 'grey.100',
                          padding: 2,
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.875rem',
                          maxHeight: 200,
                          mt: 2
                        }}
                      >
                        {JSON.stringify(state.results, null, 2)}
                      </Box>
                    </Box>
                  ) : state.results?.success && state.results?.discovery_results ? (
                    // Special handling for API discovery responses
                    <Box>
                      <Typography variant="subtitle2" gutterBottom color="info.main">
                        🔍 API Discovery Results
                      </Typography>
                      <Stack spacing={2}>
                        <Typography variant="body2">
                          <strong>Base URL:</strong> {state.results.discovery_results.base_url}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Discovery Methods Tried:</strong> {Object.keys(state.results.discovery_results.discovery_methods).length}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Potential Endpoints Found:</strong> {state.results.discovery_results.potential_endpoints.length}
                        </Typography>
                        
                        {state.results.discovery_results.potential_endpoints.length > 0 && (
                          <Box>
                            <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                              Discovered Endpoints:
                            </Typography>
                            {state.results.discovery_results.potential_endpoints.map((endpoint: any, index: number) => (
                              <Box key={index} sx={{ ml: 2, mb: 1 }}>
                                <Typography variant="caption" display="block">
                                  <strong>{endpoint.path}</strong> - Methods: {endpoint.methods.join(', ')} 
                                  <em> (from {endpoint.source})</em>
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Stack>
                      <Box
                        component="pre"
                        sx={{
                          backgroundColor: 'grey.100',
                          padding: 2,
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.875rem',
                          maxHeight: 300,
                          mt: 2
                        }}
                      >
                        {JSON.stringify(state.results, null, 2)}
                      </Box>
                    </Box>
                  ) : state.results?.success && state.results?.test_dataset ? (
                    // Special handling for rclone test responses
                    <Box>
                      <Typography variant="subtitle2" gutterBottom color="success.main">
                        🚀 rclone Download Test Successful!
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>Test Dataset:</strong> {state.results.test_dataset}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Download Location:</strong> {state.results.download_location}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Status:</strong> {state.results.message}
                        </Typography>
                        <Typography variant="body2" color="info.main">
                          💡 <strong>Note:</strong> {state.results.note}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📁 Check the backend console and downloads directory for detailed results
                        </Typography>
                      </Stack>
                      <Box
                        component="pre"
                        sx={{
                          backgroundColor: 'grey.100',
                          padding: 2,
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.875rem',
                          maxHeight: 200,
                          mt: 2
                        }}
                      >
                        {JSON.stringify(state.results, null, 2)}
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Response Data:
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          backgroundColor: 'grey.100',
                          padding: 2,
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.875rem',
                          maxHeight: 400
                        }}
                      >
                        {JSON.stringify(state.results, null, 2)}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {!state.results && !state.loading && !state.error && (
              <Typography color="text.secondary" textAlign="center">
                No results yet. Enter your ORCID ID and test an endpoint above.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RemoteDataTest;