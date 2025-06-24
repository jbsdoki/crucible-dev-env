import numpy as np



"""Extract spectrum data from a signal.

Args:
    signal: A HyperSpy signal object
Returns:
    list: List of intensity values representing the spectrum
    
Raises:
    ValueError: If signal cannot be displayed as a spectrum
"""
def extract_spectrum_data(signal):
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
