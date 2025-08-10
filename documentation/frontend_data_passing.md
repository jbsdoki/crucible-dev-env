In the frontend data is passed between components in two ways
Either "Passed as props" (React term) in App.tsx where the different components call eachother. Looking through App.tsx you can see that data is both passed down between components and returned from components using this method.

The other method is as part of a context. The components are wrapped in the context in App.tsx and from there components have a shared context they pass data between and update. The contexts are in frontend/src/contexts

## Detailed Data Passing Mechanisms

### 1. Props-Based Data Flow (App.tsx)

The main application in `frontend/src/App.tsx` demonstrates a hierarchical data flow where:

- **State Management**: Main application state is managed at the top level
- **Data Propagation**: Data flows down through component props
- **Callback Functions**: Components pass data back up through callback functions
- **Bidirectional Communication**: Both parent-to-child and child-to-parent data flow

#### Example from `frontend/src/App.tsx`:
```typescript
// Data flows down to child components
<MainApplication
  selectedFile={selectedFile}
  setSelectedFile={setSelectedFile}
  selectedSignal={selectedSignal}
  setSelectedSignal={setSelectedSignal}
  regionSpectrumData={regionSpectrumData}
  selectedRegion={selectedRegion}
  handleRegionSelected={handleRegionSelected}
/>

// Data flows back up through callbacks
const handleRegionSelected = (
  region: {x1: number, y1: number, x2: number, y2: number},
  spectrumData: SpectrumData
) => {
  setSelectedRegion(region);
  setRegionSpectrumData(spectrumData);
};
```

### 2. Context-Based Data Flow

The application uses multiple React Contexts to manage shared state across components without prop drilling. Each context serves a specific domain and manages related data.

#### Authentication Context (`frontend/src/contexts/AuthContext.tsx`)
- **Purpose**: Manages user authentication state and ORCID OAuth flow
- **Data Shared**: User information, authentication status, loading states
- **Components Using**: LoginPage, ORCIDCallback, AuthGuard, and any component that needs auth info
- **State Persistence**: Uses localStorage to persist authentication across browser sessions

#### Emission Line Contexts

##### EmissionLineFromTableContext (`frontend/src/contexts/EmissionLineFromTableContext.tsx`)
- **Purpose**: Shares selected emission line data from PeriodicTable to other components
- **Data Structure**: 
  ```typescript
  {
    Element: string;
    AtomicNumber: number;
    EmissionLines: {
      ka1: number | null;
      ka2: number | null;
      kb1: number | null;
      la1: number | null;
      la2: number | null;
      lb1: number | null;
      lb2: number | null;
      lg1: number | null;
      ma1: number | null;
    }
  }
  ```
- **Data Flow**: PeriodicTable → Context → EmissionLineAnalysis, SpectrumViewer
- **Usage Pattern**: Components call `useEmissionLineContext()` to access shared data

##### EmissionRangeSelectionContext (`frontend/src/contexts/EmissionRangeSelectionContext.tsx`)
- **Purpose**: Manages emission range selections for both spectrum display and 2D mapping
- **Data Structure**: 
  ```typescript
  interface EmissionRange {
    lineName: string;      // Name of the emission line (e.g., "ka1")
    energy: number;        // Center energy of the line
    start: number;         // Start of range in keV
    end: number;          // End of range in keV
    color?: string;       // Optional color for display
  }
  ```
- **Dual Display State**: Separate arrays for spectrum and map visualization
- **Actions**: Add/remove ranges from spectrum or map, clear all selections

##### EmissionAnalysisToEmissionRangeImageContext (`frontend/src/contexts/EmissionAnalysisToEmissionRangeImageContext.tsx`)
- **Purpose**: Manages multiple emission line ranges (up to 10) for analysis and visualization
- **Data Structure**: 
  ```typescript
  interface EmissionRangeItem {
    id: number;                               // Simple ID: 1, 2, 3, ... 10
    indices: { start: number; end: number };  // Indices for API calls
    energy: { start: number; end: number };   // Energy values for display
    lineName: string;                         // e.g., "ka1", "ka2", "kb1"
    element: string;                          // e.g., "Fe", "Cu", "Au"
  }
  ```
- **Slot Management**: Automatically assigns IDs 1-10 to new ranges
- **File Context**: Also manages selected file and signal index for API calls

#### Spectrum Contexts

