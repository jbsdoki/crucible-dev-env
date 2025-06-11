from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import hyperspy.api as hs
from file_service import list_files, load_metadata, extract_spectrum

# Create FastAPI instance
app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing)
# This allows the React frontend (running on a different port) to make requests to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# API Endpoints
"""
Lists all .emd files in the sample_data directory
Returns: List of filenames
Called by: Frontend getFiles() function
"""
@app.get("/files")
def get_file_list():
    return list_files()
"""
Gets metadata for a specific .emd file
Args:
    filename: Name of the .emd file (required query parameter)
Returns: Dictionary containing:
    - axes: List of axis names
    - shape: Tuple of data dimensions
    - original_metadata_keys: List of available metadata keys
Called by: Frontend getMetadata() function
"""
@app.get("/metadata")
def get_metadata(filename: str = Query(...)):
    return load_metadata(filename)

    
"""
Gets spectrum data at specific coordinates from a .emd file
Args:
    filename: Name of the .emd file (required query parameter)
    x: X coordinate (default: 0)
    y: Y coordinate (default: 0)
Returns: List of spectrum data points
Called by: Frontend getSpectrum() function
"""
@app.get("/spectrum")
def get_spectrum(filename: str = Query(...), x: int = Query(0), y: int = Query(0)):
    return extract_spectrum(filename, x, y)
