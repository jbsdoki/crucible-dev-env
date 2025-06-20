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

# CURRENT_FILE = {
#     "filename": None,
#     "signals": [],
#     "selected_signal_index": None
# }


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
# def list_files():
#     print(f"\n=== Starting list_files() in file_service.py ===")
#     try:
#         supported_extensions = ('.emd', '.tif', '.dm3', '.dm4', '.ser', '.emi')
#         print("\nReturning list from list_files() in file_service.py")
#         files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(supported_extensions)]
#         print("=== Ending list_files() in file_service.py ===\n")
#         return files
#     except Exception as e:
#         print(f"Error accessing directory {DATA_DIR}: {str(e)}")
#         print("\nReturning empty list from list_files() in file_service.py")
#         return []

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
# """
# def try_load_file(filepath):
#     print(f"\n=== Starting try_load_file() in file_service.py ===")
#     signal_types = [None, 'EMD', 'EDS_TEM', 'EDS_SEM', 'EELS']  # None means try without specifying type
    
#     for signal_type in signal_types:
#         try:
#             print(f"Attempting to load file: {os.path.basename(filepath)}")
#             print(f"Using signal type: {signal_type if signal_type else 'auto-detect'}")
            
#             # Start timer
#             start_time = time.time()
            
#             # Load the file
#             if signal_type:
#                 signal = hs.load(filepath, reader=signal_type)
#             else:
#                 signal = hs.load(filepath)
            
#             # End timer
#             load_time = time.time() - start_time
#             print(f"File loaded successfully in {load_time:.2f} seconds")
        
#             # if isinstance(signal, list):
#             #     print(f"Loaded {len(signal)} signals:")
#             #     for i, sig in enumerate(signal):
#             #         print(f"\nSignal {i}:")
#             #         print(f"  Type: {type(sig)}")
#             #         print(f"  Shape: {sig.data.shape if hasattr(sig, 'data') else 'No data'}")
#             #         if hasattr(sig, 'metadata') and hasattr(sig.metadata, 'General'):
#             #             print(f"  Title: {sig.metadata.General.title}")
#             # else:
#             #     print("\nLoaded single signal:")
#             #     print(f"  Type: {type(signal)}")
#             #     print(f"  Shape: {signal.data.shape if hasattr(signal, 'data') else 'No data'}")
#             #     if hasattr(signal, 'metadata') and hasattr(signal.metadata, 'General'):
#             #         print(f"  Title: {signal.metadata.General.title}")
            
#             print("=== File loading complete ===\n")
            
#             # Store in CURRENT_FILE
#             CURRENT_FILE["filename"] = filepath
#             CURRENT_FILE["signals"] = (signal if isinstance(signal, list) else [signal])
            
#             print(f"\n=== end try_load_file() ===")
#             return signal
            
#         except Exception as e:
#             print(f"Failed with signal_type {signal_type}: {str(e)}")
#             continue
    
#     print("=== Ending try_load_file() with error in file_service.py ===\n")
#     raise ValueError("Could not load file with any signal type")


"""Determine what a signal can be used for based on its shape and type

Args:
    signal: A HyperSpy signal object
    
Returns:
    dict: Dictionary containing:
        - hasSpectrum (bool): True if signal can be viewed as spectrum (1D or 3D)
        - hasImage (bool): True if signal can be viewed as image (2D or 3D)
"""
def get_signal_capabilities(signal):
    # print(f"\n=== Starting get_signal_capabilities() in file_service.py ===")
    # print(f"Checking capabilities for signal of type: {type(signal)}")
    
    if not hasattr(signal, 'data') or not hasattr(signal.data, 'shape'):
        # print("Signal has no data or shape")
        # print("=== Ending get_signal_capabilities() in file_service.py ===\n")
        return {"hasSpectrum": False, "hasImage": False}
        
    shape = signal.data.shape
    dims = len(shape)
    # print(f"Signal shape: {shape} ({dims}D)")
    
    capabilities = {
        "hasSpectrum": dims == 1 or dims == 3,  # 1D spectrum or 3D datacube
        "hasImage": dims == 2 or dims == 3      # 2D image or 3D datacube
    }
    
    # print(f"Signal capabilities: {capabilities}")
    # print("=== Ending get_signal_capabilities()  in file_service.py ===\n")
    return capabilities

