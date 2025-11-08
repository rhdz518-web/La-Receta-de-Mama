import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Vite's base path needs to be considered for the SW path in production
    // FIX: Cast `import.meta` to `any` to resolve TypeScript error about missing `env` property.
    const swUrl = `${(import.meta as any).env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}