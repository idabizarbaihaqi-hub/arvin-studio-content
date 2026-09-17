import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BrandingProvider } from './contexts/BrandingContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrandingProvider>
        <App />
      </BrandingProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// Register Service Worker for PWA / PWABuilder compatibility
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignored in non-supporting environments
    });
  });
}

