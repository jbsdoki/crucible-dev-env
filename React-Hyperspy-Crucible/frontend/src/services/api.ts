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
 * Fetches spectrum data at specific coordinates from a .emd file
 * Calls: GET http://localhost:8000/spectrum?filename=<filename>&x=<x>
 * @param filename - Name of the .emd file
 * @param x - X coordinate (default: 0)
 * Returns: Array of spectrum data points
 */
export const getSpectrum = async (filename: string, x: number = 0) => {
  try {
    const response = await api.get('/spectrum', {
      params: { filename, x }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching spectrum:', error);
    throw error;
  }
};

export default api; 