"""Get all signals from a file.

Args:
    filename (str): Name of the file to get signals from
    
Returns:
    list: List of signal information dictionaries containing:
        - index: Signal index in the file
        - title: Signal title if available
        - type: Signal type (e.g., 'Signal1D', 'Signal2D', etc.)
        - shape: Data shape as a tuple
        - capabilities: Dictionary of what the signal can be used for
# """
# def get_signals_from_file(filename):

#     try:
#         print(f"\n=== Starting get_signals_from_file() in file_service.py ===")
        
#         # Construct full file path and load the file
#         filepath = os.path.join(DATA_DIR, filename)
#         print(f"Loading file from: {filepath}")
#         signal = try_load_file(filepath)
        
#         signals_info = []
        
#         # HyperSpy can return either a single signal or a list of signals
#         # Convert single signal to list for consistent processing
#         if not isinstance(signal, list):
#             print("File contains a single signal - converting to list")
#             signal = [signal]

        
#         print(f"\nFound {len(signal)} signals in file")
            
#         # Extract info from each signal
#         for idx, sig in enumerate(signal):
#             try:
#                 # print(f"\nProcessing signal {idx}:")
#                 # print(f"Signal object type: {type(sig)}")
                
#                 # Get title with fallback
#                 title = "Signal " + str(idx)  # Default title
#                 try:
#                     if hasattr(sig, 'metadata'):
#                         # print("Has metadata attribute")
#                         if hasattr(sig.metadata, 'General'):
#                             # print("Has General metadata")
#                             if hasattr(sig.metadata.General, 'title'):
#                                 title = sig.metadata.General.title
#                                 # print(f"Found title in metadata: {title}")
#                             else:
#                                 print("No title in General metadata")
#                         else:
#                             print("No General section in metadata")
#                     else:
#                         print("No metadata attribute")
#                 except Exception as e:
#                     print(f"Error accessing metadata: {str(e)}")
                
#                 # Get shape with fallback
#                 shape = None
#                 try:
#                     if hasattr(sig, 'data'):
#                         # print("Has data attribute")
#                         shape = sig.data.shape
#                         # print(f"Data shape: {shape} ({len(shape)}D signal)")
#                     else:
#                         print("No data attribute")
#                 except Exception as e:
#                     print(f"Error accessing data shape: {str(e)}")
                
#                 # Get signal type
#                 try:
#                     sig_type = type(sig).__name__
#                     # print(f"Signal type: {sig_type}")
#                 except Exception as e:
#                     print(f"Error getting signal type: {str(e)}")
#                     sig_type = "Unknown"
                
#                 # Get signal capabilities
#                 capabilities = get_signal_capabilities(sig)
                
#                 # Create info dictionary for this signal
#                 signal_info = {
#                     "index": idx,
#                     "title": title,
#                     "type": sig_type,
#                     "shape": shape,
#                     "capabilities": capabilities
#                 }
#                 # print("Added signal info:", signal_info)
#                 signals_info.append(signal_info)
                
#             except Exception as e:
#                 print(f"Error processing signal {idx}: {str(e)}")
#                 # Continue with next signal instead of failing completely
#                 continue
            
#         print(f"\n=== Processed {len(signals_info)} signals successfully ===")
        
#         # Update Current File for further use
#         CURRENT_FILE["filename"] = filename
#         CURRENT_FILE["signals"] = signals_info

#         return signals_info
        
#     except Exception as e:
#         print(f"\nERROR getting signals from {filename}: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         raise  # Re-raise the exception to let FastAPI handle it


"""Get all signals from a file.

Args:
    filename (str): Name of the file to get signals from
    
Returns:
    list: List of signal information dictionaries containing:
        - index: Signal index in the file
        - title: Signal title if available
        - type: Signal type (e.g., 'Signal1D', 'Signal2D', etc.)
        - shape: Data shape as a tuple
        - capabilities: Dictionary of what the signal can be used for
"""
# def get_signals_from_file(filename, index = None):

#     try:
#         print(f"\n=== Starting get_signals_from_file() in file_service.py ===")

#         if index is not None:
#             try:
#                 if CURRENT_FILE["filename"] == filename 
#                 && len(CURRENT_FILE["signals"]) !> index
#                 && CURRENT_FILE["signals"][index] is not None:
#                     signal = CURRENT_FILE["signals"][index]
#         else:
#         # Construct full file path and load the file
#         filepath = os.path.join(DATA_DIR, filename)
#         print(f"Loading file from: {filepath}")
#         signal = try_load_file(filepath)
        
#         signals_info = []
        
