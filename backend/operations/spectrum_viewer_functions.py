from .file_functions import try_load_signal_from_saved_file
from .signal_functions import get_signals_from_file



"""Extract spectrum data from a signal.

Args:
    signal: A HyperSpy signal object
    x: X coordinate for 2D/3D signals (default: 0)
    y: Y coordinate for 3D signals (default: 0)
    
Returns:
    list: List of intensity values representing the spectrum
    
Raises:
    ValueError: If signal cannot be displayed as a spectrum
"""
def extract_spectrum_data_from_signal(signal, x=0, y=0):
    print(f"\n=== Starting extract_spectrum_data_from_signal() in file_service.py ===")
    print(f"Signal type: {type(signal)}")
    print(f"Signal shape: {signal.data.shape}")
    
    if not hasattr(signal, 'data') or not hasattr(signal.data, 'shape'):
        print("=== Ending extract_spectrum_data_from_signal() in file_service.py with error ===\n")
        raise ValueError("Signal has no data or shape")
        
    shape = signal.data.shape
    dims = len(shape)
    
    if dims == 1:
        # For 1D signals, use data directly as spectrum
        print("=== Ending extract_spectrum_data_from_signal() in file_service.py successfully ===\n")
        return signal.data.tolist()
    elif dims == 2:
        # For 2D signals, extract spectrum at x coordinate
        if x >= shape[0]:
            print("=== Ending extract_spectrum_data_from_signal() in file_service.py with error ===\n")
            raise ValueError(f"X coordinate {x} out of bounds (max {shape[0]-1})")
        print("=== Ending extract_spectrum_data_from_signal() in file_service.py successfully ===\n")
        return signal.data[x].tolist()
    elif dims == 3:
        # For 3D signals, extract spectrum at (x,y) coordinates
        if x >= shape[0] or y >= shape[1]:
            print("=== Ending extract_spectrum_data_from_signal() in file_service.py with error ===\n")
            raise ValueError(f"Coordinates ({x},{y}) out of bounds (max {shape[0]-1},{shape[1]-1})")
        print("=== Ending extract_spectrum_data_from_signal() in file_service.py successfully ===\n")
        return signal.data[x,y].tolist()
    else:
        print("=== Ending extract_spectrum_data_from_signal() in file_service.py with error ===\n")
        raise ValueError(f"Signal with {dims} dimensions cannot be displayed as spectrum")
