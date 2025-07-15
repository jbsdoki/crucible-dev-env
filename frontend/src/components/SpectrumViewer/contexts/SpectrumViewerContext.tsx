// import React, { createContext, useContext, useState, useEffect } from 'react';
// import type { ReactNode } from 'react';

// /**
//  * The SpectrumContext manages global state for spectrum visualization.
//  * 
//  * Note on FWHM Index Management:
//  * While SpectrumData (from types.ts) includes fwhm_index, the context maintains its own fwhm_index state.
//  * This separation allows:
//  * 1. Dynamic updates to FWHM visualization without modifying the source data
//  * 2. Independent control over FWHM display across different spectrum views
//  * 3. Persistence of FWHM selection even when spectrum data changes
//  * 
//  * The context's fwhm_index should be initialized from SpectrumData.fwhm_index when:
//  * - New spectrum data is loaded
//  * - The user switches to a different spectrum
//  * - The application needs to reset to the default FWHM point
//  */

// // Define the shape of our context value
// interface SpectrumContextValue {
//   // X axis FWHM index - This can differ from SpectrumData.fwhm_index as it represents
//   // the currently active/displayed FWHM point rather than the data's default FWHM
//   fwhm_index: number | null;
//   setFwhmIndex: (index: number | null) => void;
//   // Y axis log scale state
//   isLogScale: boolean;
//   setIsLogScale: (value: boolean) => void;
//   // FWHM visibility state
//   showFWHM: boolean;
//   setShowFWHM: (value: boolean) => void;
//   // Plot interaction mode
//   isZoomMode: boolean;
//   setIsZoomMode: (value: boolean) => void;
//   // Region spectrum visibility
//   showRegion: boolean;
//   setShowRegion: (value: boolean) => void;
// }

// // Create the context with undefined as initial value
// const SpectrumContext = createContext<SpectrumContextValue | undefined>(undefined);

// // Props type for the provider component
// interface SpectrumViewerProviderProps {
//   children: ReactNode;
// }

// // Provider component that manages state and makes it available to children
// export function SpectrumViewerProvider({ children }: SpectrumViewerProviderProps) {
//   console.log('[SpectrumViewerContext] Initializing provider');
  
//   const [fwhm_index, setFwhmIndexInternal] = useState<number | null>(null);
//   const [isLogScale, setIsLogScaleInternal] = useState<boolean>(false);
//   const [showFWHM, setShowFWHMInternal] = useState<boolean>(false);
//   const [isZoomMode, setIsZoomModeInternal] = useState<boolean>(true);
//   const [showRegion, setShowRegionInternal] = useState<boolean>(true);

//   // Wrapped state setters with logging
//   const setFwhmIndex = (index: number | null) => {
//     console.log('[SpectrumViewerContext] Setting FWHM index:', { oldValue: fwhm_index, newValue: index });
//     setFwhmIndexInternal(index);
//   };

//   const setIsLogScale = (value: boolean) => {
//     console.log('[SpectrumViewerContext] Setting log scale:', { oldValue: isLogScale, newValue: value });
//     setIsLogScaleInternal(value);
//   };

//   const setShowFWHM = (value: boolean) => {
//     console.log('[SpectrumViewerContext] Setting show FWHM:', { oldValue: showFWHM, newValue: value });
//     setShowFWHMInternal(value);
//   };

//   const setIsZoomMode = (value: boolean) => {
//     console.log('[SpectrumViewerContext] Setting zoom mode:', { oldValue: isZoomMode, newValue: value });
//     setIsZoomModeInternal(value);
//   };

//   const setShowRegion = (value: boolean) => {
//     console.log('[SpectrumViewerContext] Setting show region:', { oldValue: showRegion, newValue: value });
//     setShowRegionInternal(value);
//   };

//   // Log state changes
//   useEffect(() => {
//     console.log('[SpectrumViewerContext] Current state:', {
//       fwhm_index,
//       isLogScale,
//       showFWHM,
//       isZoomMode,
//       showRegion
//     });
//   }, [fwhm_index, isLogScale, showFWHM, isZoomMode, showRegion]);

//   const value: SpectrumContextValue = {
//     fwhm_index,
//     setFwhmIndex,
//     isLogScale,
//     setIsLogScale,
//     showFWHM,
//     setShowFWHM,
//     isZoomMode,
//     setIsZoomMode,
//     showRegion,
//     setShowRegion
//   };

//   return (
//     <SpectrumContext.Provider value={value}>
//       {children}
//     </SpectrumContext.Provider>
//   );
// }

// // Custom hook to access the spectrum context with type safety
// export function useSpectrumContext() {
//   const context = useContext(SpectrumContext);
//   if (context === undefined) {
//     throw new Error('useSpectrumContext must be used within a SpectrumViewerProvider');
//   }
//   console.log('[SpectrumViewerContext] Context accessed by consumer');
//   return context;
// }

// // Export the provider as default export as well
// export default SpectrumViewerProvider; 