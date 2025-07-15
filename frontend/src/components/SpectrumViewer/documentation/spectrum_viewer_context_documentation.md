# SpectrumContext Documentation

## Overview
The SpectrumContext manages shared state and functionality for the SpectrumViewer component tree. It provides a centralized way to handle spectrum visualization state, toolbar interactions, and data management.

## Features
- Spectrum data and visualization state
- Toolbar interactions (zoom, pan, selection modes)
- Plot configuration and layout
- Region selection and energy filtered image data

## Components

### SpectrumProvider
A wrapper component that provides the Spectrum context to all its children.

Example usage:
```typescript
function ParentComponent() {
  return (
    <SpectrumProvider>
      <ChildComponents />
    </SpectrumProvider>
  );
}
```

The children prop works as follows:
```typescript
<SpectrumProvider>
  <div>This is a child</div>
  <SpectrumViewer data={spectrumData} />
  <ToolbarComponent />
</SpectrumProvider>

// The above components become the 'children' prop:
function SpectrumProvider({ children }) {
  // children = [
  //   <div>This is a child</div>,
  //   <SpectrumViewer data={spectrumData} />,
  //   <ToolbarComponent />
  // ]
  
  return (
    <SpectrumContext.Provider value={value}>
      {children} // This renders all the components above
    </SpectrumContext.Provider>
  );
}
```

### useSpectrumContext Hook
A custom hook that provides access to the spectrum context. It must be used within a component that is wrapped by SpectrumProvider.

Example usage:
```typescript
function MyComponent() {
  const context = useSpectrumContext();
  // use context values here
}
```

## Context Values

### Current Implementation
- `fwhm_index`: Stores the Full Width at Half Maximum index
- `isLogScale`: Controls whether the spectrum is displayed in log scale

### Planned Additions
- Zoom/pan state
- Selection mode state
- Plot layout configuration
- Region selection data

## Error Handling
The useSpectrumContext hook includes error checking to ensure it's only used within a provider. If used outside a provider, it will throw an error with a helpful message.

## Best Practices
1. Always wrap components that need context access with SpectrumProvider
2. Use the useSpectrumContext hook to access context values
3. Keep context values focused on shared state
4. Consider performance implications when adding new state 