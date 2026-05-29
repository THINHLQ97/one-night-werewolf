import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './styles/index.css';

// ─── Asset protection: disable right-click, devtools shortcuts, image drag ───
if (import.meta.env.PROD) {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Block common devtools shortcuts
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') { e.preventDefault(); return; }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
    if (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) { e.preventDefault(); return; }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key.toUpperCase() === 'U') { e.preventDefault(); return; }
    // Ctrl+S (Save Page)
    if (e.ctrlKey && !e.shiftKey && e.key.toUpperCase() === 'S') { e.preventDefault(); return; }
  });

  // Disable drag on all images
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
