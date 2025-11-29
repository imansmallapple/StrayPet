import { Inspector } from 'react-dev-inspector';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@/hooks/useAuth'
import 'bootstrap/dist/css/bootstrap.min.css';

// 公共样式
import '@/styles/scss/global.scss';

import App from './app.tsx';
import DevErrorOverlay from '@/components/DevErrorOverlay'

function setupApp() {
  // Global error catcher for development — help diagnose dynamic import failures
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('[GlobalError] error event:', event);
    });
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[GlobalError] unhandledrejection:', event.reason);
    });
  }
  // Render with a lightweight error overlay in dev mode to make runtime errors visible
  const root = document.getElementById('root')
  if (!root) {
    console.error('[main] root element not found')
    return
  }
  createRoot(root).render(
    <AuthProvider>
      <Inspector keys={['ctrl', 'alt', 'q']} />
      <App />
      <DevErrorOverlay />
    </AuthProvider>
  );
}

setupApp();
