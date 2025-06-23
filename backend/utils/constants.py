import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# DATA_DIR = os.path.join(BASE_DIR, "backend", "sample_data")
DATA_DIR = os.path.join(BASE_DIR, "sample_data")

CURRENT_FILE = {
    "filepath": None,
    "data": None
}

# Remove unused cache
# CURRENT_SIGNAL = {
#     "idx": None,
#     "name": None
# }