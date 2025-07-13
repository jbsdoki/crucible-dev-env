// import { createContext, useContext, useState, useEffect } from 'react';
// import type { ReactNode } from 'react';
// import { getMetadata } from '../services/api';

// // Types from MetadataViewer
// type MetadataValue = string | number | boolean | object | null;
// type MetadataDict = Record<string, Record<string, MetadataValue>>;

// // Types from App
// interface SignalCapabilities {
//   hasSpectrum: boolean;
//   hasImage: boolean;
// }

// interface SignalInfo {
//   index: number;
//   title: string;
//   type: string;
//   shape: number[];
//   capabilities: SignalCapabilities;
// }

// // Context interface
// interface FileContextType {
//   selectedFile: string;
//   setSelectedFile: (file: string) => void;
//   selectedSignal: SignalInfo | null;
//   setSelectedSignal: (signal: SignalInfo | null) => void;
//   metadata: MetadataDict | null;
//   error: string;
//   loading: boolean;
// }

// // Create the context with a default value
// const FileContext = createContext<FileContextType>({
//   selectedFile: '',
//   setSelectedFile: () => {},
//   selectedSignal: null,
//   setSelectedSignal: () => {},
//   metadata: null,
//   error: '',
//   loading: false,
// });

// // Provider props interface
// interface FileProviderProps {
//   children: ReactNode;
// }

// /**
//  * FileProvider Component
//  * 
//  * Manages the state for:
//  * - Selected file
//  * - Selected signal
//  * - Metadata
//  * - Loading states
//  * - Error states
//  * 
//  * Provides this state and update methods to all child components
//  */
// export function FileProvider({ children }: FileProviderProps) {
//   const [selectedFile, setSelectedFile] = useState<string>('');
//   const [selectedSignal, setSelectedSignal] = useState<SignalInfo | null>(null);
//   const [metadata, setMetadata] = useState<MetadataDict | null>(null);
//   const [error, setError] = useState<string>('');
//   const [loading, setLoading] = useState<boolean>(false);

//   // Effect to fetch metadata when file or signal changes
//   useEffect(() => {
//     const fetchMetadata = async () => {
//       if (!selectedFile || !selectedSignal) {
//         setMetadata(null);
//         return;
//       }

//       setLoading(true);
//       setError('');

//       try {
//         const data = await getMetadata(selectedFile, selectedSignal.index);
//         setMetadata(data);
//       } catch (err) {
//         setError(`Error loading metadata: ${(err as Error).message}`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMetadata();
//   }, [selectedFile, selectedSignal]);

//   const value = {
//     selectedFile,
//     setSelectedFile,
//     selectedSignal,
//     setSelectedSignal,
//     metadata,
//     error,
//     loading,
//   };

//   return (
//     <FileContext.Provider value={value}>
//       {children}
//     </FileContext.Provider>
//   );
// }

// // Custom hook for using the file context
// export const useFileContext = () => {
//   const context = useContext(FileContext);
//   if (context === undefined) {
//     throw new Error('useFileContext must be used within a FileProvider');
//   }
//   return context;
// };

// export default FileContext; 