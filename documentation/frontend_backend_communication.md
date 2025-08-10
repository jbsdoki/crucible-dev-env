# Frontend-Backend Communication Documentation

## Overview

This document describes how the React frontend communicates with the FastAPI backend through the API service layer. The communication is handled by `frontend/src/services/api.ts` which makes HTTP requests to endpoints defined in `backend/main.py`.

## Architecture Overview

The communication follows a client-server architecture where:

- **Frontend**: React components that need data call functions from `frontend/src/services/api.ts`
- **API Service**: `frontend/src/services/api.ts` manages all HTTP communications using axios
- **Backend**: FastAPI server in `backend/main.py` processes requests and returns data
- **Data Flow**: Frontend → API Service → HTTP Request → Backend → Response → Frontend

## API Service Configuration (`frontend/src/services/api.ts`)

### Base Configuration
```typescript
const api = axios.create({
  baseURL: import.meta.env.MODE === 'development' ? 'http://localhost:8000' : '',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false
});
```

- **Development**: Points to `http://localhost:8000` (local FastAPI server)
- **Production**: Uses relative URLs (served from same domain)
- **Headers**: Standard JSON communication
- **Credentials**: No cookie/session sharing between frontend and backend

## Endpoint Mappings

### 1. File Management Endpoints

#### Get Files List
- **Frontend**: `getFiles()` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/files")` in `backend/main.py`
- **Purpose**: Retrieves list of available .emd files
- **Data Flow**: 
  ```
  Frontend Component → getFiles() → GET /files → Backend → File List → Frontend
  ```

#### Get Signals
- **Frontend**: `getSignals(filename: string)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/signals")` in `backend/main.py`
- **Purpose**: Retrieves all signals from a specific file
- **Parameters**: `filename` as query parameter
- **Data Flow**:
  ```
  Frontend Component → getSignals(filename) → GET /signals?filename=<filename> → Backend → Signal Info → Frontend
  ```

### 2. Data Retrieval Endpoints

#### Get Spectrum Data
- **Frontend**: `getSpectrum(filename: string, signalIdx: number)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/spectrum")` in `backend/main.py`
- **Purpose**: Retrieves spectrum data with x/y values and units
- **Parameters**: `filename` and `signal_idx` as query parameters
- **Returns**: Object with x, y arrays, labels, and units
- **Data Flow**:
  ```
  SpectrumViewer → getSpectrum() → GET /spectrum?filename=<file>&signal_idx=<idx> → Backend → Spectrum Data → Plot
  ```

#### Get Image Data
- **Frontend**: `getImageData(filename: string, signalIdx: number)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/image-data")` in `backend/main.py`
- **Purpose**: Retrieves 2D image data from a signal
- **Parameters**: `filename` and `signal_idx` as query parameters
- **Returns**: Object with data shape and 2D image array
- **Data Flow**:
  ```
  ImageViewer → getImageData() → GET /image-data?filename=<file>&signal_idx=<idx> → Backend → Image Data → Display
  ```

#### Get HAADF Data
- **Frontend**: `getHAADFData(filename: string)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/haadf-data")` in `backend/main.py`
- **Purpose**: Retrieves HAADF (High-Angle Annular Dark Field) image data
- **Parameters**: `filename` only (HAADF is file-specific, not signal-specific)
- **Returns**: Object with data shape and 2D image array
- **Data Flow**:
  ```
  HAADFViewer → getHAADFData() → GET /haadf-data?filename=<file> → Backend → HAADF Data → Display
  ```

### 3. Analysis Endpoints

#### Get Region Spectrum
- **Frontend**: `getRegionSpectrum(filename, signalIdx, region)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/region-spectrum")` in `backend/main.py`
- **Purpose**: Retrieves spectrum data from a selected 2D region
- **Parameters**: `filename`, `signal_idx`, `x1`, `y1`, `x2`, `y2` as query parameters
- **Returns**: Array of averaged spectrum data points from the region
- **Data Flow**:
  ```
  ImageViewer → getRegionSpectrum() → GET /region-spectrum?filename=<file>&signal_idx=<idx>&x1=<x1>&y1=<y1>&x2=<x2>&y2=<y2> → Backend → Region Spectrum → SpectrumViewer
  ```

