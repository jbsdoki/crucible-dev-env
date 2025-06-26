from .file_functions import try_load_signal_from_saved_file
from .signal_functions import get_signals_from_file

def extract_image_data(signal):
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