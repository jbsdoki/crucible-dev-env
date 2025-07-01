import os
from utils.constants import DATA_DIR, CURRENT_FILE
from .file_functions import try_load_signal_from_saved_file
from .signal_functions import get_signals_from_file



def load_metadata(signal):
    """
    Loads only the metadata categories from a microscopy file.

    Args:
        filename: Name of the file to load metadata from, used to check CURRENT_FILE
        index: Index of the signal to load metadata from, used to index into CURRENT_FILE["signals"]
        
    Returns:
        dict: Dictionary containing metadata categories and their values
    """
    print(f"\n=== Starting load_metadata() in data_functions.py ===")
    try:
        
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

def _convert_metadata_to_serializable(metadata_dict):
        """
        Converts metadata dictionary to a JSON-serializable format.
        Args:
            metadata_dict (dict): Dictionary containing metadata
        Returns:
            dict: JSON-serializable dictionary
        """
        result = {}
        
        # If it's a DictionaryBrowser, convert to dict
        if hasattr(metadata_dict, 'as_dictionary'):
            metadata_dict = metadata_dict.as_dictionary()
            
        for key, value in metadata_dict.items():
            # Skip private keys
            if key.startswith('_'):
                continue
                
            try:
                # Handle nested dictionaries
                if hasattr(value, 'as_dictionary') or isinstance(value, dict):
                    result[key] = self._convert_metadata_to_serializable(value)
                # Handle numpy arrays
                elif hasattr(value, 'tolist'):
                    result[key] = value.tolist()
                # Handle basic types
                elif isinstance(value, (str, int, float, bool, list)):
                    result[key] = value
                # Convert other types to string representation
                else:
                    result[key] = str(value)
            except Exception as e:
                print(f"Warning: Could not convert metadata key {key}: {str(e)}")
                result[key] = str(value)
                
        return result

def load_axes_manager(signal):
    """
    Loads axes manager information from a signal in a microscopy file.

    Args:
        filename: Name of the file to load axes manager from
        index: Index of the signal to load axes manager from (defaults to 0)
        
    Returns:
        dict: Dictionary containing axes manager information including:
            - offset: The offset value of the first axis
            - scale: The scale value of the first axis
            - units: The units of the first axis
    """
    print(f"\n=== Starting load_axes_manager() in data_functions.py ===")
    try:
        
        
        axes_info = {}
        
        # Access axes manager information
        if hasattr(signal, 'axes_manager') and len(signal.axes_manager) > 0:
            print("\nExtracting axes manager information...")
            try:
                first_axis = signal.axes_manager[2]
                axes_info = {
                    'offset': first_axis.offset,
                    'scale': first_axis.scale,
                    'units': first_axis.units
                }
                print(f"Found axes information: {axes_info}")
            except Exception as e:
                print(f"Error extracting axes information: {str(e)}")
                raise
        else:
            print("No axes manager found or axes manager is empty")
            return None
        
        print("=== Ending load_axes_manager() successfully ===\n")
        return axes_info
        
    except Exception as e:
        print(f"\n!!! Error loading axes manager for {signal.metadata.General.title} !!!")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=== Ending load_axes_manager() with error ===\n")
        raise