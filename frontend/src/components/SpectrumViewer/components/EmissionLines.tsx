// import React from 'react';
// import { useEmissionLineContext } from '../../../contexts/EmissionLineContext';

// const EmissionLines: React.FC = () => {
//     const { selectedEmissionLine } = useEmissionLineContext();

//     // Debug log for entire context value
//     console.log('EmissionLines component - Context value:', selectedEmissionLine);

//     if (!selectedEmissionLine) {
//         console.log('No emission lines selected');
//         return null;
//     }

//     const { Element, AtomicNumber, EmissionLines } = selectedEmissionLine;

//     // Debug log for specific values
//     console.log('Selected Element Data:', {
//         Element,
//         AtomicNumber,
//         'Available Lines': Object.entries(EmissionLines)
//             .filter(([_, energy]) => energy !== null)
//             .map(([name, energy]) => `${name}: ${energy} keV`)
//     });

//     return (
//         <div>
//             <h4>{Element} ({AtomicNumber}) Emission Lines:</h4>
//             {Object.entries(EmissionLines).map(([lineName, energy]) => (
//                 energy !== null && (
//                     <div key={lineName}>
//                         {lineName}: {energy.toFixed(2)} keV
//                     </div>
//                 )
//             ))}
//         </div>
//     );
// };

// export default EmissionLines;
