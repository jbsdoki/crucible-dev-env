/**
 * Application Entry Point
 * 
 * This is the main entry point for the React application.
 * It sets up the React root and renders the App component.
 * 
 * Application Flow:
 * 1. main.tsx (You are here)
 *    └─ Renders new_App.tsx (Testing new layout)
 *        └─ Renders SpectrumViewer.tsx
 *            └─ Makes API calls to FastAPI backend (localhost:8000)
 * 
 * Key Components:
 * - createRoot: React 18's new root API for concurrent features
 * 
 * Note: StrictMode is temporarily disabled for debugging purposes.
 * Remember to re-enable it later as it helps catch potential issues.
 */

// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import App from './new_App.tsx'

// Create and render the React root
// The '!' tells TypeScript that we're certain the element exists
createRoot(document.getElementById('root')!).render(
    <App />
)