##### SpectrumViewerToSpectrumRangeVisualizerContext (`frontend/src/contexts/SpectrumViewerToSpectrumRangeVisualizer.tsx`)
- **Purpose**: Manages spectrum range selections for visualization and analysis
- **Data Structure**: Similar to emission range context but focused on spectrum data
- **Range Management**: Supports up to 10 ranges with automatic ID assignment
- **API Integration**: Manages file and signal context for backend communication

### 3. Context Usage Patterns

#### Provider Wrapping
Contexts are wrapped around components in the component hierarchy:
```typescript
// Example from `frontend/src/App.tsx`
<EmissionLineProvider>
  <EmissionRangeProvider>
    <EmissionRangeToImageProvider>
      <SpectrumProvider>
        {/* Components that need access to these contexts */}
      </SpectrumProvider>
    </EmissionRangeToImageProvider>
  </EmissionRangeProvider>
</EmissionLineProvider>
```

#### Hook Usage
Components consume context data using custom hooks:
```typescript
// Example usage in a component (e.g., `frontend/src/components/SpectrumViewer/SpectrumViewerRoot.tsx`)
const { selectedEmissionLine, setSelectedEmissionLine } = useEmissionLineContext();
const { ranges, addRange, removeRange } = useEmissionRangeToImageContext();
const { ranges: spectrumRanges, addRange: addSpectrumRange } = useSpectrumContext();
```

### 4. Data Update Patterns

#### State Updates
- **Direct State Updates**: Components call context setter functions directly
- **Batch Updates**: Multiple state changes can be batched for performance
- **Derived State**: Some contexts compute derived values from base state

#### API Integration
- **Data Fetching**: Contexts often trigger API calls when state changes
- **Loading States**: Contexts manage loading states during data operations
- **Error Handling**: Contexts provide error states for failed operations

### 5. Performance Considerations

#### Context Optimization
- **Selective Updates**: Only components that consume specific context values re-render
- **Memoization**: Context values are memoized to prevent unnecessary re-renders
- **State Splitting**: Related state is split into separate contexts to minimize re-renders

#### Data Flow Efficiency
- **Unidirectional Flow**: Data flows in one direction to prevent circular updates
- **Local State**: Components use local state for UI-specific data
- **Context Boundaries**: Contexts are scoped to specific feature areas

### 6. Best Practices Implemented

#### Context Design
- **Single Responsibility**: Each context manages one domain of application state
- **Clear Interfaces**: Well-defined interfaces for context values and actions
- **Error Boundaries**: Contexts include error handling for missing providers

#### Component Integration
- **Custom Hooks**: Consistent pattern of custom hooks for context consumption
- **Type Safety**: Full TypeScript support with proper type definitions
- **Documentation**: Each context includes comprehensive documentation and usage examples

### 7. Common Data Flow Patterns

#### 1. Selection → Analysis → Visualization
```
PeriodicTable (`frontend/src/components/PeriodicTable/PeriodicTable.tsx`) → EmissionLineContext → EmissionLineAnalysis (`frontend/src/components/EmissionLineAnalysis.tsx`) → EmissionRangeContext → Visualization
```

#### 2. File → Signal → Spectrum → Range
```
FileSelector (`frontend/src/components/FileSelector.tsx`) → SignalSelector (`frontend/src/components/SignalSelector.tsx`) → SpectrumViewer (`frontend/src/components/SpectrumViewer/SpectrumViewerRoot.tsx`) → SpectrumContext → RangeVisualizer (`frontend/src/components/SpectrumRangeVisualizer/SpectrumRangeVisualizer.tsx`)
```

#### 3. Authentication → Protected Routes
```
LoginPage (`frontend/src/components/Authentication/LoginPage.tsx`) → AuthContext (`frontend/src/contexts/AuthContext.tsx`) → AuthGuard (`frontend/src/components/Authentication/AuthGuard.tsx`) → Protected Components
```

### 8. Debugging and Development

#### Context Inspection
- **React DevTools**: Use React DevTools to inspect context values
- **Console Logging**: Contexts include console logging for development
- **State Tracking**: Track state changes through context provider updates

#### Common Issues
- **Missing Providers**: Components outside context providers will throw errors
- **Stale Closures**: Ensure callback functions are properly memoized
- **Performance**: Monitor re-renders to identify unnecessary context updates