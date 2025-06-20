# from .constants import DATA_DIR, CURRENT_FILE
# from ..utils.constants import DATA_DIR, CURRENT_FILE
from utils.constants import DATA_DIR, CURRENT_FILE
import hyperspy.api as hs
import os
import time


"""
Lists all supported microscopy files in the sample_data directory.

Supported formats:
- .emd (EMD files)
- .tif (TIFF files)
- .dm3 (Digital Micrograph 3)
- .dm4 (Digital Micrograph 4)
- .ser (TIA Series)
- .emi (FEI EMI)

Returns:
    list: List of filenames with supported extensions
"""
def list_files():
    print(f"\n=== Starting list_files() in file_functions.py ===")
    try:
        supported_extensions = ('.emd', '.tif', '.dm3', '.dm4', '.ser', '.emi')
        print("\nReturning list from list_files() in file_functions.py")
        files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(supported_extensions)]
        print("=== Ending list_files() in file_functions.py ===\n")
        return files
    except Exception as e:
        print(f"Error accessing directory {DATA_DIR}: {str(e)}")
        print("\nReturning empty list from list_files() in file_functions.py")
        return []


def get_cached_file(file_path):
    print("\n=== Starting get_cached_file() ===")
    print(f"Checking cache for filepath: {file_path}")
    print(f"Current cached filepath: {CURRENT_FILE['filepath']}")
    
    if CURRENT_FILE["filepath"] == file_path:
        print("Filepath match found in cache")
        if CURRENT_FILE["data"] is not None:
            # print(f"Cache has data: {type(CURRENT_FILE['data'])}")
            # if isinstance(CURRENT_FILE["data"], list):
                # print(f"Number of signals in cache: {len(CURRENT_FILE['data'])}")
                # for idx, sig in enumerate(CURRENT_FILE["data"]):
                    # print(f"Signal {idx} type: {type(sig)}")
                    # print(f"Signal {idx} has data attribute: {hasattr(sig, 'data')}")
                    # if hasattr(sig, 'data'):
                        # print(f"Signal {idx} data shape: {sig.data.shape if hasattr(sig.data, 'shape') else 'No shape'}")
            return CURRENT_FILE["data"]
        else:
            print("Cache entry exists but data is None")
            return None
    else:
        print("No matching filepath in cache")
        return None


"""
Direct data retrieval function that loads EMD files using HyperSpy.
This is the core function that actually reads the raw EMD file data from disk.

How it works:
1. Attempts to load the EMD file using different signal types (EMD, EDS_TEM, EDS_SEM, EELS)
2. Uses HyperSpy's hs.load() function which directly reads the binary EMD file
3. Returns the loaded signal object containing the raw spectrum data

Args:
    filepath (str): Full path to the EMD file to load
    
Returns:
    hyperspy.signals.Signal: A HyperSpy signal object containing the loaded data
    
Raises:
    ValueError: If the file cannot be loaded with any of the supported signal types
"""
def load_file(filepath):
    """
    Load a file and cache it for future use.
    
    Args:
        filepath (str): Full path to the file to load
        
    Returns:
        The loaded file data
        
    Raises:
        ValueError: If file cannot be loaded
    """
    print(f"\n=== Starting load_file in file_functions.py ===")
    
    # Check cache first
    print("Checking cache...")
    cached_data = get_cached_file(filepath)
    if cached_data is not None:
        print("Found cached data")
        if isinstance(cached_data, list):
            print(f"Cached data is a list with {len(cached_data)} signals")
            if len(cached_data) > 0:
                print(f"First signal type: {type(cached_data[0])}")
                print(f"First signal has data: {hasattr(cached_data[0], 'data')}")
                if hasattr(cached_data[0], 'data'):
                    print(f"First signal data shape: {cached_data[0].data.shape if hasattr(cached_data[0].data, 'shape') else 'No shape'}")
        print("Returning cached file data")
        return cached_data
        
    signal_types = [None, 'EMD', 'EDS_TEM', 'EDS_SEM', 'EELS']  # None means try without specifying type
    
    for signal_type in signal_types:
        try:
            print(f"Attempting to load file: {os.path.basename(filepath)}")
            print(f"Using signal type: {signal_type if signal_type else 'auto-detect'}")
            
            # Start timer
            start_time = time.time()
            
            # Load the file
            if signal_type:
                signal = hs.load(filepath, reader=signal_type)
            else:
                signal = hs.load(filepath)
            
            # End timer
            load_time = time.time() - start_time
            print(f"File loaded successfully in {load_time:.2f} seconds")
            
            # Return a list of signals for standardization
            if not isinstance(signal, list):
                signal = [signal]
            
            # Update cache
            CURRENT_FILE["filepath"] = filepath
            CURRENT_FILE["data"] = signal
            
            print("=== Ending load_file in file_functions.py ===\n")
            return signal
            
        except Exception as e:
            print(f"Failed with signal_type {signal_type}: {str(e)}")
            continue
    
    print("=== Ending load_file with error in file_functions.py ===\n")
    raise ValueError("Could not load file with any signal type")


"""
Gets the signals from a file if it's already loaded, otherwise loads it.

Args:
    filename (str): Name of the file to get signals from
    
Returns:
    list: List of signals from the file
"""
def get_signals_from_file(filename):
    print(f"\n=== Starting get_signals_from_file() in file_functions.py ===")
    try:
        filepath = os.path.join(DATA_DIR, filename)
        print(f"Loading file from: {filepath}")
        
        # Load the file (will use cache if available)
        signals = load_file(filepath)
        
        if not isinstance(signals, list):
            signals = [signals]
            
        return signals
    except Exception as e:
        print(f"ERROR getting signals from {filename}: {str(e)}")
        raise e


def load_current_file_signals(filepath):
    if CURRENT_FILE["filepath"] == filepath:
        return CURRENT_FILE["signals"]
    else:
        return False


def set_current_file(filepath, signals):
    CURRENT_FILE["filepath"] = filepath
    CURRENT_FILE["signals"] = signals
    
        
        
        