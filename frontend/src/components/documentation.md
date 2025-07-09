# Components Documentation

This document explains how each component in the `frontend/src/components` directory is used and called.

## Component Overview

The components in this directory form the core UI elements of the React Explorers application, focusing on data visualization and user interaction.

## Component Usage Guide

### 1. FileSelector Component
**File**: `FileSelector.tsx`
**Purpose**: Handles file selection and upload functionality.

**Usage Example**:
```tsx
import { FileSelector } from './components/FileSelector';

function MyComponent() {
  return (
    <FileSelector 
      onFileSelect={(file) => handleFile(file)}
      acceptedTypes=".dm3,.dm4"
    />
  );
}
```

**Key Features**:
- File type validation
- Drag and drop support
- File selection feedback

### 2. ImageViewer Component
**File**: `ImageViewer.tsx`
**Purpose**: Displays and manipulates image data.

**Usage Example**:
```tsx
import { ImageViewer } from './components/ImageViewer';

function MyComponent() {
  return (
    <ImageViewer 
      imageData={data}
      width={800}
      height={600}
      onZoom={(level) => handleZoom(level)}
    />
  );
}
```

**Key Features**:
- Zoom functionality
- Pan controls
- Image manipulation tools

### 3. SpectrumViewer Component
**File**: `SpectrumViewer.tsx`
**Purpose**: Visualizes spectral data with interactive features.

**Usage Example**:
```tsx
import { SpectrumViewer } from './components/SpectrumViewer';

function MyComponent() {
  return (
    <SpectrumViewer 
      spectrumData={data}
      onRegionSelect={(region) => handleRegionSelect(region)}
      showControls={true}
    />
  );
}
```

**Key Features**:
- Interactive plot
- Region selection
- Data analysis tools
- Customizable display options

### 4. HAADFViewer Component
**File**: `HAADFViewer.tsx`
**Purpose**: High-Angle Annular Dark-Field imaging viewer.

**Usage Example**:
```tsx
import { HAADFViewer } from './components/HAADFViewer';

function MyComponent() {
  return (
    <HAADFViewer 
      data={haadData}
      contrast={1.5}
      brightness={1.0}
    />
  );
}
```

**Key Features**:
- Contrast adjustment
- Brightness control
- Image analysis tools

### 5. SignalSelector Component
**File**: `SignalSelector.tsx`
**Purpose**: Allows selection and management of different signals.

**Usage Example**:
```tsx
import { SignalSelector } from './components/SignalSelector';

function MyComponent() {
  return (
    <SignalSelector 
      signals={availableSignals}
      onSignalSelect={(signal) => handleSignalSelect(signal)}
      activeSignal={currentSignal}
    />
  );
}
```

**Key Features**:
- Signal list display
- Selection handling
- Active signal highlighting

### 6. MetadataViewer Component
**File**: `MetadataViewer.tsx`
**Purpose**: Displays metadata information for selected files or signals.

**Usage Example**:
```tsx
import { MetadataViewer } from './components/MetadataViewer';

function MyComponent() {
  return (
    <MetadataViewer 
      metadata={fileMetadata}
      showRawData={false}
    />
  );
}
```

**Key Features**:
- Formatted metadata display
- Collapsible sections
- Search/filter capabilities

### 7. PeriodicTable Component
**File**: `PeriodicTable.tsx`
**Purpose**: Interactive periodic table for element selection.

**Usage Example**:
```tsx
import { PeriodicTable } from './components/PeriodicTable';

function MyComponent() {
  return (
    <PeriodicTable 
      onElementSelect={(element) => handleElementSelect(element)}
      highlightedElements={selectedElements}
    />
  );
}
```

**Key Features**:
- Element selection
- Visual highlighting
- Element information display

### 8. ContextTest Component
**File**: `ContextTest.tsx`
**Purpose**: Testing component for context functionality.

**Usage Example**:
```tsx
import { ContextTest } from './components/ContextTest';

function MyComponent() {
  return (
    <ContextTest 
      testValue="example"
      onTest={(result) => handleTest(result)}
    />
  );
}
```

**Key Features**:
- Context testing utilities
- Debug information
- Test case scenarios

### 9. TestConnection Component
**File**: `TestConnection.tsx`
**Purpose**: Tests and verifies backend connectivity.

**Usage Example**:
```tsx
import { TestConnection } from './components/TestConnection';

function MyComponent() {
  return (
    <TestConnection 
      endpoint="/api/test"
      onConnectionStatus={(status) => handleStatus(status)}
    />
  );
}
```

**Key Features**:
- Connection status display
- Error handling
- Retry functionality

## Component Dependencies

Many components rely on shared contexts and services:

```tsx
// Common context dependencies
import { FileContext } from '../contexts/FileContext';
import { ElementContext } from '../contexts/ElementContext';
import { SpectrumContext } from '../contexts/SpectrumContext';

// Common service dependencies
import { api } from '../services/api';
```

## Best Practices for Component Usage

1. **Context Integration**
   - Always wrap context-dependent components with their required providers
   - Use the useContext hook to access shared state

2. **Error Handling**
   - Implement error boundaries around complex components
   - Provide fallback UI for error states

3. **Performance Optimization**
   - Use React.memo for components that receive stable props
   - Implement useMemo for expensive calculations
   - Use useCallback for function props

4. **Accessibility**
   - Include ARIA labels and roles
   - Ensure keyboard navigation support
   - Maintain proper heading hierarchy

## Example Component Integration

Here's an example of how multiple components work together:

```tsx
function AnalysisView() {
  return (
    <div className="analysis-view">
      <FileSelector onFileSelect={handleFileSelect} />
      
      <div className="viewers">
        <ImageViewer imageData={selectedImage} />
        <SpectrumViewer spectrumData={selectedSpectrum} />
      </div>
      
      <div className="tools">
        <SignalSelector signals={availableSignals} />
        <MetadataViewer metadata={fileMetadata} />
      </div>
      
      <PeriodicTable onElementSelect={handleElementSelect} />
    </div>
  );
}
```

Remember to:
- Initialize required contexts
- Handle component interactions
- Manage state appropriately
- Implement proper error boundaries
- Consider performance implications

For more detailed information about specific components, refer to their individual documentation or TypeScript definitions.