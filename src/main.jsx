import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Safely inject the Tailwind CSS Engine at runtime to fix layout styling
if (typeof window !== 'undefined' && !document.getElementById('tailwind-cdn')) {
  var tailwindScript = document.createElement('script');
  tailwindScript.id = 'tailwind-cdn';
  tailwindScript.src = 'https://cdn.tailwindcss.com';

  // Configure Tailwind to scan dynamically loaded elements
  tailwindScript.onload = function () {
    if (window.tailwind) {
      window.tailwind.config = {
        theme: {
          extend: {}
        }
      };
    }
  };

  document.head.appendChild(tailwindScript);
}

function mountApp() {
  var rootElement = document.getElementById('root');

  // If the DOM hasn't fully registered the root element yet, generate it on-the-fly to prevent React Error #299
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }

  try {
    var root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(App, null));
  } catch (error) {
    console.error("React mounting pipeline failure:", error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}