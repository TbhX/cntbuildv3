import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './i18n'; // Import i18n configuration before App
import './index.css';

// Set document language attribute
document.documentElement.lang = 'fr-FR';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);