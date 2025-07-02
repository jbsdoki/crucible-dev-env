from operations import file_functions
from utils.constants import DATA_DIR
import os

class FileService:
    """
    Service class for handling file operations.
    Manages file loading, listing, and metadata extraction.
    """
    
    def __init__(self):
        self._supported_extensions = ('.emd', '.tif', '.dm3', '.dm4', '.ser', '.emi')
        self._current_file = {
            "filepath": None,
            "data": None
        }

    def list_files(self) -> list:
        """
        List all supported microscopy files in the data directory.
        
        Returns:
            list: List of filenames with supported extensions
        """
        try:
            print(f"\n=== Starting list_files in FileService ===")
            files = file_functions.list_files()
            print("=== Ending list_files in FileService ===\n")
            return files
        except Exception as e:
            print(f"Error listing files: {str(e)}")
            raise e


    def validate_file(self, filename: str) -> bool:
        """
        Check if a file exists and is a supported type.
        
        Args:
            filename (str): Name of the file to validate
            
        Returns:
            bool: True if file exists and is supported, False otherwise
        """
        try:
            if not filename.lower().endswith(self._supported_extensions):
                return False
                
            filepath = os.path.join(DATA_DIR, filename)
            return os.path.exists(filepath)
        except Exception as e:
            print(f"Error validating file: {str(e)}")
            return False

    def _clear_cache(self):
        """Clear the current file cache"""
        self._current_file = {
            "filepath": None,
            "data": None
        }

    def _update_cache(self, filepath: str, file_data):
        """Update the file cache with new data"""
        self._current_file = {
            "filepath": filepath,
            "data": file_data
        }








