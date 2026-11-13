import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// When running inside the packaged Android APK (WebViewAssetLoader or file://),
// route relative /api/* requests to the hosted MasterWave backend.
const CLOUD_API_ORIGIN = 'https://ais-pre-pgqvq5vmd4olrc22hnug6t-166224213200.asia-southeast1.run.app';
if (
  typeof window !== 'undefined' &&
  (window.location.hostname === 'appassets.androidplatform.net' ||
    window.location.protocol === 'file:')
) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return originalFetch(`${CLOUD_API_ORIGIN}${input}`, init);
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator && window.location.hostname !== 'appassets.androidplatform.net') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // ignore registration failures in restricted environments
    });
  });
}
