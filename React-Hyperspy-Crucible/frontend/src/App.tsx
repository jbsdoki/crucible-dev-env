/**
 * Main Application Component
 * 
 * This is the root component of the React application, rendered in main.tsx.
 * It serves as the entry point for the application's component tree.
 * 
 * Component Structure:
 * - App (You are here)
 *   └─ SpectrumViewer (./components/SpectrumViewer.tsx)
 *        - Handles all spectrum visualization
 *        - Makes API calls to the FastAPI backend
 *        - Manages file selection and data display
 * 
 * Styling:
 * - Uses App.css for basic layout and styling
 * - The SpectrumViewer component handles its own styling using Material-UI
 */

import SpectrumViewer from './components/SpectrumViewer'
import './App.css'

/**
 * App Component
 * 
 * Currently a simple wrapper that renders the SpectrumViewer component.
 * As the application grows, this component can be expanded to include:
 * - Navigation
 * - Additional visualization components
 * - Global state management
 * - Routing between different views
 */
function App() {
  return (
    <div className="App">
      <SpectrumViewer />
    </div>
  )
}

export default App
