import React, { useEffect, useState } from 'react';
import { getElementCategory } from './utils/periodicTableUtils';
import { getEmissionSpectra } from '../../services/api';
import { useEmissionLineContext } from '../../contexts/EmissionLineContext';
import './ElementDetails.css';

interface ElementDetailsProps {
  element: {
    AtomicNumber: number;
    Element: string;
    Name: string;
    [key: string]: any;
  } | null;
  onClose?: () => void;
  isModal?: boolean;
  selectedLines: { [key: string]: boolean };
  onSelectedLinesChange: (selectedLines: { [key: string]: boolean }) => void;
}

interface EmissionSpectra {
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

const ElementDetails: React.FC<ElementDetailsProps> = ({ 
  element, 
  onClose, 
  isModal = true,
  selectedLines,
  onSelectedLinesChange
}) => {
  const [spectraData, setSpectraData] = useState<EmissionSpectra | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSelectedEmissionLine } = useEmissionLineContext();

  useEffect(() => {
    const fetchSpectraData = async () => {
      if (!element) return;
      
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching Emission Spectra for element:', element);
        const response = await getEmissionSpectra(element.AtomicNumber);
        console.log('Received backend data:', response);
        setSpectraData(response);
      } catch (err: any) {
        const errorMessage = err.response?.status === 500
          ? `Unable to fetch emission spectra for ${element.Name} (${element.Element}). This data might not be available.`
          : 'Failed to fetch emission spectra data. Please try again later.';
        setError(errorMessage);
        console.error('Error fetching spectra:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpectraData();
  }, [element]);

  // Update context whenever selectedLines changes
  useEffect(() => {
    if (element && spectraData) {
      const selectedEmissionLines = Object.entries(spectraData).reduce((acc, [key, value]) => {
        if (selectedLines[key]) {
          acc[key as keyof EmissionSpectra] = value;
        }
        return acc;
      }, {} as EmissionSpectra);

      // Only update context if there are selected lines
      if (Object.keys(selectedEmissionLines).length > 0) {
        setSelectedEmissionLine({
          Element: element.Element,
          AtomicNumber: element.AtomicNumber,
          EmissionLines: selectedEmissionLines
        });
      } else {
        setSelectedEmissionLine(null);
      }
    }
  }, [selectedLines, element, spectraData, setSelectedEmissionLine]);

  const handleLineToggle = (key: string) => {
    const newSelectedLines = {
      ...selectedLines,
      [key]: !selectedLines[key]
    };
    onSelectedLinesChange(newSelectedLines);
  };

  if (!element) return null;

  const category = getElementCategory(element.AtomicNumber);

  const renderSpectraData = () => {
    if (loading) return <div className="loading">Loading emission spectra...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!spectraData) return null;

    console.log('Rendering spectra data in popup:', spectraData);
    
    return (
      <div className="spectra-data">
        <h3>Emission Spectra</h3>
        {Object.entries(spectraData).map(([key, value]) => (
          <div key={key} className="property-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedLines[key] || false}
                onChange={() => handleLineToggle(key)}
                disabled={value === null}
              />
              <span className="property-label">{key}: </span>
              <span className="property-value">
                {value !== null ? `${value.toFixed(2)} keV` : 'Not available'}
              </span>
            </label>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`element-details ${isModal ? 'modal' : 'box'}`}>
      <div className="element-details-content">
        {isModal && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
        
        <div className="element-header">
          <div className="element-symbol">{element.Element}</div>
          <div className="element-number">{element.AtomicNumber}</div>
        </div>
        
        <div className="element-info">
          <h2>{element.Name}</h2>
          <p className="category">Category: {category}</p>
          
          {renderSpectraData()}
        </div>
      </div>
    </div>
  );
};

export default ElementDetails; 