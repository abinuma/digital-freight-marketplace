import './App.css';
import './shared/components/components.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { AuthGate } from './features/auth/AuthGate.jsx';
import { RequireAuth } from './features/auth/RequireAuth.jsx';
import { RequireRole } from './features/auth/RequireRole.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthGate />} />
            <Route element={<RequireAuth />}>
              <Route path="/complete-profile" element={<AuthGate />} />
              <Route element={<RequireRole roles="SHIPPER" />}>
                <Route path="/shipper/*" element={<AuthGate />} />
              </Route>
              <Route element={<RequireRole roles="TRANSPORTER" />}>
                <Route path="/transporter/*" element={<AuthGate />} />
              </Route>
              <Route element={<RequireRole roles="ADMIN" />}>
                <Route path="/admin/*" element={<AuthGate />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
