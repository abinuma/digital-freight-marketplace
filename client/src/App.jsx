import './App.css';
import './shared/components/components.css';
import './features/auth/auth-pages.css';
import './features/profile/profile.css';
import './features/shipper/shipper.css';
import 'leaflet/dist/leaflet.css';
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
import { ShipperLayout } from './features/shipper/ShipperLayout.jsx';
import { ShipperDashboardPage } from './features/shipper/pages/ShipperDashboardPage.jsx';
import { ShipmentListPage } from './features/shipper/pages/ShipmentListPage.jsx';
import { ShipmentFormPage } from './features/shipper/pages/ShipmentFormPage.jsx';
import { ShipmentDetailPage } from './features/shipper/pages/ShipmentDetailPage.jsx';
import './features/transporter/transporter.css';
import './features/notifications/notifications.css';
import './features/messaging/messaging.css';
import './shared/components/maps/maps.css';
import { TransporterLayout } from './features/transporter/TransporterLayout.jsx';
import { TransporterDashboardPage } from './features/transporter/pages/TransporterDashboardPage.jsx';
import { ShipmentDiscoveryPage } from './features/transporter/pages/ShipmentDiscoveryPage.jsx';
import { MyBidsPage } from './features/transporter/pages/MyBidsPage.jsx';
import { ShipmentDetailPage as TransporterShipmentDetailPage } from './features/transporter/pages/ShipmentDetailPage.jsx';
import { NetworkErrorToaster } from './shared/components/NetworkErrorToaster.jsx';

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
                <Route path="/shipper" element={<ShipperLayout />}>
                  <Route index element={<ShipperDashboardPage />} />
                  <Route path="shipments" element={<ShipmentListPage />} />
                  <Route path="shipments/new" element={<ShipmentFormPage />} />
                  <Route path="shipments/:id" element={<ShipmentDetailPage />} />
                  <Route path="shipments/:id/edit" element={<ShipmentFormPage />} />
                </Route>
              </Route>
              <Route element={<RequireRole roles="TRANSPORTER" />}>
                <Route path="/transporter" element={<TransporterLayout />}>
                  <Route index element={<TransporterDashboardPage />} />
                  <Route path="shipments" element={<ShipmentDiscoveryPage />} />
                  <Route path="shipments/:id" element={<TransporterShipmentDetailPage />} />
                  <Route path="bids" element={<MyBidsPage />} />
                </Route>
              </Route>
              <Route element={<RequireRole roles="ADMIN" />}>
                <Route path="/admin/*" element={<AuthGate />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <NetworkErrorToaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
