import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface EmissionLineContextValue {
    selectedEmissionLine: {
        Element: string;
        AtomicNumber: number;
        EmissionLines: {
            ka1_energy: number | null;
            ka2_energy: number | null;
            kb1_energy: number | null;
            la1_energy: number | null;
            la2_energy: number | null;
            lb1_energy: number | null;
            lb2_energy: number | null;
            lg1_energy: number | null;
            ma1_energy: number | null;
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
