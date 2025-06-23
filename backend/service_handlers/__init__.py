from .file_service import FileService
from .signal_service import SignalService

print("\n=== Initializing Services ===")

# Create instances of our services
file_service = FileService()
signal_service = SignalService()

print("FileService initialized")
print("SignalService initialized")
print("=== Services Initialization Complete ===\n")

# Export the service instances
__all__ = ['file_service', 'signal_service'] 