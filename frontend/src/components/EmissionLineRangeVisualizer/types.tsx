/**
 * Types for the SpectrumToImage component
 * These types support displaying multiple energy range images simultaneously
 */

/**
 * Represents a single energy range selection
 */
export interface EnergyRange {
    id: string;           // Unique identifier for this range
    start: number;        // Start energy/channel
    end: number;         // End energy/channel
    label?: string;      // Optional label for the range
    color?: string;      // Optional color for visual distinction
  }
  
  /**
   * Props for a single image display
   */
  export interface ImageDisplayConfig {
    colorScale?: string;              // Custom colorscale for this image (defaults to 'Viridis')
    showColorbar?: boolean;           // Whether to show the colorbar
    colorbarTitle?: string;           // Custom title for the colorbar
    zsmooth?: 'best' | 'fast' | false; // Smoothing option for the heatmap
  }
  
  
  /**
   * State interface for managing multiple images
   */
  export interface ImageState {
    [rangeId: string]: {
      data: number[][] | null;
      loading: boolean;
      error: string | null;
    };
  } 
  
  export interface SpectrumRangeImageProps {
    selectedFile: string;
    signalIndex: number;
    selectedRange: {
      start: number;
      end: number;
    } | null;
  }
  