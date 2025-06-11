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

def try_load_signal(filepath):
    """Try loading the signal with different signal types"""
    signal_types = ['EDS_TEM', 'EDS_SEM', 'EELS', None]  # None means try without specifying type
    
    for signal_type in signal_types:
        try:
            print(f"Trying to load with signal_type: {signal_type}")
            if signal_type:
                signal = hs.load(filepath, signal_type=signal_type)
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

# Extract spectrum data from x, y coordinate
def extract_spectrum(filename, x=0, y=0):
    try:
        filepath = os.path.join(DATA_DIR, filename)
        signal = try_load_signal(filepath)
        sig = signal[0] if isinstance(signal, list) else signal
        
        # Print some debug information
        print(f"Signal shape: {sig.data.shape}")
        print(f"Signal type: {type(sig)}")
        print(f"Requested coordinates: x={x}, y={y}")
        
        # Ensure coordinates are within bounds
        if x >= sig.data.shape[0] or y >= sig.data.shape[1]:
            raise ValueError(f"Coordinates ({x}, {y}) out of bounds. Shape is {sig.data.shape}")
            
        return sig.data[x][y].tolist()
    except Exception as e:
        print(f"Error extracting spectrum from {filename}: {str(e)}")
        raise