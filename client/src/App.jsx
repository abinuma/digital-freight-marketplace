import './App.css';
import './shared/components/components.css';
import './features/auth/auth-pages.css';
import './features/profile/profile.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { AuthGate } from './features/auth/AuthGate.jsx';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage.jsx';
import { LoginPage } from './features/auth/LoginPage.jsx';
import { PublicOnlyRoute } from './features/auth/PublicOnlyRoute.jsx';
import { RegistrationPage } from './features/auth/RegistrationPage.jsx';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage.jsx';
import { RequireAuth } from './features/auth/RequireAuth.jsx';
import { RequireRole } from './features/auth/RequireRole.jsx';
import { ProfilePage } from './features/profile/ProfilePage.jsx';

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
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="/complete-profile" element={<AuthGate />} />
              <Route path="/profile" element={<ProfilePage />} />
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
