import os
import hyperspy.api as hs
import numpy as np
from hyperspy.signals import Signal1D
import time  # Add import for timing, recording load times
try:
    from exspy.signals import EDSTEMSpectrum
except ImportError:
    print("Warning: exspy package not found. EDSTEMSpectrum will not be available.")
    EDSTEMSpectrum = None

# Get the absolute path to the sample_data directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "backend", "sample_data")

CURRENT_FILE = {
    "filename": None,
    "signals": [],
    "selected_signal_index": None
}

CURRENT_SIGNAL = {
    "idx": None,
    "name": None
}

def update_current_file(filepath, signals):
    print(f"\n=== update_current_file() ===")
    """Helper function to update CURRENT_FILE with logging"""
    print("\n=== Updating CURRENT_FILE ===")
    print(f"Previous file: {CURRENT_FILE['filename']}")
    print(f"New file: {filepath}")
    
    CURRENT_FILE["filename"] = filepath
    CURRENT_FILE["signals"] = signals
    
    if isinstance(signals, list):
        print(f"Number of signals: {len(signals)}")
        for i, sig in enumerate(signals):
            if hasattr(sig, 'metadata') and hasattr(sig.metadata, 'General'):
                print(f"Signal {i}: {sig.metadata.General.title}")
            if hasattr(sig, 'data'):
                print(f"Signal {i} shape: {sig.data.shape}")
    else:
        print("Single signal loaded")
        if hasattr(signals, 'data'):
            print(f"Signal shape: {signals.data.shape}")
    
    print("=== CURRENT_FILE updated ===\n")

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
    print(f"\n=== list_files() ===")
    print("\nCalled list_files() in file_service.py")
    try:
        supported_extensions = ('.emd', '.tif', '.dm3', '.dm4', '.ser', '.emi')
        print("\nReturning list from list_files() in file_service.py")
        return [f for f in os.listdir(DATA_DIR) if f.lower().endswith(supported_extensions)]
    except Exception as e:
        print(f"Error accessing directory {DATA_DIR}: {str(e)}")
        print("\nReturning empty list from list_files() in file_service.py")
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
def try_load_file(filepath):
    print(f"\n=== start try_load_file() ===")
    signal_types = [None, 'EMD', 'EDS_TEM', 'EDS_SEM', 'EELS']  # None means try without specifying type
    
    for signal_type in signal_types:
        try:
            print(f"\n=== Attempting to load file: {os.path.basename(filepath)} ===")
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
        
            # Log what was loaded
            if isinstance(signal, list):
                print(f"Loaded {len(signal)} signals:")
                for i, sig in enumerate(signal):
                    print(f"\nSignal {i}:")
                    print(f"  Type: {type(sig)}")
                    print(f"  Shape: {sig.data.shape if hasattr(sig, 'data') else 'No data'}")
                    if hasattr(sig, 'metadata') and hasattr(sig.metadata, 'General'):
                        print(f"  Title: {sig.metadata.General.title}")
            else:
                print("\nLoaded single signal:")
                print(f"  Type: {type(signal)}")
                print(f"  Shape: {signal.data.shape if hasattr(signal, 'data') else 'No data'}")
                if hasattr(signal, 'metadata') and hasattr(signal.metadata, 'General'):
                    print(f"  Title: {signal.metadata.General.title}")
            
            print("=== File loading complete ===\n")

            # Store in CURRENT_FILE
            CURRENT_FILE["filename"] = filepath
            CURRENT_FILE["signals"] = (signal if isinstance(signal, list) else [signal])
            
            
            print(f"\n=== end try_load_file() ===")
            return signal
            
        except Exception as e:
            print(f"Failed with signal_type {signal_type}: {str(e)}")
            continue
    
    raise ValueError("Could not load file with any signal type")

