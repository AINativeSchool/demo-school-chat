import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { showBootSplashError } from './bootSplash';
import { BootGate } from './components/BootGate';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) {
  showBootSplashError('The app shell is missing. Try refreshing the page.');
} else {
  try {
    createRoot(root).render(
      <StrictMode>
        <ErrorBoundary>
          <BootGate>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <App />
            </BrowserRouter>
          </BootGate>
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error('School Chat failed to start:', error);
    showBootSplashError('The app failed to start. Try refreshing the page.');
  }
}
