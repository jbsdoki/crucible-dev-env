from .file_service import FileService
from .signal_service import SignalService

# Create instances of our services
file_service = FileService()
signal_service = SignalService()

# Export the service instances
__all__ = ['file_service', 'signal_service'] 