#         # HyperSpy can return either a single signal or a list of signals
#         # Convert single signal to list for consistent processing
#         if not isinstance(signal, list):
#             print("File contains a single signal - converting to list")
#             signal = [signal]

        
#         print(f"\nFound {len(signal)} signals in file")
            
#         # Extract info from each signal
#         for idx, sig in enumerate(signal):
#             try:
#                 # print(f"\nProcessing signal {idx}:")
#                 # print(f"Signal object type: {type(sig)}")
                
#                 # Get title with fallback
#                 title = "Signal " + str(idx)  # Default title
#                 try:
#                     if hasattr(sig, 'metadata'):
#                         # print("Has metadata attribute")
#                         if hasattr(sig.metadata, 'General'):
#                             # print("Has General metadata")
#                             if hasattr(sig.metadata.General, 'title'):
#                                 title = sig.metadata.General.title
#                                 # print(f"Found title in metadata: {title}")
#                             else:
#                                 print("No title in General metadata")
#                         else:
#                             print("No General section in metadata")
#                     else:
#                         print("No metadata attribute")
#                 except Exception as e:
#                     print(f"Error accessing metadata: {str(e)}")
                
#                 # Get shape with fallback
#                 shape = None
#                 try:
#                     if hasattr(sig, 'data'):
#                         # print("Has data attribute")
#                         shape = sig.data.shape
#                         # print(f"Data shape: {shape} ({len(shape)}D signal)")
#                     else:
#                         print("No data attribute")
#                 except Exception as e:
#                     print(f"Error accessing data shape: {str(e)}")
                
#                 # Get signal type
#                 try:
#                     sig_type = type(sig).__name__
#                     # print(f"Signal type: {sig_type}")
#                 except Exception as e:
#                     print(f"Error getting signal type: {str(e)}")
#                     sig_type = "Unknown"
                
#                 # Get signal capabilities
#                 capabilities = get_signal_capabilities(sig)
                
#                 # Create info dictionary for this signal
#                 signal_info = {
#                     "index": idx,
#                     "title": title,
#                     "type": sig_type,
#                     "shape": shape,
#                     "capabilities": capabilities
#                 }
#                 # print("Added signal info:", signal_info)
#                 signals_info.append(signal_info)
                
#             except Exception as e:
#                 print(f"Error processing signal {idx}: {str(e)}")
#                 # Continue with next signal instead of failing completely
#                 continue
            
#         print(f"\n=== Processed {len(signals_info)} signals successfully ===")
        
#         # Update Current File for further use
#         CURRENT_FILE["filename"] = filename
#         CURRENT_FILE["signals"] = signals_info

#         return signals_info
        
#     except Exception as e:
#         print(f"\nERROR getting signals from {filename}: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         raise  # Re-raise the exception to let FastAPI handle its


"""Try to load a signal from the CURRENT_FILE cache.

Args:
    filename (str): Name of the file to look for
    index (int): Index of the signal to retrieve
    
Returns:
    Signal object if found
    
Raises:
    ValueError: If file not in cache or index invalid
"""
# def try_load_signal_from_saved_file(filename, index):

#     print(f"\n=== Starting try_load_signal_from_saved_file() in file_service.py ===")
#     print(f"Looking for file: {filename}, index: {index}")
    
#     try:
#         # Check if we have this file cached
#         if CURRENT_FILE["filename"] != filename:
#             print(f"File {filename} not found in cache")
#             raise ValueError(f"File {filename} not found in cache")
            
#         # Check if we have signals
#         if not CURRENT_FILE["signals"]:
#             print("No signals in cache")
#             raise ValueError("No signals in cache")
            
#         # Check if index is valid
#         if not (0 <= index < len(CURRENT_FILE["signals"])):
#             print(f"Signal index {index} out of range (max {len(CURRENT_FILE['signals'])-1})")
#             raise ValueError(f"Signal index {index} out of range")
            
#         # Return the signal at the specified index
#         print(f"Found signal {index} in cache")
#         print("=== Ending try_load_signal_from_saved_file() successfully ===\n")
#         return CURRENT_FILE["signals"][index]
        
#     except Exception as e:
#         print(f"Error in try_load_signal_from_saved_file: {str(e)}")
#         print("=== Ending try_load_signal_from_saved_file() with error ===\n")
#         raise

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
# def extract_image_data(filename):
#     print(f"\n=== extract_image_data() ===")
#     try:
#         print(f"\nExtracting data from {filename}")
#         filepath = os.path.join(DATA_DIR, filename)
#         signal = hs.load(filepath)
        
