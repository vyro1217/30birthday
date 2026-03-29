import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalConsoleWarn = console.warn.bind(console);

console.warn = (...args: unknown[]) => {
  const [firstArg] = args;
  if (
    typeof firstArg === 'string' &&
    firstArg.includes('THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.')
  ) {
    return;
  }

  originalConsoleWarn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
