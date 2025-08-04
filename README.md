# React-Hyperspy-Crucible

## Required Software

1. Node.js (includes npm) — used to install and run the React frontend
    - Download and install from: https://nodejs.org/en
    - The installer includes npm automatically
    - After installation, verify by opening a terminal and running:
      ```bash
      node --version
      npm --version
      ```
      

2. Python Environment (micromamba)
    - Used for the FastAPI backend and Hyperspy
    - Install micromamba from: https://mamba.readthedocs.io/en/latest/installation.html

## Development Environment
This frontend application uses:
- React 18 with TypeScript
- Vite: Build tool and dev server that serves source files over native ES modules
- Material-UI (MUI): React component library

Key development commands:
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The Vite configuration is in `vite.config.ts`, which handles:
- TypeScript compilation
- Module resolution
- Build optimization
- Development server settings

## Environment
This application frontend was develope using Vite + React environment



# Setup Steps

## FOR NOW FILES PLACED IN DIRECTORY, TO BE REMOVED LATER/REPLACED WITH SQL SERVER CALLS
## Place files in local folder:
Place .edm or other files in directory:
```bash
React-Hyperspy-Crucible/backend/sample_data/
```

## Start the Backend FastAPI server
```bash
micromamba activate <your environment>
cd React-Hyperspy-Crucible/backend
uvicorn main:app --reload
```

## Start the Frontend Server (in a new terminal):
```bash
micromamba activate <your environment>
cd React-Hyperspy-Crucible/frontend
npm install  # This should install all required dependencies from package.json in the same directory if it fails for whatever reason run this:
npm install axios react-plotly.js plotly.js
npm run dev
```


The application will be available at: 
- Frontend: http://localhost:5173 (Vite + React default) (DEVELOPMENT ONLY)
- Backend: http://localhost:8000  (FastAPI default)

### Frontend Components
The React frontend (running on http://localhost:5173) consists of these components:

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
```bash
python
import hyperspy.api as hs
print(hs.print_known_file_formats())
```

## Development Mode Only Settings, Change for Production

This code is currently in development, which means React is in <StrictMode> (frontend/src/main.tsx), causing every function to run twice. (This has been temporarily removed)
This is development only, deactivate StrictMode in main.tsx while if in production.

In backend/main.py any source or credential is allowed to connect. This is a development only setting, remove for production. 

## Application Workflow in Development Environment

```
This diagram shows the high-level flow of function calls in the application, from the frontend React components through the API layer to the backend Python services and operations.
This diagram is only accurate for the development environment.
During development the Vite environment acts as the frontend web server. 
Frontend:

main.tsx (Starts app)
   |
   -> App.tsx (Root component that manages application state and layout, shares data between
            |   Components, only if components don't have shared context)
            |
            -> MainLayout (WebPageLayouts/MainLayout.tsx)
            |    Handles responsive grid-based layout of the application
            |    Organizes components into structured dashboard sections:
            |
            -> Contexts (Provide data sharing between components)
            |    - EmissionLineContext
            |    |     PeriodicTable → Context → SpectrumViewer and EmissionLineAnalysis
            |    |     Manages element selection and emission lines
            |    |
            |    - SpectrumRangeContext
            |    |     SpectrumViewer → Context → SpectrumToImage
            |    |     Manages X-ray energy ranges and channels
            |    |
            |    - EmissionRangeContext
            |          EmissionLineAnalysis → Context → SpectrumViewer
            |          Manages spectrum and map display states
            |              
            -> Components (What's displayed on the webpage, make calls to backend through api.ts)
                    - FileSelector (File selection)
                    - SignalSelector (Signal selection from files)
                    - HAADFViewer (HAADF image display)
                    - MetadataViewer (File and signal metadata)
                    - SpectrumViewerRoot (Spectrum visualization)
                    - ImageViewer (Image display and region selection)
                          |
                          v
                     api.ts (Handles backend API calls)
                          ^
                          |
Backend:                  |   
                          v
                     main.py (FastAPI Server, returns all data requests, hosts webpage when deployed
                          |    to container)
                          |
                          v
               Service Handlers (Organize and process requests)
                  - data_service.py
                  - file_service.py
                  - signal_service.py
                          |
                          v     
               Operations (Core data processing functions)
                  - data_functions.py
                  - file_functions.py
                  - image_viewer_functions.py
                  - periodic_table_functions.py
                  - signal_functions.py
                  - spectrum_functions.py
```

## Application Workflow in Production Environment

```
This diagram shows the high-level flow of function calls in the application once it has been deployed. Search Dockerfile in this directory to view the commands that are run when the
app is being deployed
During production the backend FastAPI server in main.py acts 
as the web server. Only necessary files from the frontend are kept and placed in backend/static/
Frontend:

                  User Requests (Main Webpage)
Backend:                  |   
                          v
                     main.py (FastAPI Server, returns all data requests, hosts webpage when deployed
                          |    to container)
                          |
                          |
                          |-> /static/ (Directory where the webpage files are stored stored)
                          |
                          v
               Service Handlers (Organize and process requests)
                  - data_service.py
                  - file_service.py
                  - signal_service.py
                          |
                          v     
               Operations (Core data processing functions)
                  - data_functions.py
                  - file_functions.py
                  - image_viewer_functions.py
                  - periodic_table_functions.py
                  - signal_functions.py
                  - spectrum_functions.py
                  (Not all components shown)
```