#         if not isinstance(signal, list):
#             signal = [signal]
            
#         print(f"\nLoaded {len(signal)} signals from file")
        
#         # Find 3D signal
#         signal_idx, signal_data = find_3d_signal(signal)
        
#         if signal_data is None:
#             print("No 3D signal found in file")
#             print("=== Ending extract_image_data() without finding signal ===\n")
#             return None
            
#         # Get the shape of the data
#         data_shape = signal_data.data.shape
#         print(f"Signal shape: {data_shape}")
        
#         # Create 2D image by summing across the spectrum dimension
#         print("\nProcessing image data:")
#         print(f"Initial data type: {signal_data.data.dtype}")
#         print(f"Initial data range: min={signal_data.data.min()}, max={signal_data.data.max()}")
        
#         # Sum across spectrum dimension
#         image_data = np.sum(signal_data.data, axis=2)
#         print(f"After summing - shape: {image_data.shape}")
#         print(f"After summing - range: min={image_data.min()}, max={image_data.max()}")
        
#         # Normalize the image data for display
#         if image_data.size > 0:
#             image_data = (image_data - image_data.min()) / (image_data.max() - image_data.min())
#             image_data = (image_data * 255).astype(np.uint8)
#             print(f"After normalization - range: min={image_data.min()}, max={image_data.max()}")
#             print(f"Final data type: {image_data.dtype}")
        
#         result = {
#             "signal_idx": signal_idx,
#             "data_shape": data_shape,
#             "image_data": image_data.tolist() 
#         }
        
#         print("\nExtracted data successfully")
#         print(f"Signal index: {signal_idx}")
#         print(f"Data shape: {data_shape}")
#         print(f"Image shape: {image_data.shape}")
#         print(f"Image data sample (5x5 corner):")
#         print(image_data[:5, :5])
        
#         print("=== Ending extract_image_data() successfully ===\n")
#         return result
        
#     except Exception as e:
#         print(f"Error extracting data from {filename}: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         print("=== Ending extract_image_data() with error ===\n")
#         return None

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
# def try_load_signal(filepath):
#     print(f"\n=== Starting try_load_signal() ===")
#     """Try loading the signal with different signal types"""
#     signal_types = ['EMD', 'EDS_TEM', 'EDS_SEM', 'EELS', None]  # None means try without specifying type
    
#     for signal_type in signal_types:
#         try:
#             print(f"Trying to load with signal_type: {signal_type}")
#             if signal_type:
#                 signal = hs.load(filepath, reader=signal_type)
#             else:
#                 signal = hs.load(filepath)
#             print("=== Ending try_load_signal() successfully ===\n")
#             return signal
#         except Exception as e:
#             print(f"Failed with signal_type {signal_type}: {str(e)}")
#             continue
    
#     print("=== Ending try_load_signal() with error ===\n")
#     raise ValueError("Could not load file with any signal type")

"""
Loads only the metadata categories from a microscopy file.

Args:
    filename: Name of the file to load metadata from
    
Returns:
    dict: Dictionary containing metadata categories and their values
"""
def load_metadata(filename):
    print(f"\n=== Starting load_metadata() ===")
    try:
        print(f"\nLoading metadata for {filename}")
        
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
        print("=== Ending load_metadata() successfully ===\n")
        return metadata_dict
        
    except Exception as e:
        print(f"\n!!! Error loading metadata for {filename} !!!")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=== Ending load_metadata() with error ===\n")
        raise

# Extract spectrum data from x coordinate
# Spectrum data is a 1D array of intensity values
# The x coordinate is the index of the array
# The entry at index x is the intensity value
# def extract_spectrum(filename, x=0):
#     print(f"\n=== Starting extract_spectrum() ===")
#     try:
#         filepath = os.path.join(DATA_DIR, filename)
#         signal = try_load_signal(filepath)
#         sig = signal[x] if isinstance(signal, list) else signal
        
#         # Handle different dimensionalities
#         if len(sig.data.shape) == 1:
#             print("=== Ending extract_spectrum() successfully ===\n")
#             return sig.data.tolist()
#         elif len(sig.data.shape) == 2:
#             if x >= sig.data.shape[0]:
#                 print("=== Ending extract_spectrum() with error ===\n")
#                 raise ValueError(f"Coordinates ({x}) out of bounds. Shape is {sig.data.shape}")
#             print("=== Ending extract_spectrum() successfully ===\n")
#             return sig.data[x].tolist()
#         else:
#             print("=== Ending extract_spectrum() with error ===\n")
#             raise ValueError(f"Unexpected data dimensionality: {len(sig.data.shape)}D")
            
