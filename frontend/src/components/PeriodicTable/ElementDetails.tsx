import React, { useEffect, useState } from 'react';
import { getElementCategory } from './periodicTableUtils';
import { getEmissionSpectra } from '../../services/api';
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
}

interface EmissionSpectra {
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

const ElementDetails: React.FC<ElementDetailsProps> = ({ element, onClose, isModal = true }) => {
  const [spectraData, setSpectraData] = useState<EmissionSpectra | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        // More detailed error message based on the error
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
        {Object.entries(spectraData).map(([key, value]) => {
        //   console.log(`Rendering ${key}:`, value);
          return (
            <div key={key} className="property-row">
              <span className="property-label">{key}: </span>
              <span className="property-value">
                {value !== null ? `${value.toFixed(2)} keV` : 'Not available'}
              </span>
            </div>
          );
        })}
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