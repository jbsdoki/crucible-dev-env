import axios from 'axios';

/**
 * API Client Setup
 * This creates a configured axios instance that will be used for all API calls.
 * baseURL: Points to the FastAPI backend server in backend/main.py
 * headers: Sets default headers for all requests
 */
const api = axios.create({
  baseURL: 'http://localhost:8000',  // FastAPI default port
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Ensure we're not sending credentials
  withCredentials: false
});

/****************** API Endpoint Functions ******************/
 // These functions make HTTP requests to the FastAPI backend endpoints.
 // Each function corresponds to a specific endpoint in backend/main.py

/**
 * Fetches list of all .emd files from the backend
 * Calls: GET http://localhost:8000/files
 * Returns: Array of filenames
 */
export const getFiles = async () => {
  try {
    const response = await api.get('/files');
    return response.data;
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
};

/**
 * Fetches metadata for a specific .emd file
 * Calls: GET http://localhost:8000/metadata?filename=<filename>
 * @param filename - Name of the .emd file to get metadata for
 * Returns: Object containing axes, shape, and metadata keys
 */
export const getMetadata = async (filename: string) => {
  try {
    const response = await api.get('/metadata', {
      params: { filename }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    throw error;
  }
};

/**
 * Fetches spectrum data from a specific signal in a file
 * Calls: GET http://localhost:8000/spectrum?filename=<filename>&signal_idx=<signal_idx>&x=<x>&y=<y>
 * @param filename - Name of the file
 * @param signalIdx - Index of the signal in the file
 * @param x - X coordinate for spectrum extraction (default: 0)
 * @param y - Y coordinate for spectrum extraction (default: 0)
 * Returns: Array of spectrum data points
 */
export const getSpectrum = async (
  filename: string, 
  signalIdx: number,
  x: number = 0,
  y: number = 0
) => {
  try {
    console.log('Fetching spectrum data:', { filename, signalIdx, x, y });
    const response = await api.get('/spectrum', {
      params: { filename, signal_idx: signalIdx, x, y }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching spectrum:', error);
    throw error;
  }
};

/**
 * Fetches image data from a specific signal in a file
 * Calls: GET http://localhost:8000/image-data?filename=<filename>&signal_idx=<signal_idx>
 * @param filename - Name of the file
 * @param signalIdx - Index of the signal in the file
 * Returns: Object containing:
 *  - data_shape: Shape of the image data
 *  - image_data: 2D array of image data
 */
export const getImageData = async (filename: string, signalIdx: number) => {
  try {
    console.log('Fetching image data:', { filename, signalIdx });
    const response = await api.get('/image-data', {
      params: { filename, signal_idx: signalIdx }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching image data:', error);
    throw error;
  }
};

/**
 * Fetches all signals from a specific file
 * Calls: GET http://localhost:8000/signals?filename=<filename>
 * @param filename - Name of the file to get signals from
 * Returns: Object containing array of signal information
 */
export const getSignals = async (filename: string) => {
  try {
    const response = await api.get('/signals', {
      params: { filename }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching signals:', error);
    throw error;
  }
};

export default api; 