# Development vs Production Environments

This document outlines the key differences between the development and production environments for the Crucible Data Explorer application.

## Development Environment

### Frontend (React + Vite)
- **Server**: Hosted by the Vite development server (`npm run dev`)
- **Port**: Default Vite development port (typically 5173)
- **Features**:
  - Hot Module Replacement (HMR) for instant updates during development
  - Source maps for debugging
  - TypeScript compilation with immediate error feedback
  - Fast builds optimized for development speed
  - Live reloading when files change

### Backend (FastAPI)
- **Server**: FastAPI with uvicorn development server
- **Port**: Typically 8000 (configurable)
- **CORS Configuration**: 
  - Permissive CORS settings for development (allows all origins)
  - Located in `backend/main.py` lines 61-69
  - **WARNING**: Contains security notice that production needs stricter CORS
- **Data**: Serves sample data from `backend/sample_data/` directory
- **Static Files**: Not serving frontend files (handled by Vite)

### Development Workflow
1. Start backend: `uvicorn backend.main:app --reload`
2. Start frontend: `npm run dev` (from frontend directory)
3. Frontend makes API calls to backend server
4. Real-time development with instant feedback

## Production Environment

### Build Process
The production build follows a multi-stage Docker approach defined in the `Dockerfile`:

#### Stage 1: Frontend Build
```dockerfile
# Uses Node.js 18 Alpine image
FROM node:18-alpine AS frontend-builder
```
- **Process**: 
  1. Copies frontend source code to container
  2. Runs `npm install` to install dependencies
  3. Executes `npm run build` which:
     - Compiles TypeScript (`tsc -b`)
     - Creates optimized production build (`vite build`)
     - Generates minified JavaScript, CSS, and assets
     - Creates a `dist/` folder with all optimized files

#### Stage 2: Backend + Static Hosting
```dockerfile
# Uses Python 3.10 slim image  
FROM python:3.10-slim AS backend
```
- **Process**:
  1. Installs Python dependencies from `requirements.txt`
  2. Copies backend source code
  3. Copies built frontend from Stage 1 to `static/` directory
  4. Exposes port 8080 (Google Cloud Run standard)

### Production Server Configuration
- **Single Server**: FastAPI serves both API endpoints and static frontend files
- **Static File Mounting**: 
  - Frontend assets mounted at `/assets` route (line 74 in `main.py`)
  - Catch-all route serves React app for client-side routing (lines 446-462)
- **Port**: 8080 (Cloud deployment standard)
- **Host**: 0.0.0.0 (allows external connections in containers)

### Deployment Process
The `cloudbuild.yaml` defines the Google Cloud Build process:
1. **Image Caching**: Attempts to pull existing image for faster builds
2. **Docker Build**: Creates production image using Dockerfile
3. **Registry Push**: Pushes built image to Google Artifact Registry
4. **Timeout**: 700 seconds for large builds

## Key Differences Summary

| Aspect | Development | Production |
|--------|-------------|------------|
| **Frontend Server** | Vite dev server (port 5173) | FastAPI static file serving (port 8080) |
| **Backend Server** | uvicorn with reload | uvicorn production mode |
| **Build Optimization** | Fast, unoptimized | Fully optimized and minified |
| **File Serving** | Separate servers | Single FastAPI server |
| **CORS Policy** | Permissive (all origins) | Requires security hardening |
| **Hot Reload** | Enabled | Disabled |
| **Source Maps** | Available | Not included |
| **Container** | Not containerized | Multi-stage Docker build |
| **Deployment** | Local development | Google Cloud with Artifact Registry |

