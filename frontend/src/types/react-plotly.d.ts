/**
 * This is a special file that helps our code editor understand how to work with Plotly graphs.
 * 
 * Plotly is a tool for making interactive charts and graphs (like line plots, scatter plots, etc.).
 * We're using a version of Plotly that works with our website framework (called React).
 * 
 * This file exist to:
 * - It's like a dictionary that tells our code editor what features are available
 * - It helps catch errors before we run our code
 * - It enables auto-complete suggestions while we're coding
 */

declare module 'react-plotly.js' {
  import { Component } from 'react';
  import { PlotData, Layout, Config } from 'plotly.js';

  /**
   * This describes what information we can give to a Plotly graph.
   * Think of it like a set of instructions for creating a graph:
   * 
   * @property data - The actual numbers and points we want to show on the graph
   * @property layout - How we want the graph to look (like titles, colors, size)
   * @property config - What users can do with the graph (like zoom, download, etc.)
   * @property [key: string] - Any extra settings we might want to add
   */
  interface PlotProps {
    data: Partial<PlotData>[];
    layout?: Partial<Layout>;
    config?: Partial<Config>;
    [key: string]: any;
  }

  /**
   * This is the main graph component we use in our code.
   * 
   * Example of how to use it:
   * We can create a graph by writing:
   * <Plot 
   *    data={[{x: [1,2,3], y: [1,2,3], type: 'scatter'}]}  // The points to plot
   *    layout={{title: 'My Graph'}}                         // How it looks
   *    config={{scrollZoom: true}}                         // What users can do with it
   * />
   */
  export default class Plot extends Component<PlotProps> {}
} 