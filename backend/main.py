from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import hyperspy.api as hs
from file_service import list_files, load_metadata, extract_spectrum, extract_image_data, get_signals_from_file
import time

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

# Track last call times to detect React StrictMode double-invocations
last_calls = {}

def log_call(endpoint: str, params: dict = None) -> None:
    """Helper to log endpoint calls and detect React StrictMode double-invocations"""
    current_time = time.time()
    call_key = f"{endpoint}:{str(params)}"
    
    if call_key in last_calls:
        time_diff = current_time - last_calls[call_key]
        if time_diff < 0.1:  # If calls are within 100ms, likely StrictMode
            print(f"\n[React StrictMode] Duplicate call to {endpoint}")
            if params:
                print(f"Parameters: {params}")
            print(f"Time since last call: {time_diff*1000:.2f}ms")
        else:
            print(f"\n[New Request] {endpoint}")
            if params:
                print(f"Parameters: {params}")
    else:
        print(f"\n[First Request] {endpoint}")
        if params:
            print(f"Parameters: {params}")
    
    last_calls[call_key] = current_time

# API Endpoints
"""
Lists all .emd files in the sample_data directory
Returns: List of filenames
Called by: Frontend getFiles() function
"""
@app.get("/files")
async def get_file_list():
    log_call("/files")
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
    print(f"\nmain.py get_metadata() from: {filename}")
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
    print(f"\nmain.py get_spectrum() from: {filename}, x: {x}")
    try:
        data = extract_spectrum(filename, x)
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

"""
Gets image data from a .emd file, including both 3D spectrum and HAADF images
Args:
    filename: Name of the .emd file (required query parameter)
Returns: Dictionary containing:
    - spectrum_idx: Index of the 3D spectrum signal
    - spectrum_shape: Shape of the spectrum signal
    - haadf_idx: Index of the HAADF image
    - haadf_shape: Shape of the HAADF image
    - haadf_data: 2D numpy array of the HAADF image if found
Called by: Frontend getImageData() function
"""
@app.get("/image-data")
async def get_image_data(filename: str = Query(...)):
    print(f"\nmain.py get_image_data() from: {filename}")
    try:
        data = extract_image_data(filename)
        if data is None:
            return JSONResponse(
                status_code=404,
                content={"error": f"No image data found in file {filename}"}
            )
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/signals")
async def get_signals(filename: str = Query(...)):
    """Gets all signals from a file
    Args:
        filename: Name of the file (required query parameter)
    Returns: List of signal information dictionaries
    """
    log_call("/signals", {"filename": filename})
    try:
        signals = get_signals_from_file(filename)
        return JSONResponse(content={"signals": signals})
    except Exception as e:
        print(f"Error in main.py get_signals(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/signal/spectrum")
async def get_signal_spectrum(signal_name: str = Query(...), x: int = Query(0)):
    """Gets spectrum data from a specific signal
    Args:
        signal_name: Name of the signal (required)
        x: X coordinate for spectrum extraction (default: 0)
    Returns: List of spectrum data points
    """
    log_call("/signal/spectrum", {"signal_name": signal_name, "x": x})
    try:
        data = extract_spectrum_from_signal(signal_name, x)
        return JSONResponse(content=data)
    except Exception as e:
        print(f"Error in main.py get_signal_spectrum(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/signal/image")
async def get_signal_image(signal_name: str = Query(...)):
    """Gets image data from a specific signal
    Args:
        signal_name: Name of the signal (required)
    Returns: Dictionary containing image data and metadata
    """
    log_call("/signal/image", {"signal_name": signal_name})
    try:
        data = extract_image_from_signal(signal_name)
        if data is None:
            return JSONResponse(
                status_code=404,
                content={"error": f"No image data found in signal {signal_name}"}
            )
        return JSONResponse(content=data)
    except Exception as e:
        print(f"Error in main.py get_signal_image(): {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