#### Get Energy Range Spectrum
- **Frontend**: `getEnergyRangeSpectrum(filename, signalIdx, range)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/energy-range-spectrum")` in `backend/main.py`
- **Purpose**: Retrieves spectrum data from a selected energy range
- **Parameters**: `filename`, `signal_idx`, `start`, `end` as query parameters
- **Returns**: Array of averaged spectrum data points from the energy range
- **Data Flow**:
  ```
  SpectrumViewer → getEnergyRangeSpectrum() → GET /energy-range-spectrum?filename=<file>&signal_idx=<idx>&start=<start>&end=<end> → Backend → Energy Range Spectrum → Analysis
  ```

#### Get Emission Spectra Width Sum
- **Frontend**: `getEmissionSpectraWidthSum(filename, signalIdx, start, end)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/emission-spectra-width-sum")` in `backend/main.py`
- **Purpose**: Calculates sum of X-ray counts within an energy range
- **Parameters**: `filename`, `signal_idx`, `start` (keV), `end` (keV) as query parameters
- **Returns**: Number representing total counts in the range
- **Data Flow**:
  ```
  EmissionLineAnalysis → getEmissionSpectraWidthSum() → GET /emission-spectra-width-sum?filename=<file>&signal_idx=<idx>&start=<start>&end=<end> → Backend → Count Sum → Analysis Display
  ```

### 4. Metadata and Analysis Endpoints

#### Get Metadata
- **Frontend**: `getMetadata(filename, signalIdx)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/metadata")` in `backend/main.py`
- **Purpose**: Retrieves metadata for a specific signal
- **Parameters**: `filename` and `signal_idx` as query parameters
- **Returns**: Object containing axes, shape, and metadata information
- **Data Flow**:
  ```
  MetadataViewer → getMetadata() → GET /metadata?filename=<file>&signal_idx=<idx> → Backend → Metadata → Display
  ```

#### Get Axes Data
- **Frontend**: `getAxesData(filename, signalIdx)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/axes-data")` in `backend/main.py`
- **Purpose**: Retrieves axes manager data for a signal
- **Parameters**: `filename` and `signal_idx` as query parameters
- **Returns**: Object containing axes, shape, and metadata information
- **Data Flow**:
  ```
  Component → getAxesData() → GET /axes-data?filename=<file>&signal_idx=<idx> → Backend → Axes Data → Component
  ```

#### Get Zero Peak Width
- **Frontend**: `getZeroPeakWidth(filename, signalIdx)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/zero-peak-width")` in `backend/main.py`
- **Purpose**: Retrieves zero peak width for signal analysis
- **Parameters**: `filename` and `signal_idx` as query parameters
- **Returns**: Object containing the zero peak width
- **Data Flow**:
  ```
  Analysis Component → getZeroPeakWidth() → GET /zero-peak-width?filename=<file>&signal_idx=<idx> → Backend → Peak Width → Analysis
  ```

### 5. Periodic Table Endpoints

#### Get Emission Spectra
- **Frontend**: `getEmissionSpectra(atomicNumber)` in `frontend/src/services/api.ts`
- **Backend**: `@app.get("/emission-spectra")` in `backend/main.py`
- **Purpose**: Retrieves emission spectra for a specific element
- **Parameters**: `atomic_number` as query parameter
- **Returns**: Object containing emission spectra data
- **Data Flow**:
  ```
  PeriodicTable → getEmissionSpectra() → GET /emission-spectra?atomic_number=<number> → Backend → Emission Data → Element Details
  ```

### 6. Authentication Endpoints

#### Get ORCID Login URL
- **Frontend**: Not directly called from `api.ts` (handled by AuthContext)
- **Backend**: `@app.get("/api/auth/orcid/login-url")` in `backend/main.py`
- **Purpose**: Generates ORCID OAuth login URL
- **Returns**: URL for ORCID authentication

