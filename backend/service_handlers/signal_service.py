from operations import file_functions, signal_functions, spectrum_functions
from utils import constants
import os
import numpy as np
import hyperspy.api as hs

class SignalService:
    #############################################################################
    #                              Signal List Methods                            #
    #############################################################################
    
    def get_signal_list(self, filename: str):
        """
        Gets a list of signals from a file.
        Args:
            filename (str): Name of the file to get signals from
        Returns:
            list: List of signals from the file
        """
        try:
            print("\n=== Starting get_signal_list in SignalService ===")
            print(f"Input filename: {filename}")
            print(f"DATA_DIR: {constants.DATA_DIR}")
            
            # Construct full filepath
            filepath = os.path.join(constants.DATA_DIR, filename)
            print(f"Constructed filepath: {filepath}")
            print(f"File exists: {os.path.exists(filepath)}")
            
            print("\nChecking cached signals...")
            # First check if we have cached signals
            cached_signals = signal_functions.get_cached_signals(filepath)
            print(f"Cached signals found: {cached_signals is not None}")
            if cached_signals:
                print("Returning cached signals")
                return cached_signals
            
            print("\nLoading file...")
            # If not cached, load the file
            try:
                file_data = file_functions.load_file(filepath)
                print(f"File loaded successfully: {file_data is not None}")
            except Exception as e:
                print(f"Error loading file: {str(e)}")
                raise
            
            print("\nGetting signal titles...")
            # Get signal list
            try:
                signal_list = signal_functions.extract_signal_list(file_data)
                print(f"Signal titles retrieved: {signal_list is not None}")
                if signal_list:
                    print(f"Number of signals found: {len(signal_list)}")
            except Exception as e:
                print(f"Error getting signal titles: {str(e)}")
                raise
            
            print("=== Ending get_signal_list in SignalService ===\n")
            return signal_list
            
        except Exception as e:
            print(f"\nError in signal service: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print("Traceback:")
            traceback.print_exc()
            raise e

    #############################################################################
    #                              Spectrum Methods                               #
    #############################################################################

    def get_spectrum_from_region(self, filename: str, signal_idx: int, region: dict):
        """
        Gets spectrum data from a specific region of a 3D signal.
        Args:
            filename (str): Name of the file
            signal_idx (int): Index of the signal
            region (dict): Dictionary containing x1, y1, x2, y2 coordinates
        Returns:
            list: Averaged spectrum data from the selected region
        """
        print(f"\n=== Starting get_spectrum_from_region() in SignalService ===")
        try:
            filepath = os.path.join(constants.DATA_DIR, filename)
            signal = file_functions.load_file(filepath)
            
            if isinstance(signal, list):
                if signal_idx >= len(signal):
                    raise ValueError(f"Signal index {signal_idx} out of range")
                signal = signal[signal_idx]

            # Ensure we have a 3D signal
            if len(signal.data.shape) != 3:
                raise ValueError("Selected signal must be 3D for region selection")

            # Extract coordinates
            x1, y1 = region['x1'], region['y1']
            x2, y2 = region['x2'], region['y2']
            
            # Ensure coordinates are within bounds
            height, width, _ = signal.data.shape
            x1 = max(0, min(x1, width - 1))
            x2 = max(0, min(x2, width - 1))
            y1 = max(0, min(y1, height - 1))
            y2 = max(0, min(y2, height - 1))
            
            # Ensure x1 < x2 and y1 < y2
            x1, x2 = min(x1, x2), max(x1, x2)
            y1, y2 = min(y1, y2), max(y1, y2)
            
            print(f"Extracting spectrum from region: ({x1}, {y1}) to ({x2}, {y2})")
            
            # Extract and average the spectra from the selected region
            region_data = signal.data[y1:y2+1, x1:x2+1, :]
            print(f"Region data shape: {region_data.shape}")
            averaged_spectrum = np.sum(region_data, axis=(0, 1))
            
            return averaged_spectrum.tolist()
            
        except Exception as e:
            print(f"Error in get_spectrum_from_region: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def get_spectrum_data(self, filename, signal_idx):
        """
        Gets spectrum data from a file.
        Args:
            filename (str): Name of the file to get spectrum data from
            signal_idx (int): Index of the signal to get spectrum data from
        Returns:
            list: List of spectrum data points
        """
        print(f"\n=== Starting get_spectrum_data() in SignalService ===")
        
        # Construct full filepath
        filepath = constants.full_filepath(filename)

        signal = file_functions.load_file(filepath)
        print(f"\nLoaded signal type: {type(signal)}")
        
        if isinstance(signal, list):
            # print(f"Signal is a list with {len(signal)} items")
            if signal_idx >= len(signal):
                raise ValueError(f"Signal index {signal_idx} out of range (max {len(signal)-1})")
            signal = signal[signal_idx]
            # print(f"Selected signal {signal_idx}, type: {type(signal)}")

        return spectrum_functions.extract_spectrum_data(signal)
      
    #############################################################################
    #                               Image Methods                                 #
    #############################################################################

    def get_image_data(self, filename, signal_idx):
        """
        Gets the image data from a file.
        Args:
            filename (str): Name of the file to get image data from
            signal_idx (int): Index of the signal to get image data from
        Returns:
            dict: Dictionary containing the image data
        """
        print(f"\n=== Starting get_image_data() from signal_service.py ===")
        try:
            print(f"\nExtracting data from {filename}")
            filepath = os.path.join(constants.DATA_DIR, filename)
            print(f"Constructed filepath: {filepath}")
            print(f"File exists: {os.path.exists(filepath)}")
            
            signal = file_functions.load_file(filepath)
            print(f"\nLoaded signal type: {type(signal)}")

            if isinstance(signal, list):
                print(f"Signal is a list with {len(signal)} items")
                if signal_idx >= len(signal):
                    raise ValueError(f"Signal index {signal_idx} out of range (max {len(signal)-1})")
                signal_data = signal[signal_idx]
                print(f"Selected signal {signal_idx}, type: {type(signal_data)}")
                
            # Get the shape of the data
            data_shape = signal_data.data.shape
            print(f"Signal shape: {data_shape}")
            
            # Create 2D image data based on signal dimensions
            print("\nProcessing image data:")
            print(f"Initial data type: {signal_data.data.dtype}")
            print(f"Initial data range: min={signal_data.data.min()}, max={signal_data.data.max()}")
            
            # Handle different dimensionalities
            if len(data_shape) == 2:
                # For 2D signals, use the data directly
                image_data = signal_data.data
                print("2D signal - using data directly")
            elif len(data_shape) == 3:
                # For 3D signals, sum across spectrum dimension
                image_data = np.sum(signal_data.data, axis=2)
                print("3D signal - summing across spectrum dimension")
            else:
                raise ValueError(f"Unsupported data shape: {data_shape}")
                
            print(f"Image shape after processing: {image_data.shape}")
            print(f"Data range after processing: min={image_data.min()}, max={image_data.max()}")
            
            # Store shape and range before converting to list
            image_shape = image_data.shape
            data_min = float(image_data.min())
            data_max = float(image_data.max())
            
            # Convert to Python native types for JSON serialization
            image_data = image_data.astype(float).tolist()
            
            result = {
                "signal_idx": signal_idx,
                "data_shape": data_shape,
                "image_data": image_data,
                "image_shape": image_shape,
                "data_range": {
                    "min": data_min,
                    "max": data_max
                }
            }
            
            print("\nExtracted data successfully")
            print(f"Signal index: {signal_idx}")
            print(f"Data shape: {data_shape}")
            print(f"Image shape: {image_shape}")
            print(f"Data range: min={data_min}, max={data_max}")
            
            print("=== Ending extract_image_from_signal() successfully ===\n")
            return result
            
        except Exception as e:
            print(f"Error extracting data from {filename}: {str(e)}")
            import traceback
            traceback.print_exc()
            print("=== Ending extract_image_from_signal() with error ===\n")
            return None

    #############################################################################
    #                              HAADF Methods                                  #
    #############################################################################

    def get_haadf_data(self, filename):
        """
        Gets the HAADF data from a file.
        Args:
            filename (str): Name of the file to get HAADF data from
        Returns:
            dict: Dictionary containing the HAADF data
        """
        print(f"\n=== Starting get_haadf_data() in SignalService ===")
        try:
            print(f"\nExtracting data from {filename}")
            filepath = os.path.join(constants.DATA_DIR, filename)
            print(f"Constructed filepath: {filepath}")
            print(f"File exists: {os.path.exists(filepath)}")
            
            # Load all signals from the file
            signals = file_functions.get_signals_from_file(filepath)
            print(f"\nLoaded signals type: {type(signals)}")
            
            # Get the signal list to find HAADF
            signal_list = signal_functions.extract_signal_list(signals)
            
            # Find the HAADF signal
            haadf_idx = None
            for idx, signal_info in enumerate(signal_list):
                if 'HAADF' in signal_info['title'].upper():
                    haadf_idx = idx
                    break
            
            if haadf_idx is None:
                print("No HAADF signal found in file")
                return None
                
            # Get the HAADF signal
            signal_data = signals[haadf_idx]
            
            # Get the shape of the data
            data_shape = signal_data.data.shape
            print(f"HAADF signal shape: {data_shape}")
            
            # Create 2D image data
            print("\nProcessing HAADF image data:")
            print(f"Initial data type: {signal_data.data.dtype}")
            print(f"Initial data range: min={signal_data.data.min()}, max={signal_data.data.max()}")
            
            # Handle different dimensionalities
            if len(data_shape) == 2:
                # For 2D signals, use the data directly
                image_data = signal_data.data
                print("2D signal - using data directly")
            else:
                raise ValueError(f"Unsupported data shape: {data_shape}")
                
            print(f"Image shape after processing: {image_data.shape}")
            print(f"Data range after processing: min={image_data.min()}, max={image_data.max()}")
            
            # Normalize the image data for display
            if image_data.size > 0:
                image_data = (image_data - image_data.min()) / (image_data.max() - image_data.min())
                image_data = (image_data * 255).astype(np.uint8)
                print(f"After normalization - range: min={image_data.min()}, max={image_data.max()}")
                print(f"Final data type: {image_data.dtype}")
            
            result = {
                "data_shape": data_shape,
                "image_data": image_data.tolist()
            }
            
            print("=== Ending get_haadf_data() successfully ===\n")
            return result
            
        except Exception as e:
            print(f"Error extracting HAADF data from {filename}: {str(e)}")
            import traceback
            traceback.print_exc()
            print("=== Ending get_haadf_data() with error ===\n")
            return None

    #############################################################################
    #                             Metadata Methods                                #
    #############################################################################

    def get_metadata(self, filename, signal_idx):
        """
        Gets metadata from a file.
        Args:
            filename (str): Name of the file to get metadata from
            signal_idx (int): Index of the signal to get metadata from
        Returns:
            dict: Dictionary containing metadata
        """
        print(f"\n=== Starting get_metadata() in SignalService ===")
        try:
            print(f"Getting metadata for file: {filename}, signal index: {signal_idx}")
            filepath = os.path.join(constants.DATA_DIR, filename)
            
            # Load the file (will use cache if available)
            signal = file_functions.load_file(filepath)
            print(f"\nLoaded signal type: {type(signal)}")
            
            if isinstance(signal, list):
                print(f"Signal is a list with {len(signal)} items")
                if signal_idx >= len(signal):
                    raise ValueError(f"Signal index {signal_idx} out of range (max {len(signal)-1})")
                signal_data = signal[signal_idx]
                print(f"Selected signal {signal_idx}, type: {type(signal_data)}")
            
            # Get the metadata
            if hasattr(signal_data, 'metadata'):
                metadata = self._convert_metadata_to_serializable(signal_data.metadata)
                print("\nMetadata extracted successfully")
                print("=== Ending get_metadata() successfully ===\n")
                return metadata
            else:
                print("No metadata found in signal")
                return {}
            
        except Exception as e:
            print(f"Error getting metadata: {str(e)}")
            import traceback
            traceback.print_exc()
            print("=== Ending get_metadata() with error ===\n")
            return None
            
    def _convert_metadata_to_serializable(self, metadata_dict):
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
