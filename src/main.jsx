import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Suntikan dinamik bagi mengelakkan ralat kompilasi CSS di Vercel
if (!document.getElementById('qms-global-resets')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'qms-global-resets';
  styleElement.textContent = `
    body {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #020617 !important;
      color: #f8fafc;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #020617;
    }
    ::-webkit-scrollbar-thumb {
      background: #1e293b;
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #334155;
    }
  `;
  document.head.appendChild(styleElement);
}

if (!document.getElementById('tailwind-cdn')) {
  const script = document.createElement('script');
  script.id = 'tailwind-cdn';
  script.src = 'https://cdn.tailwindcss.com';
  document.head.appendChild(script);
}

if (!document.getElementById('inter-font-cdn')) {
  const link = document.createElement('link');
  link.id = 'inter-font-cdn';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
  document.head.appendChild(link);
}

const mountApp = () => {
  const rootElement = document.getElementById('root') || (() => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
    return root;
  })();

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}