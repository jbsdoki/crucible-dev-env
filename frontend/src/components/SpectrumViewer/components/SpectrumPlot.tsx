/* eslint-disable @typescript-eslint/no-explicit-any */
import Plot from 'react-plotly.js';
import type { PlotData, Layout } from 'plotly.js';
import { useSpectrumContext } from '../contexts/SpectrumContext';
import type { SignalCapabilities, SignalInfo, SpectrumData } from '../types';

// Props needed for the Plot component
interface SpectrumPlotProps {
  spectrumData: SpectrumData;
  selectedSignal: SignalInfo;
  regionSpectrumData?: SpectrumData | null;
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
  // Get context values
  const { 
    fwhm_index,
    isLogScale,
    showFWHM,
    isZoomMode,
    showRegion
  } = useSpectrumContext();

  // Your existing code from SpectrumViewer.tsx goes here, unchanged
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

  // Function to calculate y-axis range with buffer
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

  // Base layout configuration
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

  // Plot data preparation
  const plotData: Array<Partial<PlotData>> = [];

  // Add main spectrum with log scale handling
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

  // Add FWHM line if enabled and index exists
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

  // Add selected range markers if range is selected
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

  // Add region spectrum if available
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

  // Plot component rendering
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