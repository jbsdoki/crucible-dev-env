import numpy as np



"""Extract whole spectrum data from a signal.

Args:
    signal: A HyperSpy signal object
Returns:
    list: List of intensity values representing the spectrum
    
Raises:
    ValueError: If signal cannot be displayed as a spectrum
"""
def extract_whole_spectrum_data(signal):
    print(f"\n=== Starting extract_spectrum_data() in spectrum_viewer_functions.py ===")

    if not hasattr(signal, 'data') or not hasattr(signal.data, 'shape'):
        print("=== Ending extract_spectrum_data() in spectrum_viewer_functions.py with error ===\n")
        raise ValueError("Signal has no data or shape")
        
    shape = signal.data.shape
    dims = len(shape)
    print(f"Signal dimensions: {dims}")
    
    if dims == 1:
        # For 1D signals, use data directly as spectrum
        print("=== Ending extract_spectrum_data() in spectrum_viewer_functions.py successfully ===\n")
        return signal.data.tolist()
    elif dims == 3:
        # For 3D signals, sum along both spatial dimensions (0 and 1) to get a 1D spectrum
        print("Original shape: ", signal.data.shape)
        summed_data = np.sum(signal.data, axis=(0, 1))
        print("Shape after summing: ", summed_data.shape)
        return summed_data.tolist()
    else:
        print("=== Ending extract_spectrum_data() in spectrum_viewer_functions.py with error ===\n")
        raise ValueError(f"Signal with {dims} dimensions cannot be displayed as spectrum")





"""Extract spectrum data from a signal.

Args:
    signal: A HyperSpy signal object
Returns:
    list: List of intensity values representing the spectrum
    
Raises:
    ValueError: If signal cannot be displayed as a spectrum
"""
def extract_spectrum_range(signal, region: dict):
    print(f"\n=== Starting extract_spectrum_range() in spectrum_viewer_functions.py ===")

    if not hasattr(signal, 'data') or not hasattr(signal.data, 'shape'):
        print("=== Ending extract_spectrum_range() in spectrum_viewer_functions.py with error ===\n")
        raise ValueError("Signal has no data or shape")
        
    # Extract coordinates
    x1, y1 = region['x1'], region['y1']
    x2, y2 = region['x2'], region['y2']
    
    print(f"\nReceived coordinates from frontend:")
    print(f"x1, y1: ({x1}, {y1})")
    print(f"x2, y2: ({x2}, {y2})")
    
    # Ensure coordinates are within bounds
    height, width, _ = signal.data.shape
    print(f"\nSignal data shape: {signal.data.shape}")
    print(f"Height x Width: {height} x {width}")
    
    x1 = max(0, min(x1, width - 1))
    x2 = max(0, min(x2, width - 1))
    y1 = max(0, min(y1, height - 1))
    y2 = max(0, min(y2, height - 1))
    
    # Ensure x1 < x2 and y1 < y2
    x1, x2 = min(x1, x2), max(x1, x2)
    y1, y2 = min(y1, y2), max(y1, y2)
    
    region_data = signal.data[y1:y2+1, x1:x2+1, :]
    
    summed_spectrum = np.sum(region_data, axis=(0, 1))
    
    return summed_spectrum.tolist()
