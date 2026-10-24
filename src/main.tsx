import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import './styles.css';
import './visuals.css';
import './home.css';
import './upgrade.css';
import './today.css';
import './areas.css';
import './events.css';
import './city.css';
import './arena.css';
import { App } from './ui/App';
import { ErrorBoundary } from './ui/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Offline play and install-as-app (production builds only, so development never serves stale files).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // The game still works online without it.
    });
  });
}
