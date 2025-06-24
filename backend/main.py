from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import hyperspy.api as hs
import os
import time
from service_handlers import file_service, signal_service


# Create FastAPI instance
app = FastAPI()



### THIS SECTION OF CODE IS FOR DEVELOPMENT ONLY ###
### MUST ADD SECURITY FOR PRODUCTION ###
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
    print("\n=== Starting log_call() in main.py ===")
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
    print("=== Ending log_call() in main.py ===\n")

# API Endpoints
"""
Lists all .emd files in the sample_data directory
Returns: List of filenames
Called by: Frontend getFiles() function
"""
@app.get("/files")
async def get_file_list():
    print("\n=== Starting get_file_list() ===")
    log_call("/files")
    try:
        files = file_service.list_files()
        print("=== Ending get_file_list() in main.py ===\n")
        return JSONResponse(content=files)
    except Exception as e:
        print(f"ERROR in get_file_list(): {str(e)}")
        print("=== Ending get_file_list() in main.py with error ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


"""Gets a list of signals from a file
Args:
    filename: Name of the file to get signals from
Returns:
    List of signals from the file
"""
@app.get("/signals")
async def get_signals(filename: str = Query(...)):
    """
    Gets a list of signals from a file
    Args:
        filename: Name of the file to get signals from
    Returns:
        Object containing list of signals from the file
    """
    print("\n=== Starting get_signals() from main.py ===")
    print(f"Filename: {filename}")
    log_call("/signals", {"filename": filename})
    
    try:
        signals = signal_service.get_signal_list(filename)
        print("=== Ending get_signals() from main.py ===\n")
        return JSONResponse(content={"signals": signals})  # Wrap signals in an object
    except Exception as e:
        print(f"ERROR in get_signals(): {str(e)}")
        print("=== Ending get_signals() from main.py with error ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


"""
Gets spectrum data from a specific signal in a file
Args:
    filename: Name of the file (required)
    signal_idx: Index of the signal in the file (required)
Returns: List of spectrum data points
Called by: Frontend getSpectrum() function
"""
@app.get("/spectrum")
async def get_spectrum(
    filename: str = Query(...), 
    signal_idx: int = Query(...)
):
    print("\n=== Starting get_spectrum() in main.py ===")
    print(f"Filename: {filename}, Signal Index: {signal_idx}")
    log_call("/spectrum", {"filename": filename, "signal_idx": signal_idx})
    try:
        spectrum_data = signal_service.get_spectrum_data(filename, signal_idx)
        print("=== Ending get_spectrum() in main.py ===\n")
        return JSONResponse(content=spectrum_data)
    except Exception as e:
        print(f"ERROR in get_spectrum() in main.py: {str(e)}")
        print("=== Ending get_spectrum() with error in main.py ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )




"""
Gets image data from a specific signal in a file
Args:
    filename: Name of the file (required)
    signal_idx: Index of the signal in the file (required)
Returns: Dictionary containing image data and shape
Called by: Frontend getImageData() function
"""
@app.get("/image-data")
async def get_image_data(
    filename: str = Query(...),
    signal_idx: int = Query(...)
):
    print("\n=== Starting get_image_data() from main.py ===")
    print(f"Filename: {filename}, Signal Index: {signal_idx}")
    log_call("/image-data", {"filename": filename, "signal_idx": signal_idx})
    try:
        image_data = signal_service.get_image_data(filename, signal_idx)
        if image_data is None:
            raise ValueError("Failed to extract image data")
        print("=== Ending get_image_data() successfully ===\n")
        return JSONResponse(content=image_data)
    except Exception as e:
        print(f"ERROR in get_image_data(): {str(e)}")
        print("=== Ending get_image_data() with error ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

"""
Gets HAADF data from a specific signal in a file
Args:
    filename: Name of the file (required)
Returns: Dictionary containing HAADF data and shape
Called by: Frontend getHAADFData() function
"""
@app.get("/haadf-data")
async def get_haadf_data(
    filename: str = Query(...)
):
    print("\n=== Starting get_haadf_data() from main.py ===")
    print(f"Filename: {filename}")
    log_call("/haadf-data", {"filename": filename})
    try:
        haadf_data = signal_service.get_haadf_data(filename)
        if haadf_data is None:
            print("=== Ending get_haadf_data() - No HAADF data found ===\n")
            return JSONResponse(
                status_code=404,
                content={"error": "No HAADF data found in file"}
            )
        print("=== Ending get_haadf_data() successfully ===\n")
        return JSONResponse(content=haadf_data)
    except Exception as e:
        print(f"ERROR in get_haadf_data(): {str(e)}")
        print("=== Ending get_haadf_data() with error ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


"""
Gets metadata from a specific signal in a file
Args:
    filename: Name of the file (required)
    signal_idx: Index of the signal in the file (required)
Returns: Dictionary containing metadata for the specific signal
Called by: Frontend getMetadata() function
"""
@app.get("/metadata")
async def get_metadata(
    filename: str = Query(...),
    signal_idx: int = Query(...)
):
    print("\n=== Starting get_metadata() from main.py ===")
    print(f"Filename: {filename}, Signal Index: {signal_idx}")
    log_call("/metadata", {"filename": filename, "signal_idx": signal_idx})
    try:
        metadata = signal_service.get_metadata(filename, signal_idx)
        if metadata is None:
            raise ValueError("Failed to extract metadata")
        print("=== Ending get_metadata() successfully ===\n")
        return JSONResponse(content=metadata)
    except Exception as e:
        print(f"ERROR in get_metadata(): {str(e)}")
        print("=== Ending get_metadata() with error ===\n")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )



"""Gets image data from a specific signal
Args:
    signal_name: Name of the signal (required)
Returns: Dictionary containing image data and metadata
"""
@app.get("/signal/image")
async def get_signal_image(signal_name: str = Query(...)):
    print("\n=== Starting get_signal_image() from main.py ===")
    log_call("/signal/image", {"signal_name": signal_name})
    try:
        data = extract_image_data(signal_name)
        if data is None:
            print("\n=== Ending get_signal_image() from main.py ===")
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
