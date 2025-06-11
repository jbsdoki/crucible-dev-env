# React-Hyperspy-Crucible

## Environment Details

- Python Environment: micromamba
- Python Version: 3.10
- Key Packages: 
   - fastapi==0.109.2
   - uvicorn==0.27.1
   - hyperspy==1.7.5
   - python-multipart==0.0.9
   - numpy==1.23.5
   - scikit-image==0.19.3
   - scipy==1.10.1
   - matplotlib==3.5.1

   
(Specific build type should not matter)

## Development Workflow

1. Always activate the micromamba environment before working on the backend:
```bash
micromamba activate hyperspy-env
```

2. The frontend and backend run on different ports:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000


## Backend Setup (Python)

1. Activate the micromamba environment in bash:
```micromamba activate <Your environment name>
```

2. Start the FastAPI server:
```bash
cd backend
uvicorn main:app --reload
```

## Frontend Setup (Node.js) v22.16.0

1. Install dependencies in bash:
```npm create vite@latest frontend --template react
cd frontend
npm install
npm install axios react-plotly.js plotly.js
```

2. Start the development server:
```bash
npm run dev
```



## Required Software

Node.js (npm + npx) — used to install and run the React frontend
    https://nodejs.org/en

Axios — makes HTTP requests from the React frontend to the FastAPI backend

    ---

## Architecture

Frontend: React (Javascript)
    - Interactive UI for selecting and visualizing microscopy data
    - Code lives in: `frontend/src/`

Backend: FastAPI + Hyperspy
    - Serves `.emd` files from disk (temporary: replace with SQL later)
    - Code lives in: `backend/main.py` and `backend/file_service.py`
    - Uses Hyperspy to extract metadata and spectral data## Frontend-Backend Interaction Details

### Frontend Components
The React frontend (running on http://localhost:5173) consists of several key components:

1. `frontend/src/services/api.ts`
   - Central file that makes HTTP requests to the backend
   - Communicates with three main endpoints:
     - File listing endpoint
     - Metadata endpoint
     - Spectrum data endpoint

2. `frontend/src/components/SpectrumViewer.tsx`
   - Main visualization component
   - Uses the API service to:
     - Load available files
     - Display spectrum data using Recharts
     - Handle user interactions

### Backend Structure
The FastAPI backend (running on http://localhost:8000) is organized into two main files:

1. `backend/main.py`
   - Acts as the entry point for all frontend requests
   - Receives HTTP requests from the frontend and directs them to the right place
   - Allows the frontend (running on port 5173) to talk to the backend (running on port 8000)
   - Routes requests to appropriate backend functions

2. `backend/file_service.py`
   - Contains the functionality for processing .emd files
   - Uses Hyperspy to handle file operations
   - Processes data before sending it back to the frontend
   
## Data Flow (Frontend ↔ Backend)

General calling flow
    1. React frontend uses functions in `frontend/src/services/api.ts` to make API calls.
    2. These send HTTP requests to FastAPI server on port 8000
    3. FastAPI routes the request to matching functions defined in `main.py`.
    4. These call Hyperspy logic in `file_service.py`.
    5. A response (e.g. file list or spectrum array) is returned to the frontend.
    6. React receives and renders the result.

Example Request: File Listing

    When the frontend calls `getFiles()`:
    1. It sends a `GET` request to: `http://localhost:8000/files`
    2. FastAPI handles it via the `/files` route in `main.py`
    3. The `list_files()` function from `file_service.py` is invoked
    4. The backend returns a list of `.emd` filenames
    5. React renders the filenames to the user

## Troubleshooting

If you get "command not found" errors:
1. Make sure you're in the correct environment: `micromamba activate hyperspy-env`
2. Verify the environment has the required packages: `micromamba list`

If you get 
"Trying to load with signal_type: EDS_TEM
WARNING | Hyperspy | `signal_type='EDS_TEM'` not understood. See `hs.print_known_signal_types()` for a list of installed signal types or https://github.com/hyperspy/hyperspy-extensions-list for the list of all hyperspy extensions providing signals. (hyperspy.io:745)" errors, or something similair, hyperspy does not have the installed ability to view that file type.
Disply hyperspy filetypes command:
    python
    import hyperspy.api as hs
    print(hs.print_known_file_formats())