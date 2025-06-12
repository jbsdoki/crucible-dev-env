from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import hyperspy.api as hs
from file_service import list_files, load_metadata, extract_spectrum

# Create FastAPI instance
app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for development
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# API Endpoints
"""
Lists all .emd files in the sample_data directory
Returns: List of filenames
Called by: Frontend getFiles() function
"""
@app.get("/files")
async def get_file_list():
    try:
        files = list_files()
        return JSONResponse(content=files)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

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
async def get_metadata(filename: str = Query(...)):
    try:
        metadata = load_metadata(filename)
        return JSONResponse(content=metadata)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

"""
Gets spectrum data at specific coordinates from a .emd file
Args:
    filename: Name of the .emd file (required query parameter)
    x: X coordinate (default: 0)
Returns: List of spectrum data points
Called by: Frontend getSpectrum() function
"""
@app.get("/spectrum")
async def get_spectrum(filename: str = Query(...), x: int = Query(0)):
    try:
        data = extract_spectrum(filename, x)
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
