import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n'

// Remove loading indicator once React takes over
const loadingEl = document.getElementById('app-loading');
if (loadingEl) {
  loadingEl.style.display = 'none';
}

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  console.error('Failed to render app:', error);
  // Show error in the fallback error UI
  const errorDiv = document.getElementById('app-error');
  if (errorDiv) {
    errorDiv.classList.add('show');
    const msgEl = document.getElementById('error-message');
    const stackEl = document.getElementById('error-stack');
    if (msgEl) msgEl.textContent = (error as Error)?.message || 'Render failed';
    if (stackEl) stackEl.textContent = (error as Error)?.stack || String(error);
  }
}
