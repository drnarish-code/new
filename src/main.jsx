import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Dynamically inject Tailwind CSS CDN to bypass bundle compiling errors on Vercel
if (!document.getElementById('tailwind-cdn')) {
  const script = document.createElement('script');
  script.id = 'tailwind-cdn';
  script.src = 'https://cdn.tailwindcss.com';
  document.head.appendChild(script);
}

// Dynamically inject the premium Inter Google Font
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