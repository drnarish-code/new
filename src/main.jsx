import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

function mountApp() {
  var rootElement = document.getElementById('root');

  // If DOM parser hasn't loaded container, dynamically generate it to avoid crash
  if (!rootElement) {
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}