#     except Exception as e:
#         print(f"Error extracting spectrum from {filename}: {str(e)}")
#         print("=== Ending extract_spectrum() with error ===\n")
#         raise



def extract_image_from_signal(filename):
    print(f"\n=== Starting extract_image_from_signal() ===")
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
            print("=== Ending extract_image_from_signal() without finding signal ===\n")
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
        
        print("=== Ending extract_image_from_signal() successfully ===\n")
        return result
        
    except Exception as e:
        print(f"Error extracting data from {filename}: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=== Ending extract_image_from_signal() with error ===\n")
        return None

# def extract_spectrum_from_signal(signal_name, x=0):
    print(f"\n=== Starting extract_spectrum_from_signal() ===")
    print(f"Extracting spectrum from {signal_name}")
    try:
        if "signals" not in CURRENT_FILE:
            print("=== Ending extract_spectrum_from_signal() with error ===\n")
            raise KeyError("No signals loaded. Please load a file first.")
            
        if signal_name not in CURRENT_FILE["signals"]:
            print("=== Ending extract_spectrum_from_signal() with error ===\n")
            raise KeyError(f"Signal {signal_name} not found in current file")
            
        sig = CURRENT_FILE["signals"][signal_name]

        # Handle different dimensionalities
        if len(sig.data.shape) == 1:
            print("=== Ending extract_spectrum_from_signal() successfully ===\n")
            return sig.data.tolist()
        elif len(sig.data.shape) == 2:
            print("=== Ending extract_spectrum_from_signal() with error ===\n")
            raise ValueError(f"Signal is {sig.data.shape} image, not a spectrum")
        elif len(sig.data.shape) == 3:
            print("=== Ending extract_spectrum_from_signal() successfully ===\n")
            return sig.data[2].tolist()
        else:
            print("=== Ending extract_spectrum_from_signal() with error ===\n")
            raise ValueError(f"Unexpected data dimensionality: {len(sig.data.shape)}D")
            
    except Exception as e:
        print(f"Error extracting spectrum from {filename}: {str(e)}")
        print("=== Ending extract_spectrum_from_signal() with error ===\n")
        raise


    """Extract image data from a signal.
    
    Args:
        signal: A HyperSpy signal object
        
    Returns:
        dict: Dictionary containing:
            - data_shape: Shape of the data
            - image_data: 2D array of image data
            
    Raises:
        ValueError: If signal cannot be displayed as an image
    """
def extract_image_data_from_signal(signal):
    print(f"\n=== Starting extract_image_data_from_signal() in file_service.py ===")

    # print(f"Signal type: {type(signal)}")
    # print(f"Signal shape: {signal.data.shape}")
    
    if not hasattr(signal, 'data') or not hasattr(signal.data, 'shape'):
        print("=== Ending extract_image_data_from_signal() with error ===\n")
        raise ValueError("Signal has no data or shape")
        
    shape = signal.data.shape
    dims = len(shape)
    
    if dims == 2:
        # For 2D signals, use data directly as image
        image_data = signal.data
    elif dims == 3:
        # For 3D signals, sum across spectrum dimension
        image_data = np.sum(signal.data, axis=2)
    else:
        print("=== Ending extract_image_data_from_signal() with error ===\n")
        raise ValueError(f"Signal with {dims} dimensions cannot be displayed as image")
        
    # Normalize image data
    if image_data.size > 0:
        image_data = (image_data - image_data.min()) / (image_data.max() - image_data.min())
        image_data = (image_data * 255).astype(np.uint8)
    
    print("=== Ending extract_image_data_from_signal() in file_service.py successfully ===\n")    
    return {
        "data_shape": image_data.shape,
        "image_data": image_data.tolist()
    }


"""Extract spectrum data from a signal.

Args:
    signal: A HyperSpy signal object
    x: X coordinate for 2D/3D signals (default: 0)
    y: Y coordinate for 3D signals (default: 0)
    
Returns:
    list: List of intensity values representing the spectrum
    
Raises:
    ValueError: If signal cannot be displayed as a spectrum
"""
# def extract_spectrum_data_from_signal(signal, x=0, y=0):
#     print(f"\n=== Starting extract_spectrum_data_from_signal() in file_service.py ===")
#     print(f"Signal type: {type(signal)}")
#     print(f"Signal shape: {signal.data.shape}")
    
