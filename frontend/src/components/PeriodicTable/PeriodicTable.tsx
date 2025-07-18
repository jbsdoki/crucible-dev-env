import React from 'react';
import periodicTableData from '../../data/Periodic_Table_w_Emission_Spectra.json';
import './PeriodicTable.css';

interface PeriodicElement {
  AtomicNumber: number;
  Element: string;
  Name: string;
  [key: string]: any;
}

/*##########################################################################################################
 This section controls the color mapping of the elements in the periodic table.
 The color mapping comes from the wikipedia page for the periodic table.
 Color mapping has nothing to do with the data of the element, it is only used
 for visual aesthetics
##########################################################################################################*/
const elementsByCategory: Record<string, number[]> = {
    "nonmetal": [1, 6, 7, 8, 15, 16, 34],
    "noble-gas": [2, 10, 18, 36, 54, 86, 118],
    "alkali-metal": [3, 11, 19, 37, 55, 87],
    "alkaline-earth": [4, 12, 20, 38, 56, 88],
    "metalloid": [5, 14, 32, 33, 51, 52],
    "halogen": [9, 17, 35, 53, 85, 117],
    "post-transition-metal": [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116],
    "transition-metal": [
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
      72, 73, 74, 75, 76, 77, 78, 79, 80,
      104, 105, 106, 107, 108, 109, 110, 111, 112
    ],
    "lanthanide": [57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71],
    "actinide": [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103],
  };

// Color mapping for each element category
const categoryColors: Record<string, string> = {
  "nonmetal": "#A1D344", // Light green
  "noble-gas": "#FF9ECE", // Pink
  "alkali-metal": "#FF8B3D", // Orange
  "alkaline-earth": "#FED766", // Yellow
  "metalloid": "#73C2FB", // Light blue
  "halogen": "#98FB98", // Pale green
  "post-transition-metal": "#BDC3C7", // Light gray
  "transition-metal": "#AED6F1", // Soft blue
  "lanthanide": "#F1948A", // Light red
  "actinide": "#BB8FCE", // Light purple
};

// Helper function to get element category
const getElementCategory = (atomicNumber: number): string => {
  for (const [category, elements] of Object.entries(elementsByCategory)) {
    if (elements.includes(atomicNumber)) {
      return category;
    }
  }
  return "unknown";
};

