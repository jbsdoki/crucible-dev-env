# Periodic Table Component Documentation

## Overview
This component uses the Periodic_Table_w_Emission_Spectra.json file under /data to display the periodic table. 

The .json file has all the x-ray emission spectrum values in KeV, but they are not being used in this periodic table to generate the spectra. 
The .json file is only used for storing the Element name, symbol, and atomic number.

This component reaches to the backend api in ElementDetails.tsx to retrieve the spectra values using xraylib python library. 

It presents these emission lines to the user for selection, then sends the selected lines to the EmissionLineContext stored in EmissionLineContext.tsx

The SpectrumViewer takes the emission lines from the context and displays them.

## Component Structure

### Main Components
1. **PeriodicTable.tsx**
   - Main container component that renders the periodic table grid
   - Handles element selection and display mode (modal/box)
   - Manages the selected element state
   - Props:
     - `onElementClick`: Optional callback for element selection
     - `displayMode`: 'modal' or 'box' (default: 'modal')

2. **ElementDetails.tsx**
   - Displays detailed information about the selected element
   - Fetches and displays emission spectra data
   - Manages emission line selection
   - Props:
     - `element`: Selected element data
     - `onClose`: Modal close handler
     - `isModal`: Display mode boolean

### Utility Files
- **periodicTableUtils.ts**
  - Contains element category definitions
  - Defines color mapping for different element categories
  - Provides grid positioning for each element
  - Helper functions for element categorization

### Styling
- **PeriodicTable.css**
  - Grid layout for periodic table display
  - Element cell styling and hover effects
  - Responsive design considerations

- **ElementDetails.css**
  - Modal and box display modes
  - Element details layout
  - Emission spectra data presentation
  - Interactive checkbox styling

## Features

### 1. Interactive Element Selection
- Elements are clickable and show a hover effect
- Selected element is highlighted with a blue border
- Elements are color-coded by their category (e.g., noble gases, metals, etc.)

### 2. Element Details Display
- Two display modes:
  - Modal: Overlays the periodic table
  - Box: Displays alongside the table
- Shows:
  - Element symbol
  - Atomic number
  - Element name
  - Element category

### 3. Emission Spectra Integration
- Fetches emission spectra data from backend API
- Displays available emission lines with energies in keV
- Allows selection of multiple emission lines
- Handles unavailable data gracefully with disabled checkboxes
- Updates EmissionLineContext with selected lines

### 4. Context Integration
The component integrates with EmissionLineContext to share selected emission line data across the application. Selected data includes:
- Element information (symbol, atomic number)
- Selected emission lines with their energy values
- Null values for unavailable lines

## Usage Example
```tsx
// Basic usage
<PeriodicTable />

// With custom click handler and box display mode
<PeriodicTable 
  onElementClick={(element) => handleElementClick(element)}
  displayMode="box"
/>
```

## Error Handling
- Gracefully handles API failures when fetching emission spectra
- Displays user-friendly error messages
- Maintains UI stability during loading states
- Prevents interaction with unavailable emission lines

## Performance Considerations
- Uses CSS Grid for efficient layout
- Implements selective rendering for element details
- Manages state updates efficiently to prevent unnecessary rerenders
- Caches emission spectra data for selected elements