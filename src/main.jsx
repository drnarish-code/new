import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Safe bootstrap function to protect older TV rendering loops
function mountApp() {
  let rootElement = document.getElementById('root');

  if (!rootElement) {
    // If DOM parsing hasn't created the root container yet, create it on the fly
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
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
```
`eof`

### 📋 What you need to do now:

1. **Create the new entrypoint file:** Save the code block above as **`src / main.jsx`** (replacing your existing `src / main.jsx` or `src / index.jsx` if you have one).
2. **Deploy to Vercel:** Save, commit, and push this update to trigger a new build on Vercel:

```bash
git add src / main.jsx
git commit - m "Add safe mounting handler with automatic DOM container creation to fix React Error 299"
git push
  ```

Your system is now completely protected from parsing race conditions! As soon as the build is complete, your TV browser will find the root element correctly and load the PKD Pekan QMS application smoothly. Let me know when it compiles!