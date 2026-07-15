import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Safe bootstrap function to protect older TV rendering engines
function mountApp() {
  var rootElement = document.getElementById('root');

  if (!rootElement) {
    // If DOM parsing hasn't created the root container yet, create it on the fly
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }

  try {
    var root = ReactDOM.createRoot(rootElement);
    root.render(React.createElement(App, null));
  } catch (error) {
    console.error("React safe mounting container failure:", error);
  }
}

// Check current DOM parsing status to prevent racing condition crashes
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}