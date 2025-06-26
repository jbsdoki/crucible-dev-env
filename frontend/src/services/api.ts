/**
 * Frontend API Service Architecture
 * -------------------------------
 * This file serves as the central API client for the React frontend, managing all HTTP communications 
 * with the FastAPI backend (main.py). Here's how the data flows through the application:
 * 
 * 1. Component -> API Flow:
 *    - React components (like FileSelector.tsx, ImageViewer.tsx, etc.) import functions from this file
 *    - Components call these functions when they need data (e.g., on mount or user interaction)
 *    - Example: SpectrumViewer.tsx calls getSpectrum() when a user selects a signal
 * 
 * 2. API -> Backend Flow:
 *    - This file uses axios to make HTTP requests to the FastAPI backend (main.py)
 *    - Each function corresponds to a specific endpoint in main.py
 *    - Requests are made to http://localhost:8000 (the FastAPI server)
 *    - Example: getSpectrum() calls GET /spectrum, which maps to @app.get("/spectrum") in main.py
 * 
 * 3. Error Handling:
 *    - Each function includes try/catch blocks to handle network errors
 *    - Errors are logged to console and propagated back to the calling component
 *    - Components can then handle these errors appropriately (e.g., showing error messages)
 */

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
 * Fetches metadata for a specific signal in a file
 * Calls: GET http://localhost:8000/metadata?filename=<filename>&signal_idx=<signal_idx>
 * @param filename - Name of the file
 * @param signalIdx - Index of the signal in the file
 * Returns: Object containing axes, shape, and metadata information
 */
export const getMetadata = async (filename: string, signalIdx: number) => {
  try {
    console.log('Fetching metadata:', { filename, signalIdx });
    const response = await api.get('/metadata', {
      params: { filename, signal_idx: signalIdx }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    throw error;
  }
};

/**
 * Fetches spectrum data from a specific signal in a file
 * Calls: GET http://localhost:8000/spectrum?filename=<filename>&signal_idx=<signal_idx>
 * @param filename - Name of the file
 * @param signalIdx - Index of the signal in the file
 * Returns: Array of spectrum data points
 */
export const getSpectrum = async (filename: string, signalIdx: number) => {
  try {
    const response = await api.get('/spectrum', {
      params: { filename, signal_idx: signalIdx }
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
 * Fetches haadf data from a specific signal in a file
 * Calls: GET http://localhost:8000/image-data?filename=<filename>&signal_idx=<signal_idx>
 * @param filename - Name of the file
 * Returns: Object containing:
 *  - data_shape: Shape of the image data
 *  - image_data: 2D array of image data
 */
export const getHAADFData = async (filename: string ) => {
  try {
    console.log('Fetching HAADF data:', { filename });
    const response = await api.get('/haadf-data', {
      params: { filename }
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

/**
 * Fetches spectrum data from a selected region of a signal
 * Calls: GET http://localhost:8000/region-spectrum
 * @param filename - Name of the file
 * @param signalIdx - Index of the signal in the file
 * @param region - Object containing x1, y1, x2, y2 coordinates of the selected region
 * Returns: Array of averaged spectrum data points from the region
 */
export const getRegionSpectrum = async (
  filename: string, 
  signalIdx: number,
  region: {x1: number, y1: number, x2: number, y2: number}
) => {
  try {
    const response = await api.get('/region-spectrum', {
      params: {
        filename,
        signal_idx: signalIdx,
        x1: Math.round(region.x1),
        y1: Math.round(region.y1),
        x2: Math.round(region.x2),
        y2: Math.round(region.y2)
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching region spectrum:', error);
    throw error;
  }
};

/**
 * Fetches spectrum data from a selected range of energy channels
 * Calls: GET http://localhost:8000/energy-range-spectrum
 * @param filename - Name of the file
 * @param signalIdx - Index of the signal in the file
 * @param range - Object containing start and end indices of the energy range
 * Returns: Array of averaged spectrum data points from the energy range
 */
export const getEnergyRangeSpectrum = async (
  filename: string, 
  signalIdx: number,
  range: {start: number, end: number}
) => {
  try {
    const response = await api.get('/energy-range-spectrum', {
      params: {
        filename,
        signal_idx: signalIdx,
        start: Math.round(range.start),
        end: Math.round(range.end)
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching energy range spectrum:', error);
    throw error;
  }
};

export default api; 