/*##########################################################################################################
This section controls the grid position of the elements in the periodic table.
The data displayed is stored in data/Periodic_Table_w_Emission_Spectra.json
##########################################################################################################*/
const elementGridPosition: Record<number, { row: number; col: number }> = {
    1: { row: 1, col: 1 },
    2: { row: 1, col: 18 },
  
    3: { row: 2, col: 1 },
    4: { row: 2, col: 2 },
    5: { row: 2, col: 13 },
    6: { row: 2, col: 14 },
    7: { row: 2, col: 15 },
    8: { row: 2, col: 16 },
    9: { row: 2, col: 17 },
   10: { row: 2, col: 18 },
  
   11: { row: 3, col: 1 },
   12: { row: 3, col: 2 },
   13: { row: 3, col: 13 },
   14: { row: 3, col: 14 },
   15: { row: 3, col: 15 },
   16: { row: 3, col: 16 },
   17: { row: 3, col: 17 },
   18: { row: 3, col: 18 },
  
   19: { row: 4, col: 1 },
   20: { row: 4, col: 2 },
   21: { row: 4, col: 3 },
   22: { row: 4, col: 4 },
   23: { row: 4, col: 5 },
   24: { row: 4, col: 6 },
   25: { row: 4, col: 7 },
   26: { row: 4, col: 8 },
   27: { row: 4, col: 9 },
   28: { row: 4, col: 10 },
   29: { row: 4, col: 11 },
   30: { row: 4, col: 12 },
   31: { row: 4, col: 13 },
   32: { row: 4, col: 14 },
   33: { row: 4, col: 15 },
   34: { row: 4, col: 16 },
   35: { row: 4, col: 17 },
   36: { row: 4, col: 18 },
  
   37: { row: 5, col: 1 },
   38: { row: 5, col: 2 },
   39: { row: 5, col: 3 },
   40: { row: 5, col: 4 },
   41: { row: 5, col: 5 },
   42: { row: 5, col: 6 },
   43: { row: 5, col: 7 },
   44: { row: 5, col: 8 },
   45: { row: 5, col: 9 },
   46: { row: 5, col: 10 },
   47: { row: 5, col: 11 },
   48: { row: 5, col: 12 },
   49: { row: 5, col: 13 },
   50: { row: 5, col: 14 },
   51: { row: 5, col: 15 },
   52: { row: 5, col: 16 },
   53: { row: 5, col: 17 },
   54: { row: 5, col: 18 },
  
   55: { row: 6, col: 1 },
   56: { row: 6, col: 2 },
   57: { row: 6, col: 3 }, 
   72: { row: 6, col: 4 },
   73: { row: 6, col: 5 },
   74: { row: 6, col: 6 },
   75: { row: 6, col: 7 },
   76: { row: 6, col: 8 },
   77: { row: 6, col: 9 },
   78: { row: 6, col: 10 },
   79: { row: 6, col: 11 },
   80: { row: 6, col: 12 },
   81: { row: 6, col: 13 },
   82: { row: 6, col: 14 },
   83: { row: 6, col: 15 },
   84: { row: 6, col: 16 },
   85: { row: 6, col: 17 },
   86: { row: 6, col: 18 },
  
   87: { row: 7, col: 1 },
   88: { row: 7, col: 2 },
   89: { row: 7, col: 3 }, 
  104: { row: 7, col: 4 },
  105: { row: 7, col: 5 },
  106: { row: 7, col: 6 },
  107: { row: 7, col: 7 },
  108: { row: 7, col: 8 },
  109: { row: 7, col: 9 },
  110: { row: 7, col: 10 },
  111: { row: 7, col: 11 },
  112: { row: 7, col: 12 },
  113: { row: 7, col: 13 },
  114: { row: 7, col: 14 },
  115: { row: 7, col: 15 },
  116: { row: 7, col: 16 },
  117: { row: 7, col: 17 },
  118: { row: 7, col: 18 },
  
   // Lanthanides (row 8)
   58: { row: 8, col: 4 },
   59: { row: 8, col: 5 },
   60: { row: 8, col: 6 },
   61: { row: 8, col: 7 },
   62: { row: 8, col: 8 },
   63: { row: 8, col: 9 },
   64: { row: 8, col: 10 },
   65: { row: 8, col: 11 },
   66: { row: 8, col: 12 },
   67: { row: 8, col: 13 },
   68: { row: 8, col: 14 },
   69: { row: 8, col: 15 },
   70: { row: 8, col: 16 },
   71: { row: 8, col: 17 },
  
   // Actinides (row 9)
   90: { row: 9, col: 4 },
   91: { row: 9, col: 5 },
   92: { row: 9, col: 6 },
   93: { row: 9, col: 7 },
   94: { row: 9, col: 8 },
   95: { row: 9, col: 9 },
   96: { row: 9, col: 10 },
   97: { row: 9, col: 11 },
   98: { row: 9, col: 12 },
   99: { row: 9, col: 13 },
  100: { row: 9, col: 14 },
  101: { row: 9, col: 15 },
  102: { row: 9, col: 16 },
  103: { row: 9, col: 17 },
  };

const ElementCell: React.FC<{ element: PeriodicElement }> = ({ element }) => {
  const pos = elementGridPosition[element.AtomicNumber];
  if (!pos) return null;

  const category = getElementCategory(element.AtomicNumber);
  const backgroundColor = categoryColors[category] || "white";

  return (
    <div
      className="element-cell"
      style={{ 
        gridColumn: pos.col, 
        gridRow: pos.row,
        backgroundColor
      }}
    >
      <div className="atomic-number">{element.AtomicNumber}</div>
      <div className="symbol">{element.Element}</div>
      <div className="name">{element.Name}</div>
    </div>
  );
};

const PeriodicTable: React.FC = () => {
  return (
    <div className="periodic-table">
      {periodicTableData.map(element => (
        <ElementCell key={element.AtomicNumber} element={element} />
      ))}
    </div>
  );
};

export default PeriodicTable;
