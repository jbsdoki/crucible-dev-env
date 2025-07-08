from operations import signal_functions, spectrum_functions, image_viewer_functions, data_functions
from service_handlers.file_service import FileService
from utils import constants
import os
import numpy as np
import hyperspy.api as hs
from typing import List, Dict, Any, Tuple

# FileService is a class that handles file operations

class SignalService:
    def __init__(self):
        self.file_service = FileService()

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
            
            #Get all signals from file
            signals = self.file_service.get_or_load_file(filename)
            
            print("\nGetting signal titles...")
            # Get signal list
            try:
                signal_list = signal_functions.extract_signal_list(signals)
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
    #                              Spectrum Methods                             #
    #############################################################################

    def get_spectrum_data(self, filename, signal_idx):
        """
        Gets spectrum data in the new format that includes both x and y values with units.
        The data includes zero peak and FWHM indices for frontend visualization.
        
        Args:
            filename (str): Name of the file to get spectrum data from
            signal_idx (int): Index of the signal to get spectrum data from
        Returns:
            dict: Dictionary containing:
                - x: array of energy values
                - y: array of intensity values
                - x_label: label for x-axis
                - x_units: units for x-axis
                - y_label: label for y-axis
                - zero_index: index where energy = 0 (or None if not found)
                - fwhm_index: index at FWHM point after zero peak (or None if not found)
        """
        print(f"\n=== Starting get_spectrum_data() in SignalService ===")
        
        try:
            # Get signal from cache or load it
            signal = self.file_service.get_or_load_file(filename, signal_idx)

            # Get the spectrum data with indices
            spectrum_data = data_functions.get_spectrum_data(signal)
            
            print("\nSpectrum Data Analysis:")
            print(f"X-axis length: {len(spectrum_data['x'])}")
            print(f"Y-axis length: {len(spectrum_data['y'])}")
            print(f"First 5 X values (keV): {spectrum_data['x'][:5]}")
            print(f"X-axis range: {min(spectrum_data['x'])} to {max(spectrum_data['x'])} {spectrum_data['x_units']}")
            print(f"Zero index: {spectrum_data['zero_index']}")
            print(f"FWHM index: {spectrum_data['fwhm_index']}")
                
            return spectrum_data
            
        except Exception as e:
            print(f"Error in get_spectrum_data: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def get_spectrum_from_2d(self, filename: str, signal_idx: int, region: dict):
        """
        Gets spectrum data from a specific region of a 3D signal.
        Args:
            filename (str): Name of the file
            signal_idx (int): Index of the signal
            region (dict): Dictionary containing x1, y1, x2, y2 coordinates as floats
        Returns:
            list: Averaged spectrum data from the selected region
        """
        print(f"\n=== Starting get_spectrum_from_2d() in SignalService ===")
        try:
            # Get signal from cache or load it
            signal = self.file_service.get_or_load_file(filename, signal_idx)

            # Ensure we have a 3D signal
            if len(signal.data.shape) != 3:
                raise ValueError("Selected signal must be 3D for region selection")

            # Get axes information to identify the spectrum axis
            axes_data = data_functions.load_axes_manager(signal)
            if not axes_data:
                raise ValueError("Could not load axes information")

            # Extract coordinates as floats
            x1, y1 = float(region['x1']), float(region['y1'])
            x2, y2 = float(region['x2']), float(region['y2'])
            
            # Ensure coordinates are within bounds
            height, width, _ = signal.data.shape
            x1 = max(0.0, min(x1, float(width)))
            x2 = max(0.0, min(x2, float(width)))
            y1 = max(0.0, min(y1, float(height)))
            y2 = max(0.0, min(y2, float(height)))
            
            # Ensure x1 < x2 and y1 < y2
            x1, x2 = min(x1, x2), max(x1, x2)
            y1, y2 = min(y1, y2), max(y1, y2)
            
            # Use isig to get the region and sum over spatial dimensions
            # The [:, :] at the end ensures we get all spectrum values
            region_signal = signal.isig[:, :][y1:y2, x1:x2]
            
            # Sum over the spatial dimensions to get the average spectrum
            summed_spectrum = region_signal.sum(axis=(0, 1))
            
            # Convert to list for JSON serialization
            return summed_spectrum.data.tolist()
            
        except Exception as e:
            print(f"Error in get_spectrum_from_region: {str(e)}")
            import traceback
            traceback.print_exc()
            raise


    

      
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
            # Get signal from cache or load it
            signal = self.file_service.get_or_load_file(filename, signal_idx)
                
            return image_viewer_functions.extract_image_data(signal)
            
        except Exception as e:
            print(f"Error extracting data from {filename}: {str(e)}")
            import traceback
            traceback.print_exc()
            print("=== Ending get_image_data() with error ===\n")
            return None


    async def spectrum_to_2d(
        self,
        filename: str,
        signal_idx: int,
        start: int,
        end: int
    ) -> List[List[float]]:
        """
        Get a 2D image representing the sum of intensities within a specific energy range.
        async allows other functions to run in the background while this one is running
        
        Args:
            filename (str): Name of the file containing the signal
            signal_idx (int): Index of the signal in the file
            start (int): Starting energy channel index
            end (int): Ending energy channel index
            
        Returns:
            List[List[float]]: 2D array representing the summed image over the energy range
        """
        print(f"=== Starting spectrum_to_2d() ===")
        print(f"Parameters: filename={filename}, signal_idx={signal_idx}, start={start}, end={end}")
        
        try:
            # Load the signal
            filepath = constants.full_filepath(filename)
            

            signal = self.file_service.get_or_load_file(filename, signal_idx)
            
            # Get the full 3D data
            signal_data = signal.data
            print(f"Full signal data shape: {signal_data.shape}")

            # Validate range indices
            if start < 0 or end >= signal_data.shape[2] or start > end:
                raise ValueError(f"Invalid range: start={start}, end={end}, spectrum_length={signal_data.shape[2]}")
            
            # Extract the energy range and sum along that axis
            range_data = signal_data[:, :, start:end + 1]
            summed_image = np.sum(range_data, axis=2)
            print(f"Summed image shape: {summed_image.shape}")
            
            print("=== Ending spectrum_to_2d() successfully ===\n")
            return summed_image.tolist()
            
        except Exception as e:
            print(f"Error in spectrum_to_2d: {str(e)}")
            print("=== Ending spectrum_to_2d() with error ===\n")
            raise e

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
            # Get signals from cache or load it
            signals = self.file_service.get_or_load_file(filename)
            
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
    #                             Data Methods                                  #
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
            # Get signal from cache or load it
            signal = self.file_service.get_or_load_file(filename, signal_idx)
            
            # Get the metadata
            if hasattr(signal, 'metadata'):
                metadata = data_functions._convert_metadata_to_serializable(signal.metadata)
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

    def get_axes_data(self, filename, signal_idx):
        """
        Gets axes data from a file.
        Args:
            filename (str): Name of the file to get axes data from
            signal_idx (int): Index of the signal to get axes data from
        Returns:
            dict: Dictionary containing axes data
        """
        print(f"\n=== Starting get_axes_data() in SignalService ===")
        try:
            # Get signal from cache or load it
            signal = self.file_service.get_or_load_file(filename, signal_idx)

            if signal_data.data.ndim != 3:
                print(f"Error getting axes data, incorrect number of dimensions: {signal_data.data.ndim}")
                return None
            
            # Get the axes data
            if hasattr(signal_data, 'axes_manager'):
                axes_data = data_functions.load_axes_manager(signal_data)
                print("\nAxes data extracted successfully")
                print("=== Ending get_axes_data() successfully ===\n")
                return axes_data
            else:
                print("No axes data found in signal")
                return {}
            
        except Exception as e:
            print(f"Error getting axes data: {str(e)}")
            import traceback
            traceback.print_exc()
            print("=== Ending get_axes_data() with error ===\n")
            return None
            