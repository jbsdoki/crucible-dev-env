# SpectrumViewer Documentation

This component is imported by App.tsx

It takes a filename and a signal, reaches to the backend, and accepts the returned data and plots it using plotly.

It accepts data passed by prop in App.tsx
ImageViewer allows user to select a 2d range of the image (x,y coordinates), this range is passed to SpectrumViewer, SpectrumViewer reaches to 
Backend, then displays the x-rays (3d dimension) that falls withing the 2d range of the image. 

It allows the user to select a range (x ray dimension) of the displayed section and then sends that data to the SpectrumToImage component. 

## Component Architecture

The SpectrumViewer is composed of two main components:

1. **SpectrumViewerRoot**: The main exported component that provides the SpectrumContext and serves as the entry point.
2. **SpectrumViewerInner**: The core implementation component that handles data fetching, user interactions, and rendering.

## Props and Data Flow

The component accepts the following props:
- `selectedFile`: The filename to fetch spectrum data for
- `selectedSignal`: Information about the selected signal including index, title, and capabilities
- `regionSpectrumData`: Optional data for comparing/overlaying spectra
- `selectedRegion`: Optional coordinates for highlighting specific areas

## Key Features

1. **Spectrum Data Visualization**
   - Displays spectrum data using Plotly
   - Supports both main spectrum and region spectrum overlay
   - Provides interactive zoom and pan capabilities

2. **Range Selection**
   - Allows users to select specific ranges within the spectrum
   - Updates shared context with selected range information
   - Coordinates with SpectrumToImage component for visualization

3. **Toolbar Controls**
   - Toggle range selection mode
   - Control visualization options
   - Manage region spectrum visibility


4. **Range Image Visualization (REMOVED)**
   - Displays visual representation of selected spectrum ranges
   - Updates in real-time as selections change
   THIS FUNCTIONALITY HAS BEEN REMOVED AND SHIFTED TO A NEW COMPONENT:
   SpectrumToImage

## Sub-Components

1. **SpectrumPlot**
   - Handles the main spectrum visualization
   - Manages user interactions for range selection
   - Supports overlay of region spectrum data

2. **SpectrumToolbar**
   - Provides user controls for spectrum visualization
   - Manages selection mode and other UI states

3. **SpectrumRangeImage**
   - Visualizes selected ranges
   - Updates based on user selections

## Context Integration

The component integrates with two main contexts:
1. **SpectrumViewerContext**: Manages component-specific state
   - This context is only used by SpectrumViewer, it is not meant 
     to be used by any other component
   - Controls Toolbar settings. 
   - FWHM index state
   - Region spectrum visibility
   - UI state (log scale, zoom mode)

2. **SpectrumRangeContext**: Manages shared spectrum range state
   - This context is stored in src/contexts and can be used for all
     components, but I advise you don't change that unless necessary
     data flows:
        SpectrumViewer -> App.tsx -> SpectromToRange
   - Selected range indices and energy values
   - Selected file and signal information

## Error Handling and Loading States

The component provides appropriate feedback for:
- Loading states with progress indicator
- Error states with error messages
- Empty data states with informative messages

## Data Types

Key data structures used:
- `SpectrumData`: Contains x/y values and metadata for spectrum visualization
- `SignalInfo`: Describes signal metadata and capabilities
- `AxisRange`: Defines visible ranges for plot axes
- `Range`: Describes selected spectrum ranges with metadata 