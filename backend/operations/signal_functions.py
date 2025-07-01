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
    print(f"\n=== Starting get_cached_signals() in signal_functions.py ===")
    if CURRENT_FILE["filepath"] == file_path and CURRENT_FILE["data"] is not None:
        # Extract signal list from cached data
        return extract_signal_list(CURRENT_FILE["data"])
    return None

def extract_signal_list(signal_list):
    """
    Extracts signal information from a list of hyperspy signals.

    Args:
        signal_list (list): List of hyperspy signals

    Returns:
        list: List of signal information dictionaries
    """
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


def find_haadf_signal(signal_list):
    
    """
    Find the HAADF image from a list of hyperspy signals.

    Args:
        signal_list (list): List of hyperspy signals
        
    Returns:
        tuple: (index, signal) of the HAADF image, or (None, None) if not found
    """
    print(f"\n=== Starting find_haadf_signal() in signal_functions.py ===")
    for idx, sig in enumerate(signal_list):
        if hasattr(sig, 'metadata'):
            title = sig.metadata.General.title if hasattr(sig.metadata, 'General') else ''
            if 'HAADF' in title and len(sig.data.shape) == 2:
                print(f"Found HAADF signal at index {idx}, end find_haadf_signal() in signal_functions.py")
                return idx, sig
    print(f"No HAADF signal found in the file, end find_haadf_signal() in signal_functions.py")
    return None, None


def find_3d_signals(signal_list):
    
    """
    Find all 3D signals from a list of hyperspy signals.

    Args:
        signal_list (list): List of hyperspy signals
        
    Returns:
        list: List of tuples [(index, signal), ...] for all 3D signals found, or empty list if none found
    """
    print(f"\n=== Starting find_3d_signals() in signal_functions.py ===")
    found_signals = []
    for idx, sig in enumerate(signal_list):
        if hasattr(sig, 'data'):
            if len(sig.data.shape) == 3:
                print(f"Found 3D signal at index {idx} with shape {sig.data.shape}")
                found_signals.append((idx, sig))
    
    if found_signals:
        print(f"Found {len(found_signals)} 3D signals in the file")
    else:
        print("No 3D signals found in the file")
    
    print(f"=== Ending find_3d_signals() in signal_functions.py ===")
    
    return found_signals
