from operations import file_functions, signal_functions
from utils.constants import DATA_DIR
import os
import numpy as np
import hyperspy.api as hs

class SignalService:
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
            print(f"DATA_DIR: {DATA_DIR}")
            
            # Construct full filepath
            filepath = os.path.join(DATA_DIR, filename)
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
            
            print("\nCaching signals...")
            # Cache the results
            try:
                signal_functions.cache_signals(filepath, signal_list)
                print("Signals cached successfully")
            except Exception as e:
                print(f"Error caching signals: {str(e)}")
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

    def get_spectrum_data(self, filename, signal_idx, x, y):
        print(f"\n=== Starting get_spectrum_data() in SignalService ===")
        print(f"Loading file: {filename}")
        print(f"Signal index: {signal_idx}, x: {x}, y: {y}")
        
        # Construct full filepath
        filepath = os.path.join(DATA_DIR, filename)
        print(f"Constructed filepath: {filepath}")
        print(f"File exists: {os.path.exists(filepath)}")
        
        signal = file_functions.load_file(filepath)
        print(f"\nLoaded signal type: {type(signal)}")
        
        if isinstance(signal, list):
            # print(f"Signal is a list with {len(signal)} items")
            if signal_idx >= len(signal):
                raise ValueError(f"Signal index {signal_idx} out of range (max {len(signal)-1})")
            signal = signal[signal_idx]
            # print(f"Selected signal {signal_idx}, type: {type(signal)}")
        
        # print(f"Signal has data attribute: {hasattr(signal, 'data')}")
        # if hasattr(signal, 'data'):
        #     print(f"Signal data type: {type(signal.data)}")
        #     print(f"Signal data has shape attribute: {hasattr(signal.data, 'shape')}")
        #     if hasattr(signal.data, 'shape'):
        #         print(f"Signal data shape: {signal.data.shape}")

        if not hasattr(signal, 'data') or not hasattr(signal.data, 'shape'):
            print("=== Ending extract_spectrum_data_from_signal() in signal_service.py with error ===\n")
            raise ValueError("Signal has no data or shape")
            
        shape = signal.data.shape
        dims = len(shape)
        print(f"Signal dimensions: {dims}")
        
        if dims == 1:
            # For 1D signals, use data directly as spectrum
            print("=== Ending extract_spectrum_data_from_signal() in signal_service.py successfully ===\n")
            return signal.data.tolist()
        elif dims == 2:
            # For 2D signals, extract spectrum at x coordinate
            if x >= shape[0]:
                print("=== Ending extract_spectrum_data_from_signal() in signal_service.py with error ===\n")
                raise ValueError(f"X coordinate {x} out of bounds (max {shape[0]-1})")
            print("=== Ending extract_spectrum_data_from_signal() in signal_service.py successfully ===\n")
            return signal.data[x].tolist()
        elif dims == 3:
            # For 3D signals, extract spectrum at (x,y) coordinates
            if x >= shape[0] or y >= shape[1]:
                print("=== Ending extract_spectrum_data_from_signal() in signal_service.py with error ===\n")
                raise ValueError(f"Coordinates ({x},{y}) out of bounds (max {shape[0]-1},{shape[1]-1})")
            print("=== Ending extract_spectrum_data_from_signal() in signal_service.py successfully ===\n")
            return signal.data[x,y].tolist()
        else:
            print("=== Ending extract_spectrum_data_from_signal() in signal_service.py with error ===\n")
            raise ValueError(f"Signal with {dims} dimensions cannot be displayed as spectrum")

    def get_image_data(self, filename, signal_idx):
        print(f"\n=== Starting get_image_data() from signal_service.py ===")
        try:
            print(f"\nExtracting data from {filename}")
            filepath = os.path.join(DATA_DIR, filename)
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

    def get_metadata(self, filename, signal_idx):
        """
        Gets metadata for a specific signal in a file.
        Args:
            filename (str): Name of the file to get metadata from
            signal_idx (int): Index of the signal to get metadata from
        Returns:
            dict: Dictionary containing metadata for the specific signal
        """
        print(f"\n=== Starting get_metadata() in SignalService ===")
        try:
            print(f"Getting metadata for file: {filename}, signal index: {signal_idx}")
            filepath = os.path.join(DATA_DIR, filename)
            
            # Load the file (will use cache if available)
            signal = file_functions.load_file(filepath)
            print(f"\nLoaded signal type: {type(signal)}")
            
            if isinstance(signal, list):
                print(f"Signal is a list with {len(signal)} items")
                if signal_idx >= len(signal):
                    raise ValueError(f"Signal index {signal_idx} out of range (max {len(signal)-1})")
                signal_data = signal[signal_idx]
                print(f"Selected signal {signal_idx}, type: {type(signal_data)}")
            
            # Extract metadata
            metadata = {
                "axes": [],
                "shape": [],
                "signal_type": str(type(signal_data)),
                "original_metadata": {}
            }
            
            # Get axes information
            if hasattr(signal_data, 'axes_manager'):
                print("\nProcessing axes information:")
                for i, axis in enumerate(signal_data.axes_manager):
                    axis_info = {}
                    
                    # Handle both object-style and tuple-style axes
                    if hasattr(axis, 'name'):
                        # Object-style axis
                        axis_info = {
                            "name": axis.name,
                            "size": axis.size,
                            "units": axis.units,
                            "scale": axis.scale,
                            "offset": axis.offset
                        }
                    else:
                        # Tuple-style axis
                        # For tuple axes, create a generic name and extract what we can
                        axis_info = {
                            "name": f"Axis {i}",
                            "size": len(axis) if hasattr(axis, '__len__') else None,
                            "units": getattr(axis, 'units', None),
                            "scale": getattr(axis, 'scale', None),
                            "offset": getattr(axis, 'offset', None)
                        }
                    
                    # print(f"Axis {i} info: {axis_info}")
                    metadata["axes"].append(axis_info)
            
            # Get shape information
            if hasattr(signal_data, 'data') and hasattr(signal_data.data, 'shape'):
                metadata["shape"] = list(signal_data.data.shape)
                print(f"\nSignal shape: {metadata['shape']}")
            
            # Get original metadata
            if hasattr(signal_data, 'original_metadata'):
                print("\nExtracting original metadata")
                # Convert metadata to a serializable format
                try:
                    metadata["original_metadata"] = self._convert_metadata_to_serializable(
                        signal_data.original_metadata
                    )
                except Exception as e:
                    print(f"Warning: Could not convert all metadata to serializable format: {str(e)}")
            
            print("\nMetadata extracted successfully")
            print("=== Ending get_metadata() successfully ===\n")
            return metadata
            
        except Exception as e:
            print(f"Error getting metadata: {str(e)}")
            import traceback
            traceback.print_exc()
            print("=== Ending get_metadata() with error ===\n")
            return None
            
    def _convert_metadata_to_serializable(self, metadata_dict):
        """
        Recursively converts metadata to a JSON-serializable format.
        Args:
            metadata_dict: Dictionary or DictionaryBrowser containing metadata
        Returns:
            dict: Dictionary with all values converted to serializable types
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
