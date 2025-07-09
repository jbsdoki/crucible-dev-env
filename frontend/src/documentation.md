# React Fundamentals Documentation

## What is React?

React is a JavaScript library for building user interfaces, particularly single-page applications. It allows developers to create reusable UI components that manage their own state and efficiently update and render when data changes.

## How React Works

### Virtual DOM
React uses a Virtual DOM (Document Object Model) to optimize rendering performance:
1. When data changes, React first updates a virtual representation of the UI
2. React then compares this virtual DOM with the actual DOM (diffing)
3. Only the necessary changes are applied to the real DOM (reconciliation)
4. This process minimizes expensive DOM operations and improves performance

### Component-Based Architecture
- React applications are built using components
- Components are reusable, self-contained pieces of UI
- Components can be class-based or function-based (modern React prefers function components)
- Components can receive data via props and maintain internal state

## Import Statements in React

### Basic React Imports
```typescript
// Import React and necessary hooks
import React from 'react';
import { useState, useEffect } from 'react';

// Import components
import MyComponent from './components/MyComponent';

// Import styles
import './styles.css';

// Import types (TypeScript)
import { MyComponentProps } from './types';
```

### Import Types
1. **Default Imports**: 
   ```typescript
   import React from 'react';
   ```
   - Used when a module exports a default value
   - Only one default export per module is allowed

2. **Named Imports**:
   ```typescript
   import { useState, useEffect } from 'react';
   ```
   - Used to import specific exports from a module
   - Multiple named imports can be combined in one statement

3. **Namespace Imports**:
   ```typescript
   import * as ReactIcons from 'react-icons';
   ```
   - Imports all exports as properties of a single object

4. **Relative vs Absolute Imports**:
   ```typescript
   // Relative import (from current directory)
   import { Button } from './Button';
   
   // Absolute import (from node_modules or configured paths)
   import { useState } from 'react';
   ```

## Essential React Hooks

### useState
The useState hook allows functional components to manage state.

```typescript
const [state, setState] = useState(initialValue);
```

#### How useState Works:
1. Returns an array with two elements:
   - Current state value
   - Function to update the state

2. Example Usage:
   ```typescript
   const [count, setCount] = useState(0);
   
   // Update state
   setCount(count + 1);
   
   // Update state using previous value
   setCount(prevCount => prevCount + 1);
   ```

3. Best Practices:
   - Use when you need to track values that change over time
   - Keep state minimal and derived values in regular variables
   - Use separate state variables for unrelated data
   - Use objects/arrays when state values are related

### useEffect
The useEffect hook handles side effects in functional components.

```typescript
useEffect(() => {
  // Effect code
  return () => {
    // Cleanup code
  };
}, [dependencies]);
```

#### How useEffect Works:
1. **Execution Timing**:
   - Runs after every render by default
   - Can be controlled using the dependency array
   - Cleanup function runs before component unmounts or before next effect

2. **Dependency Array**:
   ```typescript
   // Runs on every render
   useEffect(() => {});
   
   // Runs only once on mount
   useEffect(() => {}, []);
   
   // Runs when dependencies change
   useEffect(() => {}, [dep1, dep2]);
   ```

3. **Common Use Cases**:
   - Data fetching
   - Subscriptions
   - DOM manipulations
   - Event listeners
   - Timer setup/cleanup

4. **Best Practices**:
   ```typescript
   // Data Fetching Example
   useEffect(() => {
     let isMounted = true;
     
     async function fetchData() {
       try {
         const data = await api.getData();
         if (isMounted) {
           setData(data);
         }
       } catch (error) {
         if (isMounted) {
           setError(error);
         }
       }
     }
     
     fetchData();
     
     return () => {
       isMounted = false;
     };
   }, []);
   ```

   - Always cleanup side effects when component unmounts
   - Use cleanup to prevent memory leaks
   - Handle race conditions in async operations
   - Keep dependency array accurate
   - Avoid infinite loops by properly managing dependencies

## Component Lifecycle with Hooks

### Mounting
```typescript
function MyComponent() {
  // 1. Component initialization
  const [data, setData] = useState(null);

  // 2. First render
  useEffect(() => {
    // 3. After mount
    fetchData();
    
    // 4. Cleanup on unmount
    return () => cleanup();
  }, []);

  return <div>{/* JSX */}</div>;
}
```

### Updating
```typescript
function MyComponent({ id }) {
  useEffect(() => {
    // Runs when 'id' changes
    fetchData(id);
  }, [id]);
}
```

### Unmounting
```typescript
useEffect(() => {
  // Setup
  const subscription = subscribe();
  
  // Cleanup
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Performance Optimization Tips

1. **Memoization**:
   ```typescript
   // Memoize expensive calculations
   const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
   
   // Memoize callbacks
   const memoizedCallback = useCallback(() => {
     doSomething(a, b);
   }, [a, b]);
   ```

2. **State Updates**:
   - Use functional updates for state that depends on previous value
   - Batch related state updates together
   - Consider using useReducer for complex state logic

3. **Effect Dependencies**:
   - Keep dependency arrays accurate
   - Extract values that don't need to trigger effects
   - Use refs for values that shouldn't trigger re-renders


