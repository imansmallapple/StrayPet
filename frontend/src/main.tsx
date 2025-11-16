import { Inspector } from 'react-dev-inspector';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@/hooks/useAuth'
import 'bootstrap/dist/css/bootstrap.min.css';

// 公共样式
import '@/styles/scss/global.scss';

import App from './app.tsx';

function setupApp() {
  createRoot(document.getElementById('root')!).render(
  <AuthProvider>
      <Inspector keys={['ctrl', 'alt', 'q']} />
      <App />
  </AuthProvider>
  );
}

setupApp();
