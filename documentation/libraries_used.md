# React Explorers

This project uses React with Vite as the frontend build system.
The backend uses Hyperspy and Exspy for analyzing scientific files.
Frontend - Backend communication: A user selects files, signals, or sections of data to analyze, the requested
section coordinates (x,y coordinates for images, or x1 x2 coordinates for spectrums) are sent to the backend. 
Hyperspy and Exspy are used to select those specific regions of data, which are stored as numpy arrays inside
the file, and those numpy arrays are sent as lists to the frontend (numpy.tolist())
The frontend takes the data and displays it for the user. 

## Core Technologies

### React
React is a JavaScript library for building user interfaces through a component-based architecture. Components are reusable pieces of code that return HTML elements through JSX (JavaScript XML syntax). React implements a unidirectional data flow and uses a virtual DOM - a lightweight copy of the actual DOM - to efficiently update only the necessary parts of a webpage when data changes.
https://react.dev/

### Vite
Vite is a build tool that serves code via native ES modules during development. It splits the dev server startup into two phases: dependency pre-bundling using esbuild, and source code serving through native ESM. For production, Vite bundles code with Rollup. This architecture enables fast cold starts and instant hot module replacement (HMR) during development.
https://vite.dev/

### Hyperspy
Hyperspy is a Python library for multi-dimensional data analysis. It specializes in processing and analyzing scientific data, particularly electron microscopy datasets. The library provides tools for:
- Loading and saving various scientific file formats
- Extracting regions of interest from multi-dimensional datasets
- Signal processing and statistical analysis
- Handling metadata and calibration information
- Interactive data visualization (though in this project, we use the raw data for our own frontend visualization)
https://hyperspy.org/index.html

### Exspy
Exspy is an extension of Hyperspy specifically designed for electron microscopy data analysis. It builds upon Hyperspy's core functionality by adding:
- Specialized tools for electron microscopy signal processing
- Advanced algorithms for analyzing EELS (Electron Energy Loss Spectroscopy) data
- Functions for processing EDS (Energy Dispersive X-ray Spectroscopy) signals
- Methods for handling and analyzing STEM (Scanning Transmission Electron Microscopy) datasets
https://hyperspy.org/exspy/

## Development Tools

### npm (Node Package Manager)
npm is the default package manager for Node.js. It manages project dependencies, runs scripts defined in package.json, and provides access to a large registry of JavaScript packages. Here are some important npm commands used in this project:

#### npm audit
The `npm audit` command performs a security audit of project dependencies. It checks the project's dependency tree against known vulnerability databases and provides information about any security issues found. Example output:

```
cd frontend
$ npm audit
```

#### npm run lint
The `npm run lint` command executes the linting script defined in package.json. Linting helps maintain code quality by checking for potential errors, enforcing consistent code style, and identifying problematic patterns. In this project, we use ESLint with TypeScript support. Example output:

```
cd frontend
$ npm run lint
```


Frontend npm library list: (automatically installed with bash npm "install" command)
Displayed with "npm list" command

frontend@0.0.0 C:\Users\MF\LBNL_git_repos\react-explorers\frontend
├── @emotion/react@11.14.0
├── @emotion/styled@11.14.0
├── @eslint/js@9.28.0
├── @mui/icons-material@7.1.1
├── @mui/material@7.1.1
├── @types/lodash@4.17.20 extraneous
├── @types/plotly.js@3.0.2
├── @types/react-dom@19.1.6
├── @types/react@19.1.7
├── @vitejs/plugin-react@4.5.2
├── axios@1.9.0
├── eslint-plugin-react-hooks@5.2.0
├── eslint-plugin-react-refresh@0.4.20
├── eslint@9.28.0
├── globals@16.2.0
├── plotly.js@3.0.1
├── react-dom@19.1.0
├── react-plotly.js@2.6.0
├── react@19.1.0
├── recharts@2.15.3
├── typescript-eslint@8.34.0
├── typescript@5.8.3
└── vite@6.3.5

   
Specific build type should not matter for npm
These package names are stored in frontend/package.json for easy install using npm
frontend/package-lock.json displays all the sub dependencies

## Backend Dependencies list

### Installed packages
list stored in backend/requirements.txt for easy install

- Python Version: 3.10
- Key Packages: 
   - fastapi==0.109.2
   - uvicorn==0.27.1
   - hyperspy==1.7.5
   - python-multipart==0.0.9
   - numpy==1.23.5
   - scikit-image==0.19.3
   - scipy==1.10.1
   - matplotlib==3.5.1
   - xraylib==4.1.5
