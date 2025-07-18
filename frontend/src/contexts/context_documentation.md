# Context Documentation

## EmissionLineContext

### Purpose
EmissionLineContext shares emission line spectra data from the Periodic Table component to other components in the application. It manages the selection and sharing of X-ray emission lines including Kα1, Kα2, Kβ1, Lα1, Lα2, Lβ1, Lβ2, Lγ1, Mα1 in KeV.

### Data Flow
```
PeriodicTable -> EmissionLineContext -> SpectrumViewer
```

### Structure
The context maintains:
- Selected element information (symbol, atomic number)
- Selected emission lines with their energy values (float)
- Null values for unavailable lines 

### Usage
1. **PeriodicTable Component**
   - Allows users to select elements
   - Fetches emission spectra from backend
   - Updates context with selected lines

2. **SpectrumViewer Component**
   - Consumes emission line data
   - Displays selected lines on the spectrum plot
   - Uses data for visualization and analysis

## SpectrumRangeContext

### Purpose
SpectrumRangeContext manages the sharing of X-ray energy ranges between components. It handles both energy values (in KeV) and channel values (0-4095), facilitating communication between spectrum visualization and image generation components.

### Data Flow
```
SpectrumViewer -> SpectrumRangeContext -> SpectrumToImage
```

### Structure
The context maintains:
1. Selected Range Data:
   - Indices: {start, end} for channel values
   - Energy: {start, end} in KeV
2. File Information:
   - Selected file path
   - Signal index

### Component Interactions

#### SpectrumViewer Component
- **Sends:**
  - Selected energy range
  - File information
  - Signal index
- **Actions:**
  - User selects range on spectrum plot
  - Updates context with selection data
  - Provides visual feedback of selection

#### SpectrumToImage Component
- **Receives:**
  - Energy range from context
  - File and signal information
- **Actions:**
  - Creates 2D spatial map of X-ray distribution
  - Shows intensity distribution within selected range
  - Updates visualization based on context changes

### Error Handling
- Components handle missing or invalid context data gracefully
- Provides appropriate user feedback for data loading states
- Maintains UI stability during context updates

### Performance Considerations
- Context updates trigger only necessary component rerenders
- Data transformations happen at the source before context updates
- Efficient handling of large datasets and frequent updates

## Best Practices for Context Usage

1. **Data Flow Direction**
   - Maintain unidirectional data flow
   - Keep clear separation of concerns between contexts
   - Avoid circular dependencies

2. **State Management**
   - Update context only when necessary
   - Use appropriate data structures for efficient updates
   - Handle null/undefined states appropriately

3. **Component Integration**
   - Use contexts within appropriate component boundaries
   - Implement error boundaries for context consumers
   - Follow React's context usage guidelines

4. **Documentation**
   - Keep context documentation up to date
   - Document data flow patterns
   - Include usage examples for new implementations