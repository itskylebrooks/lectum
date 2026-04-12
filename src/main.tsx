import '@/shared/styles/index.css';
import AppErrorBoundary from '@/shared/components/errors/AppErrorBoundary';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import '@/shared/store/theme';

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      const checkInterval = import.meta.env.DEV ? 60 * 1000 : 60 * 60 * 1000;
      setInterval(() => {
        registration.update();
      }, checkInterval);
    }
  },
  onNeedRefresh() {
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);

requestAnimationFrame(() => {
  document.body.classList.remove('preload');
});
