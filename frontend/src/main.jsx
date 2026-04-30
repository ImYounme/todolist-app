import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.jsx';

// Apply dark mode on init
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.classList.add('dark');
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('React root element #root was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
