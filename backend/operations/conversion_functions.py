import numpy as np


class SpectrumConverter:
    """
    Handles conversions between original array indices (0-4095) and true energy values.
    Stores axes information for quick conversions without needing to pass parameters.
    
    Args:
        axes_data (dict): Dictionary containing:
            - offset: The offset value for energy calculations
            - scale: The scale value for energy calculations
            - units: The units of measurement
    """
    def __init__(self, axes_data):
        self.offset = axes_data['offset']
        self.scale = axes_data['scale']
        self.units = axes_data['units']
        self.zero_index = self.calculate_zero_index()
        
    def to_true_index(self, original_index):
        """Convert from original array index (0-4095) to true energy value."""
        return self.offset + (self.scale * original_index)
        
    def to_original_index(self, true_index):
        """Convert from true energy value back to original array index."""
        return (true_index - self.offset) / self.scale
        
    def calculate_zero_index(self):
        """Calculate the index where real values start (where energy = 0)."""
        return (-self.offset / self.scale)
        
    def calculate_fwhm(self, spectrum_data, zero_index):
        """
        Calculate the Full Width at Half Maximum (FWHM) index after the zero peak.
        This expects the spectrum data to be in the original index space (0-4095)
        
        Args:
            spectrum_data (array): Array of intensity values in original index space
            
        Returns:
            int: Index where intensity first drops to half the maximum after zero peak
        """
        # Get height at zero peak
        height = spectrum_data[self.zero_index]
        half_max_intensity = height / 2
        
        # Search for first point after zero_index where intensity drops to ~half max
        half_max_index = self.zero_index
        tolerance = height * 0.05  # 5% tolerance for finding half max
        
        for i in range(self.zero_index + 1, len(spectrum_data)):
            if abs(spectrum_data[i] - half_max_intensity) <= tolerance:
                half_max_index = i
                break
            elif spectrum_data[i] < half_max_intensity:
                # If we've gone below half max, use the closer of this point or previous point
                if i > self.zero_index + 1:
                    prev_diff = abs(spectrum_data[i-1] - half_max_intensity)
                    curr_diff = abs(spectrum_data[i] - half_max_intensity)
                    half_max_index = i if curr_diff < prev_diff else i-1
                else:
                    half_max_index = i
                break
                
        return half_max_index

    def convert_array_to_true(self, original_array):
        """Convert an array of original indices to true energy values."""
        return [self.to_true_index(i) for i in range(len(original_array))]

    def convert_array_to_original(self, true_array):
        """Convert an array of true energy values back to original indices."""
        return [self.to_original_index(val) for val in true_array]

    def get_metadata(self):
        """Return metadata about the conversion parameters."""
        return {
            'offset': self.offset,
            'scale': self.scale,
            'units': self.units,
            'zero_index': self.zero_index
        }

