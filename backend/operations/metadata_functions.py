import os
from utils.constants import DATA_DIR, CURRENT_FILE
from .file_functions import try_load_signal_from_saved_file
from .signal_functions import get_signals_from_file


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



def load_metadata(filename, index):
    """
    Loads only the metadata categories from a microscopy file.

    Args:
        filename: Name of the file to load metadata from, used to check CURRENT_FILE
        index: Index of the signal to load metadata from, used to index into CURRENT_FILE["signals"]
        
    Returns:
        dict: Dictionary containing metadata categories and their values
    """
    print(f"\n=== Starting load_metadata() in metadata_functions.py ===")
    try:
        print(f"\nLoading metadata for {filename}, signal index {index}")
        
        # First try to get from CURRENT_FILE
        try:
            if CURRENT_FILE["filename"] == filename:
                if CURRENT_FILE["signals"] and 0 <= index < len(CURRENT_FILE["signals"]):
                    sig = CURRENT_FILE["signals"][index]
                else:
                    print(f"Signal index {index} not found in CURRENT_FILE")
                    raise ValueError(f"Signal index {index} not valid")
            else:
                print("File not found in CURRENT_FILE")
                raise ValueError("File not in current cache")
                
        except Exception as cache_error:
            print(f"Cache retrieval failed: {str(cache_error)}")
            print("Falling back to loading from file...")
            
            # Original file loading logic
            filepath = os.path.join(DATA_DIR, filename)
            signal = try_load_file(filepath)
            sig = signal[index] if isinstance(signal, list) else signal
        
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