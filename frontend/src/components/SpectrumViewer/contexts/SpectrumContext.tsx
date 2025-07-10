/**
 * SpectrumContext
 * 
 * This context will manage the shared state and functionality for the SpectrumViewer component tree.
 * It will eventually handle:
 * - Spectrum data and visualization state
 * - Toolbar interactions (zoom, pan, selection modes)
 * - Plot configuration and layout
 * - Region selection and energy filtered image data
 * 
 * Current Status:
 * This is a minimal implementation that will be built up incrementally.
 * 
 * Usage:
 * ```typescript
 * // Wrap your component tree with the provider
 * function ParentComponent() {
 *   return (
 *     <SpectrumProvider>
 *       <ChildComponents />
 *     </SpectrumProvider>
 *   );
 * }
 * 
 * // Access the context in child components
 * function ChildComponent() {
 *   const context = useSpectrum();
 *   // ... use context values
 * }
 * ```
 */

import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Create empty context
const SpectrumContext = createContext<unknown>(undefined);

/**
 * Props interface for the SpectrumProvider
 * 
 * @property children - ReactNode that represents all the components that will be wrapped by this provider
 *                     These components will have access to the context values
 * 
 * Example of how children works:
 * ```typescript
 * // This is how you use the SpectrumProvider:
 * <SpectrumProvider>
 *   <div>This is a child</div>
 *   <SpectrumViewer data={spectrumData} />
 *   <ToolbarComponent />
 * </SpectrumProvider>
 * 
 * // The above components become the 'children' prop:
 * function SpectrumProvider({ children }) {
 *   // children = [
 *   //   <div>This is a child</div>,
 *   //   <SpectrumViewer data={spectrumData} />,
 *   //   <ToolbarComponent />
 *   // ]
 *   
 *   return (
 *     <SpectrumContext.Provider value={{}}>
 *       {children} // This renders all the components above
 *     </SpectrumContext.Provider>
 *   );
 * }
 * ```
 * 
 * The children components can then use the useSpectrum hook to access
 * any values or functions that the SpectrumProvider makes available.
 */
interface SpectrumProviderProps {
  children: ReactNode;
}

/**
 * SpectrumProvider Component
 * 
 * This is a wrapper component that provides the Spectrum context to all its children.
 * It uses React's Context.Provider to make values available to any child component
 * that uses the useSpectrum hook.
 * 
 * Currently, it provides an empty object as the context value.
 * As we build the functionality, we'll add:
 * - State variables (zoom, selection, etc.)
 * - Handler functions
 * - Data management
 * 
 * @param children - All components that need access to the spectrum context
 * @returns A Provider component wrapping its children
 */
export function SpectrumProvider({ children }: SpectrumProviderProps) {
  return (
    <SpectrumContext.Provider value={{}}>
      {children}
    </SpectrumContext.Provider>
  );
}

/**
 * useSpectrum Hook
 * 
 * This is a custom hook that provides access to the spectrum context.
 * It uses React's useContext hook internally and adds error checking.
 * 
 * The hook must be used within a component that is wrapped by SpectrumProvider.
 * If it's not, it will throw an error.
 * 
 * Example usage:
 * ```typescript
 * function MyComponent() {
 *   const context = useSpectrum();
 *   // use context values here
 * }
 * ```
 * 
 * @throws Error if used outside of a SpectrumProvider
 * @returns The current context value (currently an empty object)
 */
export function useSpectrum() {
  const context = useContext(SpectrumContext);
  if (context === undefined) {
    throw new Error('useSpectrum must be used within a SpectrumProvider');
  }
  return context;
} 