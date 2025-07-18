/* eslint-disable @typescript-eslint/no-explicit-any */
import Plot from 'react-plotly.js';
import type { PlotData, Layout } from 'plotly.js';
import { useSpectrumContext } from '../contexts/SpectrumViewerContext';
import type { SignalCapabilities, SignalInfo, SpectrumData } from '../types';

// Props needed for the Plot component
interface SpectrumPlotProps {
  // Main spectrum data from the originally selected signal
  spectrumData: SpectrumData;
  selectedSignal: SignalInfo;
  // Data from image viewer region selection - separate from main spectrum
  regionSpectrumData?: SpectrumData | null;
  // Range selection within this 1D spectrum plot (not from image viewer)
  selectedRange: {start: number, end: number} | null;
  isSelectingRange: boolean;
  onSelected: (event: any) => void;
  onRelayout: (event: any) => void;
}

function SpectrumPlot({
  spectrumData,
  selectedSignal,
  regionSpectrumData,
  selectedRange,
  isSelectingRange,
  onSelected,
  onRelayout
}: SpectrumPlotProps) {
  // Get context values - these apply to the main spectrum visualization
  const { 
    fwhm_index,
    isLogScale,
    showFWHM,
    isZoomMode,
    showRegion
  } = useSpectrumContext();

  // Process y-values for log scale - applies to both main and region spectra
  const processYValuesForLogScale = (yValues: number[]): number[] => {
    if (!isLogScale) return yValues;
    
    // Find minimum non-zero value to use as floor
    const minNonZero = yValues.reduce((min, val) => {
      if (val > 0 && (min === null || val < min)) {
        return val;
      }
      return min;
    }, null as number | null) || 1e-10;  // default to 1e-10 if all values are 0/negative
    
    // Replace zeros/negatives with minimum/100 to avoid infinity
    return yValues.map(val => val <= 0 ? minNonZero / 100 : val);
  };

  // Calculate y-axis range with buffer - applies to both spectra
  const calculateYAxisRange = (yValues: number[]): [number, number] => {
    const processedValues = processYValuesForLogScale(yValues);
    const minY = Math.min(...processedValues);
    const maxY = Math.max(...processedValues);
    
    if (isLogScale) {
      // For log scale, add buffer in log space
      const logMin = Math.log10(minY);
      const logMax = Math.log10(maxY);
      const logBuffer = (logMax - logMin) * 0.1; // 10% buffer
      return [logMin - logBuffer, logMax + logBuffer];
    } else {
      // For linear scale, add buffer in linear space
      const range = maxY - minY;
      const buffer = range * 0.1; // 10% buffer
      return [minY - buffer, maxY + buffer];
    }
  };

  // Base layout configuration - applies to entire plot
  const baseLayout: Partial<Layout> = {
    showlegend: true,
    height: 500,
    xaxis: {
      title: spectrumData ? {
        text: `${spectrumData.x_label} (${spectrumData.x_units})`
      } : undefined,
      type: 'linear'
    },
    yaxis: {
      title: spectrumData ? {
        text: spectrumData.y_label
      } : undefined,
      type: isLogScale ? 'log' : 'linear',
      range: calculateYAxisRange(spectrumData.y)
    }
  };

  // Plot data preparation - builds array of traces to display
  const plotData: Array<Partial<PlotData>> = [];

  // Add main spectrum trace - this is from the original signal selection
  plotData.push({
    x: spectrumData.x,
    y: processYValuesForLogScale(spectrumData.y),
    type: 'scatter',
    mode: 'lines',
    name: 'Full Spectrum',
    line: {
      color: '#1f77b4',
      width: 2
    }
  });

  // Add FWHM line if enabled - this uses the main signal/spectrum's FWHM index
  // Calculated in the backend
  if (showFWHM && fwhm_index !== null) {
    const fwhmX = spectrumData.x[fwhm_index];
    const maxY = Math.max(...spectrumData.y);
    plotData.push({
      x: [fwhmX, fwhmX],
      y: processYValuesForLogScale([0, maxY]),
      type: 'scatter',
      mode: 'lines',
      name: 'FWHM',
      line: {
        color: '#d62728',
        width: 2,
        dash: 'dash',
      },
    });
  }

  // Add selected range markers if range is selected - this is from 1D spectrum selection
  // When the uses drags to select a region on the 1D spectrum plot, the selectedRange is updated
  // and this component is re-rendered with the new selectedRange.
  if (selectedRange) {
    // Add start marker
    plotData.push({
      x: [spectrumData.x[selectedRange.start]],
      y: [spectrumData.y[selectedRange.start]],
      type: 'scatter',
      mode: 'markers',
      marker: { 
        size: 10,
        color: '#2ca02c',
        symbol: 'circle'
      },
      name: 'Selection Start',
      showlegend: false
    });

    // Add end marker
    plotData.push({
      x: [spectrumData.x[selectedRange.end]],
      y: [spectrumData.y[selectedRange.end]],
      type: 'scatter',
      mode: 'markers',
      marker: { 
        size: 10,
        color: '#2ca02c',
        symbol: 'circle'
      },
      name: 'Selection End',
      showlegend: false
    });

    // Add highlighted region
    plotData.push({
      x: spectrumData.x.slice(selectedRange.start, selectedRange.end + 1),
      y: spectrumData.y.slice(selectedRange.start, selectedRange.end + 1),
      type: 'scatter',
      mode: 'lines',
      line: { 
        color: '#2ca02c',
        width: 2
      },
      fill: 'tonexty',
      fillcolor: 'rgba(44, 160, 44, 0.3)',
      name: 'Selected Region'
    });
  }

  // Add region spectrum if available - this is from image viewer region selection
  // When the user selects a region on the 2D image viewer, the regionSpectrumData is updated
  // and this component is re-rendered with the new regionSpectrumData.
  if (showRegion && regionSpectrumData) {
    plotData.push({
      x: regionSpectrumData.x,
      y: regionSpectrumData.y,
      type: 'scatter',
      mode: 'lines',
      name: 'Region Spectrum',
      line: {
        color: '#ff7f0e',
        width: 2
      }
    });
  }

  // Plot component rendering with all traces
  return (
    <Plot
      data={plotData}
      layout={{
        ...baseLayout,
        dragmode: isSelectingRange ? 'select' : (isZoomMode ? 'zoom' : 'pan'),
        title: {
          text: selectedSignal.title
        },
        xaxis: {
          ...baseLayout.xaxis,
          autorange: true,
          fixedrange: false
        }
      }}
      config={{
        displayModeBar: true,
        scrollZoom: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['select2d', 'lasso2d'],
        responsive: true
      }}
      onSelected={onSelected}
      onRelayout={onRelayout}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default SpectrumPlot;