import React from 'react';
import { useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { AppRoutes } from './routes.jsx';
import { ToastProvider } from './hooks/useToast.jsx';
import { ErrorBoundary } from './components/shared/ErrorBoundary.jsx';

export function App() {
  const location = useLocation();

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';
  const isPrintRoute = location.pathname.includes('/itinerary/print');
  const hideNavAndFooter = isAuthRoute || isPrintRoute;

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppShell hideNav={hideNavAndFooter} hideFooter={hideNavAndFooter}>
          <AppRoutes />
        </AppShell>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
