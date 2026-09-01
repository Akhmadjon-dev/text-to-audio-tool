import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './app/App.tsx';
import { applyStoredTheme } from './features/settings/theme.ts';
import './index.css';

// Apply persisted theme before first paint to avoid a flash.
applyStoredTheme();

// Register the service worker (auto-updates in the background).
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