#     if not hasattr(signal, 'data') or not hasattr(signal.data, 'shape'):
#         print("=== Ending extract_spectrum_data_from_signal() in file_service.py with error ===\n")
#         raise ValueError("Signal has no data or shape")
        
#     shape = signal.data.shape
#     dims = len(shape)
    
#     if dims == 1:
#         # For 1D signals, use data directly as spectrum
#         print("=== Ending extract_spectrum_data_from_signal() in file_service.py successfully ===\n")
#         return signal.data.tolist()
#     elif dims == 2:
#         # For 2D signals, extract spectrum at x coordinate
#         if x >= shape[0]:
#             print("=== Ending extract_spectrum_data_from_signal() in file_service.py with error ===\n")
#             raise ValueError(f"X coordinate {x} out of bounds (max {shape[0]-1})")
#         print("=== Ending extract_spectrum_data_from_signal() in file_service.py successfully ===\n")
#         return signal.data[x].tolist()
#     elif dims == 3:
#         # For 3D signals, extract spectrum at (x,y) coordinates
#         if x >= shape[0] or y >= shape[1]:
#             print("=== Ending extract_spectrum_data_from_signal() in file_service.py with error ===\n")
#             raise ValueError(f"Coordinates ({x},{y}) out of bounds (max {shape[0]-1},{shape[1]-1})")
#         print("=== Ending extract_spectrum_data_from_signal() in file_service.py successfully ===\n")
#         return signal.data[x,y].tolist()
#     else:
#         print("=== Ending extract_spectrum_data_from_signal() in file_service.py with error ===\n")
#         raise ValueError(f"Signal with {dims} dimensions cannot be displayed as spectrum")


"""Extract image data from a file.

Args:
    filename (str): Name of the file to extract image from
    
Returns:
    dict: Dictionary containing image data and shape
"""
def extract_image_data(filename):
    print(f"\n=== Starting extract_image_data() ===")

    try:
        # Load file and get signals
        filepath = os.path.join(DATA_DIR, filename)
        signal = try_load_file(filepath)
        
        if not isinstance(signal, list):
            signal = [signal]
            
        # Find first signal that can be displayed as image
        for sig in signal:
            try:
                capabilities = get_signal_capabilities(sig)
                if capabilities["hasImage"]:
                    result = extract_image_data_from_signal(sig)
                    print("=== Ending extract_image_data() successfully ===\n")
                    return result
            except Exception as e:
                print(f"Error checking signal: {str(e)}")
                continue
                
        print("=== Ending extract_image_data() with error ===\n")
        raise ValueError("No signals in file can be displayed as image")
        
    except Exception as e:
        print(f"Error extracting image data: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=== Ending extract_image_data() with error ===\n")
        raise

"""Extract spectrum data from a file.

Args:
    filename (str): Name of the file to extract spectrum from
    x (int): X coordinate for 2D/3D signals
    y (int): Y coordinate for 3D signals
    
Returns:
    list: List of intensity values
"""
# def extract_spectrum(filename, x=0, y=0):
#     print(f"\n=== Starting extract_spectrum() ===")

#     try:
#         # Load file and get signals
#         filepath = os.path.join(DATA_DIR, filename)
#         signal = try_load_file(filepath)
        
#         if not isinstance(signal, list):
#             signal = [signal]
            
#         # Find first signal that can be displayed as spectrum
#         for sig in signal:
#             try:
#                 capabilities = get_signal_capabilities(sig)
#                 if capabilities["hasSpectrum"]:
#                     result = extract_spectrum_data_from_signal(sig, x, y)
#                     print("=== Ending extract_spectrum() successfully ===\n")
#                     return result
#             except Exception as e:
#                 print(f"Error checking signal: {str(e)}")
#                 continue
                
#         print("=== Ending extract_spectrum() with error ===\n")
#         raise ValueError("No signals in file can be displayed as spectrum")
        
#     except Exception as e:
#         print(f"Error extracting spectrum: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         print("=== Ending extract_spectrum() with error ===\n")
#         raise



# def get_signal_at_idx(signal, index):

#     # Catch Errors
#     if signal_idx >= len(signals):
#         raise ValueError(f"Signal index {signal_idx} out of range (max {len(signals)-1})")

#     # If passed signal is list of signals
#     if isinstance(signal, list):
#         signal = signal[signal_idx]

#     elif signal_idx != 0:
#         raise ValueError("File contains only one signal, index must be 0")

#     return signal

