import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "sample_data")

CURRENT_FILE = {
    "filepath": None,
    "data": None
}

def full_filepath(filename):
    # Construct full filepath
    filepath = os.path.join(DATA_DIR, filename)
    
    print(f"Constructed filepath: {filepath}")
    print(f"File exists: {os.path.exists(filepath)}")

    return filepath
    



