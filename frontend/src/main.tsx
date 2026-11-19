import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './providers/AuthProvider.tsx';
import { QueryProvider } from './providers/QueryProvider.tsx';
import { RouterProvider } from './providers/RouterProvider.tsx';
import { AstryxThemeProvider } from './providers/ThemeProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AstryxThemeProvider>
      <QueryProvider>
        <RouterProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </RouterProvider>
      </QueryProvider>
    </AstryxThemeProvider>
  </StrictMode>,
);
