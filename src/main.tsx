import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket / HMR connection errors in the sandbox environment
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason === 'WebSocket closed without opened.' ||
      (reason && typeof reason === 'string' && (reason.includes('WebSocket') || reason.includes('websocket'))) ||
      (reason && reason.message && (reason.message.includes('WebSocket') || reason.message.includes('websocket')))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message;
    if (msg && (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('ws://') || msg.includes('wss://'))) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

