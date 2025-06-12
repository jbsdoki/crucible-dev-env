import os
import hyperspy.api as hs

# Get the absolute path to the sample_data directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "backend", "sample_data")

# List all .emd files
def list_files():
    try:
        return [f for f in os.listdir(DATA_DIR) if f.endswith('.emd')]
    except Exception as e:
        print(f"Error accessing directory {DATA_DIR}: {str(e)}")
        return []

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
def try_load_signal(filepath):

    signal_types = ['EMD', 'EDS_TEM', 'EDS_SEM', 'EELS', None]  # None means try without specifying type
    
    for signal_type in signal_types:
        try:
            print(f"Trying to load with signal_type: {signal_type}")
            if signal_type:
                signal = hs.load(filepath, reader=signal_type)
            else:
                signal = hs.load(filepath)
            return signal
        except Exception as e:
            print(f"Failed with signal_type {signal_type}: {str(e)}")
            continue
    
    raise ValueError("Could not load file with any signal type")

# Load metadata like shape and axis labels
def load_metadata(filename):
    try:
        filepath = os.path.join(DATA_DIR, filename)
        signal = try_load_signal(filepath)
        sig = signal[0] if isinstance(signal, list) else signal
        return {
            "axes": [axis.name for axis in sig.axes],
            "shape": sig.data.shape,
            "original_metadata_keys": list(sig.original_metadata.keys())
        }
    except Exception as e:
        print(f"Error loading metadata for {filename}: {str(e)}")
        raise

# Extract spectrum data from x coordinate
def extract_spectrum(filename, x=0):
    try:
        filepath = os.path.join(DATA_DIR, filename)
        signal = try_load_signal(filepath)
        sig = signal[0] if isinstance(signal, list) else signal
        
        # Print basic debug info
        print(f"Signal shape: {sig.data.shape}")
        print(f"Signal type: {type(sig)}")
        print(f"Requested coordinates: x={x}")
        
        # Handle different dimensionalities
        if len(sig.data.shape) == 1:
            return sig.data.tolist()
        elif len(sig.data.shape) == 2:
            if x >= sig.data.shape[0]:
                raise ValueError(f"Coordinates ({x}) out of bounds. Shape is {sig.data.shape}")
            return sig.data[x].tolist()
        else:
            raise ValueError(f"Unexpected data dimensionality: {len(sig.data.shape)}D")
            
    except Exception as e:
        print(f"Error extracting spectrum from {filename}: {str(e)}")
        raise