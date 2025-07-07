import os
from utils.constants import DATA_DIR, CURRENT_FILE
import numpy as np



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
        if hasattr(signal, 'axes_manager'):
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

def load_spectrum_axes(signal):
    """
    Loads signal axis information from a signal in a microscopy file.
    This function specifically extracts the signal axis (non-navigation axes) data.

    Args:
        signal: The hyperspy signal object containing the spectrum data
        
    Returns:
        list: List of dictionaries containing signal axes information, where each dict includes:
            - name: The name of the axis
            - size: The size/length of the axis
            - offset: The offset value of the axis
            - scale: The scale value of the axis
            - units: The units of the axis
            
    Raises:
        ValueError: If no signal axes are found in the signal
    """
    print(f"\n=== Starting load_spectrum_axes() in data_functions.py ===")
    try:
        # Check if signal has axes_manager
        if not hasattr(signal, 'axes_manager'):
            raise ValueError("Signal does not have an axes_manager")

        # Get signal axes using the signal_axes property
        signal_axes = signal.axes_manager.signal_axes
        
        if not signal_axes:
            raise ValueError("No signal axes found in the signal")
            
        axes_info = []
        print("\nExtracting signal axes information...")
        
        # Extract information for each signal axis
        for axis in signal_axes:
            axis_data = {
                'name': axis.name,
                'size': axis.size,
                'offset': axis.offset,
                'scale': axis.scale,
                'units': axis.units
            }
            axes_info.append(axis_data)
            print(f"Found signal axis: {axis.name}")
            
        print(f"Total signal axes found: {len(axes_info)}")
        print("=== Ending load_spectrum_axes() successfully ===\n")
        return axes_info
        
    except Exception as e:
        print(f"\n!!! Error loading signal axes !!!")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=== Ending load_spectrum_axes() with error ===\n")
        raise


def extract_summed_spectrum(signal):
    """
    Extracts the signal data summed over all navigation dimensions.
    For example, in an EDS spectrum image, this would return the spectrum summed over all spatial points.

    Note: The returned intensities are raw counts/values and don't need scaling.
    For energy values (x-axis), use signal.axes_manager.signal_axes[0].axis which already includes
    calibration (offset and scale).

    Args:
        signal: The hyperspy signal object containing the spectrum data
        
    Returns:
        numpy.ndarray: The signal data summed over all navigation dimensions.
                      For a spectrum, this would be a 1D array of intensities (raw counts).
    """
    return signal.sum().data.tolist()

def get_spectrum_data(signal):
    """
    Combines the energy axis values and summed spectrum data into a single dictionary.
    This makes it easy to access both x and y values for plotting.

    Args:
        signal: The hyperspy signal object containing the spectrum data

    Returns:
        dict: Dictionary containing:
            - 'x': list of energy values (the axis data)
            - 'y': list of summed intensities
            - 'x_label': string label for x-axis (e.g., 'Energy')
            - 'x_units': string units for x-axis (e.g., 'keV')
            - 'y_label': string label for y-axis (e.g., 'Counts')
    """
    # Get the signal axis (usually energy for EDS)
    signal_axis = signal.axes_manager.signal_axes[0]
    
    # Convert NumPy arrays to lists for JSON serialization
    x_values = signal_axis.axis.tolist() if hasattr(signal_axis.axis, 'tolist') else list(signal_axis.axis)
    y_values = signal.sum().data.tolist() if hasattr(signal.sum().data, 'tolist') else list(signal.sum().data)
    
    return {
        'x': x_values,
        'y': y_values,
        'x_label': signal_axis.name,
        'x_units': signal_axis.units,
        'y_label': 'Counts' if signal.metadata.Signal.signal_type == "EDS_TEM" else 'Intensity'
    }


def get_zero_index(signal):
    """
    Finds the index where energy = 0 in the spectrum.
    
    Args:
        signal: The hyperspy signal object
        
    Returns:
        int: Index where energy = 0, or None if not found
    """
    try:
        # Get the energy axis
        energy_axis = signal.axes_manager.signal_axes[0]
        
        # Calculate index where energy = 0
        zero_index = int(round(-energy_axis.offset / energy_axis.scale))
        
        # Verify the index is within bounds
        if 0 <= zero_index < energy_axis.size:
            return zero_index
        return None
        
    except Exception as e:
        print(f"Error finding zero index: {str(e)}")
        return None

def get_half_zero_height(signal, zero_index):
    """
    Calculates half of the height at the zero peak.
    
    Args:
        signal: The hyperspy signal object
        zero_index: Index where energy = 0
        
    Returns:
        float: Half of the height at zero peak
    """
    try:
        # Get the summed spectrum data
        spectrum_data = signal.sum().data
        
        # Get height at zero peak
        height = float(spectrum_data[zero_index])
        return height / 2
        
    except Exception as e:
        print(f"Error calculating half zero height: {str(e)}")
        return None

def remove_zero_peak(spectrum_data, half_zero_height, zero_index):
    """
    Zeros out the spectrum data from the beginning up to the FWHM point.
    
    Args:
        spectrum_data (dict): Dictionary containing x and y values of the spectrum
        half_zero_height (float): Half of the height at zero peak
        zero_index (int): Index where energy = 0
        
    Returns:
        list: Modified y-values with zero peak removed, or None if error
    """
    try:
        # Get y-values from spectrum data
        y_values = spectrum_data['y']
        if isinstance(y_values, np.ndarray):
            y_values = y_values.tolist()
            
        tolerance = half_zero_height * 0.05  # 5% tolerance for finding half max
        half_max_index = zero_index  # Default to zero index if no FWHM found
        
        # Find the FWHM point
        for i in range(zero_index + 1, len(y_values)):
            if abs(y_values[i] - half_zero_height) <= tolerance:
                half_max_index = i
                break
            elif y_values[i] < half_zero_height:
                # If we've gone below half max, use the closer of this point or previous point
                if i > zero_index + 1:
                    prev_diff = abs(y_values[i-1] - half_zero_height)
                    curr_diff = abs(y_values[i] - half_zero_height)
                    half_max_index = i if curr_diff < prev_diff else i-1
                else:
                    half_max_index = i
                break
        
        # Zero out all data from start to FWHM
        modified_data = y_values.copy()  # Make a copy to not modify original
        for i in range(0, half_max_index + 1):
            modified_data[i] = 1
        
        return modified_data
        
    except Exception as e:
        print(f"Error removing zero peak: {str(e)}")
        return None

    