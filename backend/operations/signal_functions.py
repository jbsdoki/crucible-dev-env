from utils.constants import DATA_DIR, CURRENT_FILE
from .file_functions import load_current_file_signals, set_current_file
import os


def get_cached_signals(file_path):
    """
    Get cached signals for a file path.
    Args:
        file_path (str): Path to the file
    Returns:
        list: List of signal information dictionaries, or None if not cached
    """
    if CURRENT_FILE["filepath"] == file_path and CURRENT_FILE["data"] is not None:
        # Extract signal list from cached data
        return extract_signal_list(CURRENT_FILE["data"])
    return None

def extract_signal_list(signal_list):
    if signal_list is None:
        raise ValueError("File data is None")

    signals_info = []

     # Extract info from each signal
    for idx, sig in enumerate(signal_list):
        try:
            # print(f"\nProcessing signal {idx}:")
            # print(f"Signal object type: {type(sig)}")
            
            # Get title with fallback
            title = "Signal " + str(idx)  # Default title
            try:
                if hasattr(sig, 'metadata'):
                    # print("Has metadata attribute")
                    if hasattr(sig.metadata, 'General'):
                        # print("Has General metadata")
                        if hasattr(sig.metadata.General, 'title'):
                            title = sig.metadata.General.title
                            # print(f"Found title in metadata: {title}")
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
                    # print("Has data attribute")
                    shape = sig.data.shape
                    # print(f"Data shape: {shape} ({len(shape)}D signal)")
                else:
                    print("No data attribute")
            except Exception as e:
                print(f"Error accessing data shape: {str(e)}")
            
            # Get signal type
            try:
                sig_type = type(sig).__name__
                # print(f"Signal type: {sig_type}")
            except Exception as e:
                print(f"Error getting signal type: {str(e)}")
                sig_type = "Unknown"
            
            # Get signal capabilities
            capabilities = get_signal_capabilities(sig)
            
            # Create info dictionary for this signal
            signal_info = {
                "index": idx,
                "title": title,
                "type": sig_type,
                "shape": shape,
                "capabilities": capabilities
            }
            # print("Added signal info:", signal_info)
            signals_info.append(signal_info)
            
            
        except Exception as e:
            print(f"Error processing signal {idx}: {str(e)}")
            # Continue with next signal instead of failing completely
            continue
        
    print(f"\n=== Processed {len(signals_info)} signals successfully ===")
    
    return signals_info


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
"""

# # def get_signal_titles_from_file(filename):

#     try:
#         print(f"\n=== Starting get_signals_from_file() in file_service.py ===")
        
#         # Construct full file path and load the file
#         filepath = os.path.join(DATA_DIR, filename)
#         print(f"Loading file from: {filepath}")


#         signal = load_current_file_signals(filepath)
#         if not signal:
#             signal = try_load_file(filepath)
        
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
#         set_current_file(filename, signals_info)

#         return signals_info
        
#     except Exception as e:
#         print(f"\nERROR getting signals from {filename}: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         raise  # Re-raise the exception to let FastAPI handle it



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


    # print(f"\n=== Starting try_load_signal() ===")
    # """Try loading the signal with different signal types"""
    # signal_types = [None, 'EMD', 'EDS_TEM', 'EDS_SEM', 'EELS', None]  # None means try without specifying type
    
    # for signal_type in signal_types:
    #     try:
    #         print(f"Trying to load with signal_type: {signal_type}")
    #         if signal_type:
    #             signal = hs.load(filepath, reader=signal_type)
    #         else:
    #             signal = hs.load(filepath)
    #         print("=== Ending try_load_signal() successfully ===\n")
    #         return signal
    #     except Exception as e:
    #         print(f"Failed with signal_type {signal_type}: {str(e)}")
    #         continue
    
    # print("=== Ending try_load_signal() with error ===\n")
    # raise ValueError("Could not load file with any signal type")