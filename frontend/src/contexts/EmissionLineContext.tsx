import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface EmissionLineContextValue {
    selectedEmissionLine: {
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
    } | null;
    setSelectedEmissionLine: (value: EmissionLineContextValue['selectedEmissionLine']) => void;
}

const EmissionLineContext = createContext<EmissionLineContextValue | undefined>(undefined);

export function EmissionLineProvider({ children }: { children: ReactNode }) {
    const [selectedEmissionLine, setSelectedEmissionLine] = useState<EmissionLineContextValue['selectedEmissionLine']>(null);

    const value = { 
        selectedEmissionLine,
        setSelectedEmissionLine,
    };

    return (
        <EmissionLineContext.Provider value={value}>
            {children}
        </EmissionLineContext.Provider>
    );
}

export function useEmissionLineContext() {
    const context = useContext(EmissionLineContext);
    if (context === undefined) {
        throw new Error('useEmissionLineContext must be used within a EmissionLineProvider');
    }
    return context;
}
