/**
 * This file contains the core type definitions for the SpectrumViewer component and its related features.
 * These types are used throughout the SpectrumViewer directory to ensure type safety and provide
 * clear interfaces for data structures used in spectrum visualization and analysis.
 */

/**
 * Defines the capabilities of a signal in terms of what data visualizations it supports.
 * Used to determine what UI elements and features should be enabled for a given signal.
 */
export interface SignalCapabilities {
    hasSpectrum: boolean;
    hasImage: boolean;
  }
  
  /**
   * Represents metadata and capabilities of a signal source.
   * This interface is used when listing available signals and managing signal selection.
   */
  export interface SignalInfo {
    index: number;
    title: string;
    type: string;
    shape: number[]; // Dimensions of the signal data array
    capabilities: SignalCapabilities;
  }
  
  /**
   * Contains the actual spectral data and associated metadata for plotting.
   * Used by the SpectrumPlot component and spectrum-related hooks for visualization.
   */
  export interface SpectrumData {
    x: number[];
    y: number[];
    x_label: string;
    x_units: string;
    y_label: string;
    zero_index: number | null; // Index for zero KeV energy point
    fwhm_index: number | null; // Index for Full Width at Half Maximum point
  }
  
  /**
   * Defines the visible ranges for the spectrum plot axes.
   * Used for controlling zoom levels and view boundaries in the SpectrumPlot component.
   */
  export interface AxisRange {
    x?: [number, number];
    y?: [number, number];
  } 
  
  // For the periodic table emission lines
  interface EmissionLine {
    element: string;
    energy: number;
    intensity: number;
    label: string;
  }
  
  // For getting the sum of a range
  interface Range {
    id: string;
    start: number;
    end: number;
    width: number; // in KeV
    label?: string;
    color?: string;
  }
  