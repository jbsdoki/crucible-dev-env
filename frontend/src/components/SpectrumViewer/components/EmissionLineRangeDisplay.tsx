/*##########################################################################################################
 * EmissionLineRangeDisplay Component
 * 
 * Purpose:
 * This component combines two types of visualizations for the spectrum plot:
 * 1. Emission lines from the periodic table (vertical dashed lines)
 * 2. Range selections from EmissionLineAnalysis (filled areas)
 * 
 * Context Usage:
 * 1. EmissionRangeContext (from EmissionRangeSelectionContext):
 *    - Receives: displayState.spectrum[] containing active ranges selected in EmissionLineAnalysis
 *    - Each range has: { lineName, start, end, color }
 * 
 * 2. EmissionLineContext (from EmissionLineFromTableContext):
 *    - Receives: selectedEmissionLine data from periodic table selections
 *    - Contains: Element name and EmissionLines object with energy values
 * 
 * Data Flow:
 * EmissionLineRangeDisplay → SpectrumPlot → SpectrumViewerRoot
 * 1. This component generates plot configurations (traces, shapes, annotations)
 * 2. SpectrumPlot uses these configs to render visualizations
 * 3. No direct state management - all data comes from contexts
 * 
 * Key Functions:
 * 1. generateRangeTraces: Creates filled area plots for selected ranges
 * 2. generateEmissionLineShapes: Creates vertical lines for emission energies
 * 3. generateEmissionLineAnnotations: Creates labels for emission lines
 ##########################################################################################################*/

import React from 'react';
import { useEmissionRange } from '../../../contexts/EmissionRangeSelectionContext';
import { useEmissionLineContext } from '../../../contexts/EmissionLineFromTableContext';
import type { PlotData, Shape, Annotations } from 'plotly.js';

// Props: Receives spectrum data for mapping energy values to plot coordinates
interface EmissionLineRangeDisplayProps {
  spectrumData: {
    x: number[];  // Energy values array
    y: number[];  // Intensity values array
  };
}

// Return type: Configuration objects for Plotly visualization
interface PlotConfig {
  traces: Partial<PlotData>[];     // Filled range areas
  shapes: Partial<Shape>[];        // Vertical emission lines
  annotations: Partial<Annotations>[];  // Text labels for emission lines
}

//Extract spectrum data from the props object and return a PlotConfig object
const EmissionLineRangeDisplay = ({ spectrumData }: EmissionLineRangeDisplayProps): PlotConfig => {
  /*#################################################################################
   * Context Hooks:
   * 1. useEmissionRange():
   *    - Provides displayState.spectrum which contains all currently active ranges
   *    - Each range represents a user-selected area from EmissionLineAnalysis
   *    - Format: { lineName, start, end, color }
   */
  const { displayState } = useEmissionRange();

  /*#################################################################################
   * 2. useEmissionLineContext():
   *    - Provides selectedEmissionLine from periodic table selection
   *    - Contains element info and its emission line energies
   *    - Format: { Element: string, EmissionLines: { lineName: energy } }
   */
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

  /*
   * Creates Plotly traces for each selected range from EmissionLineAnalysis
   * This is the red filled area representing the emission line sum 
   * - Maps energy ranges to spectrum data indices
   * - Creates filled area plots using 'tozeroy' fill
   * - Uses color from range config or default red
   * Returns: Array of Plotly trace objects
   */
  const generateRangeTraces = (): Partial<PlotData>[] => {
    const traces: Partial<PlotData>[] = [];

    displayState.spectrum.forEach(range => {
      // Debug logging for range processing
      console.log('Processing range:', {
        lineName: range.lineName,
        start: range.start,
        end: range.end,
        spectrumXRange: [spectrumData.x[0], spectrumData.x[spectrumData.x.length - 1]]
      });

      // Find spectrum data indices that correspond to our energy range
      const startIdx = spectrumData.x.findIndex(x => x >= range.start);
      const endIdx = spectrumData.x.findIndex(x => x >= range.end);
      
      console.log('Found indices:', {
        startIdx,
        endIdx,
        startEnergy: startIdx !== -1 ? spectrumData.x[startIdx] : null,
        endEnergy: endIdx !== -1 ? spectrumData.x[endIdx] : null
      });

      if (startIdx !== -1 && endIdx !== -1) {
        // Extract data points for this range
        const xSlice = spectrumData.x.slice(startIdx, endIdx + 1);
        const ySlice = spectrumData.y.slice(startIdx, endIdx + 1)
          .map(y => Math.max(y, 0.01)); // Ensure minimum visibility

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
          fill: 'tozeroy',  // Fill from line to y=0
          fillcolor: range.color || 'rgba(255, 0, 0, 0.2)', // Use provided color or default
          line: { width: 0 },  // Hide the line, show only fill
          name: `${range.lineName} Range`,
          hovertemplate: `${range.lineName}<br>Energy: %{x:.2f} keV<extra></extra>`
        });
      }
    });

    return traces;
  };

  /*
   * Creates vertical line shapes for emission lines from periodic table
   * - Uses black dashed lines
   * - Only creates lines for non-null energy values
   * Returns: Array of Plotly shape objects
   */
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

  /*
   * Creates text labels at top of page for emission lines
   * - Places labels above the plot
   * - Rotated 45 degrees for better readability
   * Returns: Array of Plotly annotation objects
   */
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
