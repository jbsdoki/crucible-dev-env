// import { useCallback } from 'react';
// import type { SpectrumData } from '../types';



// // Add new interface for the selection callback
// interface SelectionCallback {
//     (data: {
//       range: { start: number; end: number } | null;
//       file: string;
//       signalIndex: number;
//     }): void;
//   }
  
//   // Update the hook signature
//   export function useSpectrumSelection(
//     spectrumData: SpectrumData | null,
//     isSelectingRange: boolean,
//     onRangeSelect: SelectionCallback,  // Updated type
//     selectedFile: string,              // New parameter
//     signalIndex: number               // New parameter
//   ): UseSpectrumSelectionResult {
//     // ... existing useState and other code ...
  
//     const handleSelection = useCallback((event: any) => {
//       // ... existing validation code ...
  
//       if (!isSelectingRange || !event?.range?.x || !spectrumData) {
//         if (onRangeSelect) {
//           onRangeSelect({
//             range: null,
//             file: selectedFile,
//             signalIndex: signalIndex
//           });
//         }
//         return;
//       }
  
//       // ... existing range calculation code ...
  
//       // Update the callback to include file and signal info
//       if (onRangeSelect) {
//         onRangeSelect({
//           range: range,
//           file: selectedFile,
//           signalIndex: signalIndex
//         });
//       }
//     }, [isSelectingRange, spectrumData, onRangeSelect, selectedFile, signalIndex]);
  
//     return { selectedRange, handleSelection };
//   }