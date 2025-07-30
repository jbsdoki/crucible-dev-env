/*##########################################################################################################
 * EmissionLineRangeDisplay Component
 * 
 * Purpose:
 * This component combines two types of visualizations for the spectrum plot:
 * 1. Emission lines from the periodic table (vertical dashed lines)
 * 2. Range selections from EmissionLineAnalysis (filled areas)
 * 
 * Data Reception:
 * 1. Props:
 *    spectrumData: {
 *      x: number[],  // Energy values for the spectrum
 *      y: number[]   // Intensity values for the spectrum
 *    }
 * 
 * 2. Context Data:
 *    a. EmissionRangeContext:
 *       - Source: ../contexts/EmissionRangeSelectionContext
 *       - Data: displayState.spectrum[]
 *       - Format: Array of {
 *           lineName: string,
 *           start: number,    // Start energy in keV
 *           end: number,      // End energy in keV
 *           color: string     // Optional visualization color
 *         }
 *       - Origin: User selections in EmissionLineAnalysis component
 * 
 *    b. EmissionLineContext:
 *       - Source: ../contexts/EmissionLineFromTableContext
 *       - Data: selectedEmissionLine
 *       - Format: {
 *           Element: string,
 *           EmissionLines: {
 *             [lineName: string]: number  // Energy values in keV
 *           }
 *         }
 *       - Origin: User selections in PeriodicTable component
 * 
 * Data Processing & Output:
 * 1. Range Visualization:
 *    - Input: displayState.spectrum[]
 *    - Processing: Maps energy ranges to spectrum data indices
 *    - Output: Plotly traces with filled areas
 * 
 * 2. Emission Line Visualization:
 *    - Input: selectedEmissionLine.EmissionLines
 *    - Processing: Converts energy values to vertical lines and labels
 *    - Output: Plotly shapes and annotations
 * 
 * Return Value (PlotConfig):
 * {
 *   traces: Partial<PlotData>[],     // Filled range areas
 *   shapes: Partial<Shape>[],        // Vertical emission lines
 *   annotations: Partial<Annotations>[]  // Text labels
 * }
 * 
 * Data Flow Chain:
 * 1. PeriodicTable → EmissionLineContext → This Component
 * 2. EmissionLineAnalysis → EmissionRangeContext → This Component
 * 3. This Component → SpectrumPlot → Final Visualization
 ##########################################################################################################*/

// React was unused
// import React from 'react';
import { useEmissionRange } from '../../../contexts/EmissionRangeSelectionContext';
import { useEmissionLineContext } from '../../../contexts/EmissionLineFromTableContext';
import type { PlotData, Shape, Annotations } from 'plotly.js';

/*##########################################################################################################
 * Interface Definitions
 * 
 * Props Interface:
 * Defines the required spectrum data structure passed from parent component
 * Used for mapping energy values to plot coordinates
 ##########################################################################################################*/
interface EmissionLineRangeDisplayProps {
  spectrumData: {
    x: number[];  // Energy values array
    y: number[];  // Intensity values array
  };
}

/*##########################################################################################################
 * Return Type Interface:
 * Defines the structure of visualization configuration objects
 * These configs are consumed by Plotly in the parent SpectrumPlot component
 ##########################################################################################################*/
interface PlotConfig {
  traces: Partial<PlotData>[];     // Filled range areas
  shapes: Partial<Shape>[];        // Vertical emission lines
  annotations: Partial<Annotations>[];  // Text labels for emission lines
}

