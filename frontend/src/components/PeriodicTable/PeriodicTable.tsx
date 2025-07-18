import React, { useState } from 'react';
import periodicTableData from '../../data/Periodic_Table_w_Emission_Spectra.json';
import './PeriodicTable.css';
import { 
  elementGridPosition, 
  getElementCategory, 
  categoryColors 
} from './periodicTableUtils';
import ElementDetails from './ElementDetails';
import * as api from '../../services/api';

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
        border: isSelected ? '2px solid #2196F3' : '1px solid #ddd'
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
  const [selectedElement, setSelectedElement] = useState<PeriodicElement | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleElementClick = (element: PeriodicElement) => {
    setSelectedElement(element);
    if (displayMode === 'modal') {
      setShowModal(true);
    }
    if (onElementClick) {
      onElementClick(element);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div className="periodic-table-container">
      <div className="periodic-table">
        {periodicTableData.map(element => (
          <ElementCell 
            key={element.AtomicNumber} 
            element={element} 
            onElementClick={handleElementClick}
            isSelected={selectedElement?.AtomicNumber === element.AtomicNumber}
          />
        ))}
      </div>

      {/* Show element details based on display mode */}
      {selectedElement && (
        displayMode === 'modal' ? (
          showModal && (
            <ElementDetails 
              element={selectedElement}
              onClose={handleCloseModal}
              isModal={true}
            />
          )
        ) : (
          <ElementDetails 
            element={selectedElement}
            isModal={false}
          />
        )
      )}
    </div>
  );
};

export default PeriodicTable;
