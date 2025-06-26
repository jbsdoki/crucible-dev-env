import numpy as np
from typing import Dict, Any, Optional

def extract_image_data(signal) -> Optional[Dict[str, Any]]:
    """
    Extracts 2D image data from a HyperSpy signal object.
    
    Args:
        signal: HyperSpy signal object containing either 2D or 3D data
        
    Returns:
        Dictionary containing:
            - data_shape: Original shape of the signal data
            - image_data: 2D array of image data (as list)
            - image_shape: Shape of the processed 2D image
            - data_range: Min and max values of the data
            
    Raises:
        ValueError: If signal dimensions are not 2D or 3D
        TypeError: If signal data is not in expected format
        Exception: For other processing errors
    """
    print("\n=== Starting extract_image_data() in image_viewer_functions.py ===")
    
    try:
        # Validate input
        if not hasattr(signal, 'data'):
            raise TypeError("Input signal must have 'data' attribute")
            
        # Get the shape of the data
        data_shape = signal.data.shape
        print(f"Input signal shape: {data_shape}")
        
        # Process data based on dimensions
        print("Processing image data...")
        print(f"Input data type: {signal.data.dtype}")
        print(f"Input data range: [{signal.data.min()}, {signal.data.max()}]")
        
        if len(data_shape) == 2:
            image_data = signal.data
            print("2D signal - using data directly")
        elif len(data_shape) == 3:
            image_data = np.sum(signal.data, axis=2)
            print("3D signal - summing across spectrum dimension")
        else:
            raise ValueError(f"Signal must be 2D or 3D, got shape {data_shape}")
            
        # Record processed data properties
        image_shape = image_data.shape
        data_min = float(image_data.min())
        data_max = float(image_data.max())
        
        print(f"Processed image shape: {image_shape}")
        print(f"Processed data range: [{data_min}, {data_max}]")
        
        # Prepare return data
        result = {
            "data_shape": data_shape,
            "image_data": image_data.astype(float).tolist(),
            "image_shape": image_shape,
            "data_range": {
                "min": data_min,
                "max": data_max
            }
        }
        
        print("=== Successfully completed extract_image_data() in image_viewer_functions.py ===\n")
        return result
        
    except ValueError as ve:
        print(f"ValueError in extract_image_data: {str(ve)}")
        raise  # Re-raise for handling by service layer
    except TypeError as te:
        print(f"TypeError in extract_image_data: {str(te)}")
        raise  # Re-raise for handling by service layer
    except Exception as e:
        print(f"Unexpected error in extract_image_data: {str(e)}")
        import traceback
        traceback.print_exc()
        raise  # Re-raise for handling by service layer