const EmissionLineRangeDisplay = ({ spectrumData }: EmissionLineRangeDisplayProps): PlotConfig => {
  /*##########################################################################################################
   * Context Data Reception
   * 
   * 1. EmissionRangeContext:
   *    - Purpose: Receives active range selections from EmissionLineAnalysis
   *    - Usage: Creates filled area visualizations for selected ranges
   *    - Data Structure: displayState.spectrum[]
   *    - Update Trigger: When user toggles ranges in EmissionLineAnalysis
   * 
   * 2. EmissionLineContext:
   *    - Purpose: Receives selected element's emission line data
   *    - Usage: Creates vertical lines and labels for emission energies
   *    - Data Structure: selectedEmissionLine.EmissionLines
   *    - Update Trigger: When user selects different elements in PeriodicTable
   ##########################################################################################################*/
  const { displayState } = useEmissionRange();
  const { selectedEmissionLine } = useEmissionLineContext();

  // Debug logging for context data
  console.log('EmissionLineRangeDisplay: Rendering with:', {
    hasEmissionLines: !!selectedEmissionLine,
    emissionLineDetails: selectedEmissionLine ? {
      element: selectedEmissionLine.Element,
      lines: Object.entries(selectedEmissionLine.EmissionLines)
        .filter(([_, energy]) => energy !== null)
        .map(([name, energy]) => `${name}: ${energy}`)
    } : null,
    rangeCount: displayState.spectrum.length,
    ranges: displayState.spectrum.map(r => ({
      lineName: r.lineName,
      start: r.start,
      end: r.end
    }))
  });

  /*##########################################################################################################
   * Range Trace Generation
   * 
   * Function: generateRangeTraces
   * Purpose: Creates filled area visualizations for selected energy ranges
   *          This is the red filled area representing the emission line sum   
   * 
   * Data Flow:
   * 1. Input Processing:
   *    - Takes ranges from displayState.spectrum
   *    - Maps energy values to spectrum data indices
   * 
   * 2. Data Transformation:
   *    - Extracts relevant portions of spectrum data
   *    - Applies minimum visibility threshold
   * 
   * 3. Output Generation:
   *    - Creates Plotly scatter traces with fill
   *    - Configures hover templates and styling
   * 
   * Return: Array of Plotly trace configurations
   ##########################################################################################################*/
  const generateRangeTraces = (): Partial<PlotData>[] => {
    const traces: Partial<PlotData>[] = [];

    displayState.spectrum.forEach(range => { // for each ragne
      // Debug logging for range processing
      console.log('Processing range:', {
        lineName: range.lineName,
        start: range.start,
        end: range.end,
        spectrumXRange: [spectrumData.x[0], spectrumData.x[spectrumData.x.length - 1]] // x values of the spectrum
      });

      // Find spectrum data indices that correspond to our energy range
      const startIdx = spectrumData.x.findIndex(x => x >= range.start); // find the index of the first x value greater than or equal to the start of the range, -1 if not found
      const endIdx = spectrumData.x.findIndex(x => x >= range.end); // find the index of the first x value greater than or equal to the end of the range, -1 if not found
      
      console.log('Found indices:', {
        startIdx,
        endIdx,
        startEnergy: startIdx !== -1 ? spectrumData.x[startIdx] : null,
        endEnergy: endIdx !== -1 ? spectrumData.x[endIdx] : null
      });

      if (startIdx !== -1 && endIdx !== -1) { // if the start and end indices are not -1 (java .findIndex() returns -1 if not found)
        // Extract data points for this range
        const xSlice = spectrumData.x.slice(startIdx, endIdx + 1); //Get all X data points in the range (KeV)
        const ySlice = spectrumData.y.slice(startIdx, endIdx + 1)  //Get all Y data points in the range (Counts)
          .map(y => Math.max(y, 0.001)); // Ensure minimum visibility

        console.log('Created range trace:', {
          pointCount: xSlice.length,
          xRange: [xSlice[0], xSlice[xSlice.length - 1]],
          yRange: [Math.min(...ySlice), Math.max(...ySlice)]
        });

        // Create filled area trace for this range
        traces.push({
          x: xSlice,
          y: ySlice,
          type: 'scatter',
          mode: 'lines',
          fill: 'tozeroy',  // Fill from line from data to y=0
          fillcolor: range.color || 'rgba(255, 0, 0, 0.2)', // Use provided color or default
          line: { width: 0 },  // Hide the line, show only fill
          name: `${range.lineName} Range`,
          hovertemplate: `${range.lineName}<br>Energy: %{x:.2f} keV<extra></extra>`
        });
      }
    });

    return traces;
  };

  /*##########################################################################################################
   * Emission Line Shape Generation
   * 
   * Function: generateEmissionLineShapes
   * Purpose: Creates dashed vertical line visualizations for emission energies
   * 
   * Data Flow:
   * 1. Input Processing:
   *    - Takes emission lines from selectedEmissionLine
   *    - Filters out null energy values
   * 
   * 2. Data Transformation:
   *    - Converts energy values to vertical line coordinates
   *    - Applies consistent styling (black dashed lines)
   * 
   * 3. Output Generation:
   *    - Creates Plotly shape configurations
   *    - Includes element and line name information
   * 
   * Return: Array of Plotly shape configurations
   ##########################################################################################################*/
  const generateEmissionLineShapes = (): Partial<Shape>[] => {
    if (!selectedEmissionLine) {
      console.log('No emission lines selected');
      return [];
    }

    //This creates the dashed vertical lines representing the emission lines
    const shapes = Object.entries(selectedEmissionLine.EmissionLines) // Object.entries() returns an array of key-value pairs
      .filter(([_, energy]) => energy !== null) // Filter out null energy values
      .map(([lineName, energy]) => ({ // Map each key-value pair to a plotly shape object
        type: 'line' as const,
        x0: energy as number, // x0 and x1 are the start and end of the line
        x1: energy as number,
        y0: 0, // y0 and y1 are the start and end of the line (Bottom of plot is 0, top is 1)
        y1: 1,
        yref: 'paper' as const,  // Use paper coordinates (0-1) for y-axis (0 is bottom, 1 is top)
        line: {
          color: 'black',
          width: 1,
          dash: 'dash' as const
        },
        name: `${selectedEmissionLine.Element}-${lineName}`
      }));

    console.log('Generated emission line shapes:', {
      count: shapes.length,
      lines: shapes.map(s => ({
        name: s.name,
        position: s.x0
      }))
    });

    return shapes;
  };

  /*##########################################################################################################
   * Annotation Generation
   * 
   * Function: generateEmissionLineAnnotations
   * Purpose: Creates text labels for emission lines at the top of the page
   * 
   * Data Flow:
   * 1. Input Processing:
   *    - Takes emission lines from selectedEmissionLine
   *    - Filters out null energy values
   * 
   * 2. Data Transformation:
   *    - Calculates label positions
   *    - Formats element and line name text
   * 
   * 3. Output Generation:
   *    - Creates Plotly annotation configurations
   *    - Applies consistent positioning and rotation
   * 
   * Return: Array of Plotly annotation configurations
   ##########################################################################################################*/
  const generateEmissionLineAnnotations = (): Partial<Annotations>[] => {
    if (!selectedEmissionLine) return [];

    const annotations = Object.entries(selectedEmissionLine.EmissionLines) // Object.entries() returns an array of key-value pairs
      .filter(([_, energy]) => energy !== null) // Filter out null energy values
      .map(([lineName, energy]) => ({ // Map each key-value pair to a plotly annotation object
        x: energy as number,
        y: 1.05,  // Position slightly above the plot
        text: `${selectedEmissionLine.Element} (${lineName})`,
        showarrow: false,
        yref: 'paper' as const,
        yanchor: 'bottom' as const,
        textangle: '45' as const
      }));

    console.log('Generated annotations:', {
      count: annotations.length,
      labels: annotations.map(a => a.text)
    });

    return annotations;
  };

  // Combine all plot elements into final configuration
  const config = {
    traces: generateRangeTraces(),
    shapes: generateEmissionLineShapes(),
    annotations: generateEmissionLineAnnotations()
  };

  console.log('Returning plot config:', {
    traceCount: config.traces.length,
    shapeCount: config.shapes.length,
    annotationCount: config.annotations.length
  });

  return config;
};

export default EmissionLineRangeDisplay;
