import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import theme from '@/theme/theme';
import '@/i18n';
import App from '@/App';
import { AuthProvider } from '@/context/auth/AuthContext';
import { installDevWarningSuppressor } from '@/utils/suppressKnownDevWarnings';

// Silences a small allow-list of known upstream React warnings in dev — no-op in prod.
installDevWarningSuppressor();

const queryClient = new QueryClient();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