#### Exchange ORCID Code
- **Frontend**: Not directly called from `api.ts` (handled by AuthContext)
- **Backend**: `@app.post("/api/auth/orcid/exchange")` in `backend/main.py`
- **Purpose**: Exchanges authorization code for access token
- **Request Body**: `ORCIDCodeRequest` with authorization code
- **Response**: `ORCIDTokenResponse` with user information and token

## Data Flow Patterns

### 1. File Selection Flow
```
FileSelector → getFiles() → Backend → File List → FileSelector → User Selects File → getSignals() → Backend → Signal List → SignalSelector
```

### 2. Spectrum Analysis Flow
```
SpectrumViewer → getSpectrum() → Backend → Spectrum Data → Plot → User Selects Range → getEnergyRangeSpectrum() → Backend → Range Data → Analysis
```

### 3. Image Analysis Flow
```
ImageViewer → getImageData() → Backend → Image Data → Display → User Selects Region → getRegionSpectrum() → Backend → Region Spectrum → SpectrumViewer
```

### 4. Emission Line Analysis Flow
```
PeriodicTable → getEmissionSpectra() → Backend → Emission Data → Element Selection → EmissionLineAnalysis → getEmissionSpectraWidthSum() → Backend → Count Data → Analysis Display
```

## Error Handling

### Frontend Error Handling (`frontend/src/services/api.ts`)
```typescript
try {
  const response = await api.get('/endpoint', { params });
  return response.data;
} catch (error) {
  console.error('Error fetching data:', error);
  throw error;
}
```

- **Try-Catch Blocks**: Each API function includes error handling
- **Error Logging**: Errors are logged to console for debugging
- **Error Propagation**: Errors are thrown back to calling components
- **Component Handling**: Components can handle errors appropriately (show messages, retry, etc.)

### Backend Error Handling (`backend/main.py`)
- **FastAPI Built-in**: Automatic error handling for invalid requests
- **Query Validation**: Required parameters are validated automatically
- **File Not Found**: Graceful handling of missing files or signals
- **Data Processing Errors**: Errors during data processing are caught and returned

## Performance Considerations

### Request Optimization
- **Parameter Validation**: Frontend validates parameters before sending requests
- **Error Boundaries**: Components handle errors gracefully without crashing
- **Loading States**: Components show loading indicators during API calls

### Backend Optimization
- **Async Endpoints**: All endpoints are async for better performance
- **Data Processing**: Efficient data processing using numpy and other libraries
- **Response Caching**: Consider implementing caching for frequently accessed data

## Development vs Production

### Development Environment
- **Frontend**: Runs on Vite dev server (typically port 5173)
- **Backend**: Runs on FastAPI server (port 8000)
- **CORS**: Backend handles CORS for cross-origin requests
- **API Base**: `http://localhost:8000`

### Production Environment
- **Frontend**: Built and served from same domain as backend
- **Backend**: Serves both API and static frontend files
- **API Base**: Relative URLs (same domain)
- **No CORS**: Same-origin requests

## Debugging and Development

### Frontend Debugging
- **Console Logging**: API functions log requests and errors
- **Network Tab**: Use browser dev tools to inspect HTTP requests
- **Error Boundaries**: React error boundaries catch and display errors

### Backend Debugging
- **FastAPI Docs**: Interactive API documentation at `/docs`
- **Logging**: Backend logs all requests and processing steps
- **Error Responses**: Detailed error messages for debugging

### Common Issues
- **CORS Errors**: Ensure backend CORS settings match frontend origin
- **Port Mismatch**: Verify backend is running on expected port
- **File Paths**: Ensure file paths are correct for backend processing
- **Parameter Types**: Verify parameter types match backend expectations

## Security Considerations

### Authentication
- **ORCID OAuth**: Secure third-party authentication
- **Token Management**: Secure storage and handling of access tokens
- **Session Management**: No persistent sessions between frontend and backend

### Data Validation
- **Frontend Validation**: Input validation before sending requests
- **Backend Validation**: Server-side validation of all parameters
- **File Access**: Backend validates file access permissions

### API Security
- **No Credentials**: `withCredentials: false` prevents cookie sharing
- **Parameter Sanitization**: Backend sanitizes all input parameters
- **Error Information**: Limited error details to prevent information leakage
