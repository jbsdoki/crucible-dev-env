import React, { useState } from 'react';
import periodicTableData from '../../data/Periodic_Table_w_Emission_Spectra.json';
import './PeriodicTable.css';
import { 
  elementGridPosition, 
  getElementCategory, 
  categoryColors 
} from './utils/periodicTableUtils';
import ElementDetails from './ElementDetails';
import * as api from '../../services/api';
import { useEmissionLineContext } from '../../contexts/EmissionLineContext';

interface PeriodicElement {
  AtomicNumber: number;
  Element: string;
  Name: string;
  [key: string]: any;
}

// Props interface for the ElementCell component
interface ElementCellProps {
  element: PeriodicElement;
  onElementClick?: (element: PeriodicElement) => void;
  isSelected?: boolean;
}

// Props interface for the PeriodicTable component
interface PeriodicTableProps {
  onElementClick?: (element: PeriodicElement) => void;
  displayMode?: 'modal' | 'box';
}

// Interface for tracking selected emission lines per element
interface SelectedLinesState {
  [elementNumber: number]: {
    [lineName: string]: boolean;
  };
}

const ElementCell: React.FC<ElementCellProps> = ({ element, onElementClick, isSelected }) => {
  const pos = elementGridPosition[element.AtomicNumber];
  if (!pos) return null;

  const category = getElementCategory(element.AtomicNumber);
  const backgroundColor = categoryColors[category] || "white";

  const handleClick = () => {
    if (onElementClick) {
      onElementClick(element);
    }
  };

  return (
    <div
      className={`element-cell ${isSelected ? 'selected' : ''}`}
      style={{ 
        gridColumn: pos.col, 
        gridRow: pos.row,
        backgroundColor,
        border: isSelected ? '2px solid #2196F3' : '1px solid #ddd',
        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
        zIndex: isSelected ? 1 : 'auto',
        transition: 'transform 0.2s ease-in-out'
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="atomic-number">{element.AtomicNumber}</div>
      <div className="symbol">{element.Element}</div>
      <div className="name">{element.Name}</div>
    </div>
  );
};

const PeriodicTable: React.FC<PeriodicTableProps> = ({ onElementClick, displayMode = 'modal' }) => {
  const [selectedElements, setSelectedElements] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [activeElement, setActiveElement] = useState<PeriodicElement | null>(null);
  // This state tracks the selected emission lines, allowing the
  // PeriodicTable component to keep track of which are selected
  const [selectedLinesState, setSelectedLinesState] = useState<SelectedLinesState>({});
  const { setSelectedEmissionLine } = useEmissionLineContext();

  const handleElementClick = (element: PeriodicElement) => {
    const isCurrentlySelected = selectedElements.has(element.AtomicNumber);
    
    if (isCurrentlySelected) {
      // Deselect the element
      const newSelectedElements = new Set(selectedElements);
      newSelectedElements.delete(element.AtomicNumber);
      setSelectedElements(newSelectedElements);
      
      // Remove element's emission lines from state
      const newSelectedLinesState = { ...selectedLinesState };
      delete newSelectedLinesState[element.AtomicNumber];
      setSelectedLinesState(newSelectedLinesState);
      
      // If this was the active element in the modal, close it
      if (activeElement?.AtomicNumber === element.AtomicNumber) {
        setShowModal(false);
        setActiveElement(null);
      }
    } else {
      // Select the element
      setSelectedElements(new Set([...selectedElements, element.AtomicNumber]));
      setActiveElement(element);
      if (displayMode === 'modal') {
        setShowModal(true);
      }
    }

    if (onElementClick) {
      onElementClick(element);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setActiveElement(null);
  };

  // Add handler for updating selected lines
  const handleSelectedLinesChange = (elementNumber: number, selectedLines: { [key: string]: boolean }) => {
    setSelectedLinesState(prev => ({
      ...prev,
      [elementNumber]: selectedLines
    }));
  };

  return (
    <div className="periodic-table-container">
      <div className="periodic-table">
        {periodicTableData.map(element => (
          <ElementCell 
            key={element.AtomicNumber} 
            element={element} 
            onElementClick={handleElementClick}
            isSelected={selectedElements.has(element.AtomicNumber)}
          />
        ))}
      </div>

      {/* Show element details based on display mode */}
      {activeElement && (
        displayMode === 'modal' ? (
          showModal && (
            <ElementDetails 
              element={activeElement}
              onClose={handleCloseModal}
              isModal={true}
              selectedLines={selectedLinesState[activeElement.AtomicNumber] || {}}
              onSelectedLinesChange={(selectedLines) => 
                handleSelectedLinesChange(activeElement.AtomicNumber, selectedLines)}
            />
          )
        ) : (
          <ElementDetails 
            element={activeElement}
            isModal={false}
            selectedLines={selectedLinesState[activeElement.AtomicNumber] || {}}
            onSelectedLinesChange={(selectedLines) => 
              handleSelectedLinesChange(activeElement.AtomicNumber, selectedLines)}
          />
        )
      )}
    </div>
  );
};

export default PeriodicTable;
