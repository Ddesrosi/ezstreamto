import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#040B14]">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <App />
      </Suspense>
    </HelmetProvider>
  </StrictMode>
);