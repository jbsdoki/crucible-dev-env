# Frontend Project Documentation

## Project Structure Explanation

### Root Configuration Files

```
frontend/
├── package.json           # Project dependencies and scripts
├── package-lock.json     # Locked versions of dependencies
├── tsconfig.json         # Base TypeScript configuration
├── tsconfig.node.json    # TypeScript config for Vite config file
├── tsconfig.app.json     # TypeScript config for application code
├── vite.config.ts        # Vite build and dev server configuration
├── eslint.config.js      # ESLint configuration for code linting
└── .gitignore           # Git ignore patterns
```

#### package.json
```json
{
  "scripts": {
    "dev": "vite",        // Start development server
    "build": "vite build", // Create production build
    "preview": "vite preview" // Preview production build
  },
  "dependencies": {
    // Runtime dependencies
  },
  "devDependencies": {
    // Development tools and build dependencies
  }
}
```

#### TypeScript Configuration Files
1. **tsconfig.json**
   - Base configuration file
   - Extends shared TypeScript settings

2. **tsconfig.node.json**
   - Configuration for Vite and other build tools
   - Typically uses CommonJS modules

3. **tsconfig.app.json**
   - Configuration for application code
   - Uses ES modules and React-specific settings

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Server configuration
  // Build options
  // Resolve aliases
});
```

### Source Code Structure

```
frontend/src/
├── main.tsx              # Application entry point
├── App.tsx              # Root React component
├── components/          # Reusable UI components
├── contexts/           # React Context definitions
├── services/           # API and external service integrations
├── utils/              # Utility functions and helpers
├── types/              # TypeScript type definitions
└── assets/            # Static assets (images, styles, etc.)
```

#### Key Directories and Files

1. **src/components/**
   - Reusable UI components
   - Each component should have:
     - Component file (*.tsx)
     - Associated styles
     - Tests (if applicable)
     - Documentation

2. **src/contexts/**
   - React Context providers
   - Global state management
   - Shared data and functionality

3. **src/services/**
   - API integration
   - External service connections
   - Data fetching utilities

4. **src/types/**
   - TypeScript interfaces
   - Type definitions
   - Type guards

### Public Directory

```
frontend/public/
├── index.html           # HTML entry point
└── assets/             # Static assets served as-is
```

The `public` directory contains:
- Static files served directly
- Assets that don't need processing
- The main index.html template

#### index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Explorers</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Development Workflow

### Starting Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will:
- Watch for file changes
- Provide hot module replacement
- Show compilation errors
- Enable source maps

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

The build process:
1. Compiles TypeScript
2. Bundles modules
3. Minifies code
4. Optimizes assets
5. Generates source maps

### Code Quality Tools

1. **ESLint**
   - Enforces code style
   - Catches common errors
   - Maintains consistency

2. **TypeScript**
   - Static type checking
   - Enhanced IDE support
   - Better code reliability


## Common Issues and Solutions

1. **Hot Reload Not Working**
   - Check Vite configuration
   - Clear browser cache
   - Restart development server

2. **Type Errors**
   - Update TypeScript configuration
   - Check import paths
   - Verify type definitions

3. **Build Failures**
   - Check for syntax errors
   - Verify dependencies
   - Review build logs