def get_signals_from_file(filename):
    """Get all signals from a file.
    
    Args:
        filename (str): Name of the file to get signals from
        
    Returns:
        list: List of signal information dictionaries containing:
            - index: Signal index in the file
            - title: Signal title if available
            - type: Signal type (e.g., 'Signal1D', 'Signal2D', etc.)
            - shape: Data shape as a tuple (e.g., (100,) for 1D, (100,100) for 2D)
    """
    try:
        print(f"\n=== get_signals_from_file(): {filename} ===")
        
        # Construct full file path and load the file
        filepath = os.path.join(DATA_DIR, filename)
        print(f"Loading file from: {filepath}")
        signal = try_load_file(filepath)
        
        signals_info = []
        
        # HyperSpy can return either a single signal or a list of signals
        # Convert single signal to list for consistent processing
        if not isinstance(signal, list):
            print("File contains a single signal - converting to list")
            signal = [signal]
        
        print(f"\nFound {len(signal)} signals in file")
            
        # Extract info from each signal
        for idx, sig in enumerate(signal):
            try:
                print(f"\nProcessing signal {idx}:")
                print(f"Signal object type: {type(sig)}")
                
                # Get title with fallback
                title = "Signal " + str(idx)  # Default title
                try:
                    if hasattr(sig, 'metadata'):
                        print("Has metadata attribute")
                        if hasattr(sig.metadata, 'General'):
                            print("Has General metadata")
                            if hasattr(sig.metadata.General, 'title'):
                                title = sig.metadata.General.title
                                print(f"Found title in metadata: {title}")
                            else:
                                print("No title in General metadata")
                        else:
                            print("No General section in metadata")
                    else:
                        print("No metadata attribute")
                except Exception as e:
                    print(f"Error accessing metadata: {str(e)}")
                
                # Get shape with fallback
                shape = None
                try:
                    if hasattr(sig, 'data'):
                        print("Has data attribute")
                        shape = sig.data.shape
                        print(f"Data shape: {shape} ({len(shape)}D signal)")
                    else:
                        print("No data attribute")
                except Exception as e:
                    print(f"Error accessing data shape: {str(e)}")
                
                # Get signal type
                try:
                    sig_type = type(sig).__name__
                    print(f"Signal type: {sig_type}")
                except Exception as e:
                    print(f"Error getting signal type: {str(e)}")
                    sig_type = "Unknown"
                
                # Create info dictionary for this signal
                signal_info = {
                    "index": idx,
                    "title": title,
                    "type": sig_type,
                    "shape": shape
                }
                print("Added signal info:", signal_info)
                signals_info.append(signal_info)
                
            except Exception as e:
                print(f"Error processing signal {idx}: {str(e)}")
                # Continue with next signal instead of failing completely
                continue
            
        print(f"\n=== Processed {len(signals_info)} signals successfully ===")
        return signals_info
        
    except Exception as e:
        print(f"\nERROR getting signals from {filename}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise  # Re-raise the exception to let FastAPI handle it



def try_load_signal():
    if CURRENT_FILE["signals"] is None:
        raise ValueError("No file loaded")
    return CURRENT_FILE["signals"][0]

"""
Find a signal with 3D data representing a 2D image and spectrum.
The first two dimensions should be spatial (image) and the third dimension is the spectrum length.

Args:
    signal_list (list): List of hyperspy signals
    
Returns:
    tuple: (index, signal) of the first found 3D signal, or (None, None) if not found
"""
def find_3d_signal(signal_list):
    print(f"\n=== find_3d_signal() ===")
    print("\nSearching for 3D signals...")
    for idx, sig in enumerate(signal_list):
        print(f"\nChecking signal {idx}:")
        print(f"Type: {type(sig)}")
        if hasattr(sig, 'metadata') and hasattr(sig.metadata, 'General'):
            print(f"Title: {sig.metadata.General.title}")
        
        # Check if signal has 3D data
        if hasattr(sig, 'data'):
            shape = sig.data.shape
            print(f"Data shape: {shape}")
            
            # Look for 3D array with first two dims being spatial
            if len(shape) == 3:
                print(f"Found 3D signal at index {idx} with shape {shape}")
                print(f"Data type: {sig.data.dtype}")
                print(f"Data range: min={sig.data.min()}, max={sig.data.max()}")
                return idx, sig
            
    print("No suitable 3D signal found")
    return None, None

"""
Extract image and spectrum data from a hyperspy file.
Looks for a 3D signal where the first two dimensions represent
the image and the third dimension is the spectrum length.

Args:
    filename (str): Name of the file to load
    
Returns:
    dict: Dictionary containing:
        - signal_idx: Index of the 3D signal
        - data_shape: Shape of the 3D data (height, width, spectrum_length)
        - image_data: 2D array representing the sum of all spectrum channels
"""
def extract_image_data(filename):
    print(f"\n=== extract_image_data() ===")
    try:
        print(f"\nExtracting data from {filename}")
        filepath = os.path.join(DATA_DIR, filename)
        signal = hs.load(filepath)
        
        if not isinstance(signal, list):
            signal = [signal]
            
        print(f"\nLoaded {len(signal)} signals from file")
        
        # Find 3D signal
        signal_idx, signal_data = find_3d_signal(signal)
        
        if signal_data is None:
            print("No 3D signal found in file")
            return None
            
        # Get the shape of the data
        data_shape = signal_data.data.shape
        print(f"Signal shape: {data_shape}")
        
        # Create 2D image by summing across the spectrum dimension
        print("\nProcessing image data:")
        print(f"Initial data type: {signal_data.data.dtype}")
        print(f"Initial data range: min={signal_data.data.min()}, max={signal_data.data.max()}")
        
        # Sum across spectrum dimension
        image_data = np.sum(signal_data.data, axis=2)
        print(f"After summing - shape: {image_data.shape}")
        print(f"After summing - range: min={image_data.min()}, max={image_data.max()}")
        
        # Normalize the image data for display
        if image_data.size > 0:
            image_data = (image_data - image_data.min()) / (image_data.max() - image_data.min())
            image_data = (image_data * 255).astype(np.uint8)
            print(f"After normalization - range: min={image_data.min()}, max={image_data.max()}")
            print(f"Final data type: {image_data.dtype}")
        
        result = {
            "signal_idx": signal_idx,
            "data_shape": data_shape,
            "image_data": image_data.tolist() 
        }
        
        print("\nExtracted data successfully")
        print(f"Signal index: {signal_idx}")
        print(f"Data shape: {data_shape}")
        print(f"Image shape: {image_data.shape}")
        print(f"Image data sample (5x5 corner):")
        print(image_data[:5, :5])
        
        return result
        
    except Exception as e:
        print(f"Error extracting data from {filename}: {str(e)}")
        import traceback
        traceback.print_exc()
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
def try_load_signal(filepath):
    print(f"\n=== try_load_signal() ===")
    """Try loading the signal with different signal types"""
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

"""
Loads only the metadata categories from a microscopy file.

Args:
    filename: Name of the file to load metadata from
    
Returns:
    dict: Dictionary containing metadata categories and their values
"""
def load_metadata(filename):
    print(f"\n=== load_metadata() ===")
    try:
        print(f"\n=== Loading metadata for {filename} ===")
        
        filepath = os.path.join(DATA_DIR, filename)
        signal = try_load_signal(filepath)
        sig = signal[0] if isinstance(signal, list) else signal
        
        metadata_dict = {}
        
        # Access metadata categories
        if hasattr(sig, 'metadata'):
            print("\nExtracting metadata categories...")
            
            # Get all top-level metadata categories
            for category in sig.metadata.as_dictionary().keys():
                category_data = getattr(sig.metadata, category, None)
                if category_data is not None:
                    try:
                        metadata_dict[category] = category_data.as_dictionary()
                        print(f"Found category: {category}")
                    except Exception as e:
                        print(f"Error extracting {category}: {str(e)}")
                        metadata_dict[category] = str(category_data)
        
        print("\nMetadata categories found:", list(metadata_dict.keys()))
        return metadata_dict
        
    except Exception as e:
        print(f"\n!!! Error loading metadata for {filename} !!!")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

# Extract spectrum data from x coordinate
# Spectrum data is a 1D array of intensity values
# The x coordinate is the index of the array
# The entry at index x is the intensity value
def extract_spectrum(filename, x=0):
    print(f"\n=== extract_spectrum() ===")
    try:
        filepath = os.path.join(DATA_DIR, filename)
        signal = try_load_signal(filepath)
        sig = signal[x] if isinstance(signal, list) else signal
        
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

"""
Find the HAADF image from a list of hyperspy signals.

Args:
    signal_list (list): List of hyperspy signals
    
Returns:
    tuple: (index, signal) of the HAADF image, or (None, None) if not found
"""
def find_haadf_image(signal_list):
    print(f"\n=== find_haadf_image() ===")
    for idx, sig in enumerate(signal_list):
        if hasattr(sig, 'metadata'):
            title = sig.metadata.General.title if hasattr(sig.metadata, 'General') else ''
            if 'HAADF' in title and len(sig.data.shape) == 2:
                return idx, sig
    return None, None



def extract_image_from_signal(filename):
    try:
        print(f"\nExtracting data from {filename}")
        filepath = os.path.join(DATA_DIR, filename)
        signal = hs.load(filepath)
        
        if not isinstance(signal, list):
            signal = [signal]
            
        print(f"\nLoaded {len(signal)} signals from file")
        
        # Find 3D signal
        signal_idx, signal_data = find_3d_signal(signal)
        
        if signal_data is None:
            print("No 3D signal found in file")
            return None
            
        # Get the shape of the data
        data_shape = signal_data.data.shape
        print(f"Signal shape: {data_shape}")
        
        # Create 2D image by summing across the spectrum dimension
        print("\nProcessing image data:")
        print(f"Initial data type: {signal_data.data.dtype}")
        print(f"Initial data range: min={signal_data.data.min()}, max={signal_data.data.max()}")
        
        # Sum across spectrum dimension
        image_data = np.sum(signal_data.data, axis=2)
        print(f"After summing - shape: {image_data.shape}")
        print(f"After summing - range: min={image_data.min()}, max={image_data.max()}")
        
        # Normalize the image data for display
        if image_data.size > 0:
            image_data = (image_data - image_data.min()) / (image_data.max() - image_data.min())
            image_data = (image_data * 255).astype(np.uint8)
            print(f"After normalization - range: min={image_data.min()}, max={image_data.max()}")
            print(f"Final data type: {image_data.dtype}")
        
        result = {
            "signal_idx": signal_idx,
            "data_shape": data_shape,
            "image_data": image_data.tolist() 
        }
        
        print("\nExtracted data successfully")
        print(f"Signal index: {signal_idx}")
        print(f"Data shape: {data_shape}")
        print(f"Image shape: {image_data.shape}")
        print(f"Image data sample (5x5 corner):")
        print(image_data[:5, :5])
        
        return result
        
    except Exception as e:
        print(f"Error extracting data from {filename}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

# Extract spectrum data from x coordinate
# Spectrum data is a 1D array of intensity values
# The x coordinate is the index of the array
# The entry at index x is the intensity value
def extract_spectrum_from_signal(signal_name, x=0):
    print(f"Extracting spectrum from {signal_name}")
    try:
        if "signals" not in CURRENT_FILE:
            raise KeyError("No signals loaded. Please load a file first.")
            
        if signal_name not in CURRENT_FILE["signals"]:
            raise KeyError(f"Signal {signal_name} not found in current file")
            
        sig = CURRENT_FILE["signals"][signal_name]

        # Handle different dimensionalities
        if len(sig.data.shape) == 1:
            return sig.data.tolist()
        elif len(sig.data.shape) == 2:
            raise ValueError(f"Signal is {sig.data.shape} image, not a spectrum")
        elif len(sig.data.shape) == 3:
            return sig.data[2].tolist()
        else:
            raise ValueError(f"Unexpected data dimensionality: {len(sig.data.shape)}D")
            
    except Exception as e:
        print(f"Error extracting spectrum from {filename}: {str(e)}")
        raise
