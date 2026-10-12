import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './demo-shell.css';
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
