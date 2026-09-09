import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import WelcomeLanguageGate from './i18n/WelcomeLanguageGate';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PublicHomePage from './modules/public/PublicHomePage';

import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './modules/admin/DashboardPage';
import ClientsListPage from './modules/admin/ClientsListPage';
import ClientDetailPage from './modules/admin/ClientDetailPage';
import AdminPaymentsPage from './modules/admin/PaymentsPage';
import AdminAppointmentsPage from './modules/admin/AppointmentsPage';
import AdminSupportPage from './modules/admin/SupportPage';
import ProspectsPage from './modules/admin/ProspectsPage';
import AdminsPage from './modules/admin/AdminsPage';
import CmsPage from './modules/admin/cms/CmsPage';
import GoogleDriveSettingsPage from './modules/admin/settings/GoogleDriveSettingsPage';

import ClientLayout from './layouts/ClientLayout';
import ClientDashboardPage from './modules/client/DashboardPage';
import ClientProfilePage from './modules/client/ProfilePage';
import ClientModelsPage from './modules/client/ModelsPage';
import ClientProcessPage from './modules/client/ProcessPage';
import ClientContractPage from './modules/client/ContractPage';
import ClientDocumentsPage from './modules/client/DocumentsPage';
import ClientPaymentsPage from './modules/client/PaymentsPage';
import ClientSupportPage from './modules/client/SupportPage';
import ClientAppointmentsPage from './modules/client/AppointmentsPage';
import ClientNotificationsPage from './modules/client/NotificationsPage';

function AppRoutes() {
  const { hasChosenLanguage } = useLanguage();

  if (!hasChosenLanguage) return <WelcomeLanguageGate />;

  return (
    <AuthProvider>
      <Routes>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute role="ADMIN" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="clients" element={<ClientsListPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="cms" element={<CmsPage />} />
              <Route path="settings/drive" element={<GoogleDriveSettingsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="appointments" element={<AdminAppointmentsPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="prospects" element={<ProspectsPage />} />
              <Route path="admins" element={<AdminsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="CLIENT" />}>
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<ClientDashboardPage />} />
              <Route path="profile" element={<ClientProfilePage />} />
              <Route path="models" element={<ClientModelsPage />} />
              <Route path="process" element={<ClientProcessPage />} />
              <Route path="contract" element={<ClientContractPage />} />
              <Route path="documents" element={<ClientDocumentsPage />} />
              <Route path="payments" element={<ClientPaymentsPage />} />
              <Route path="support" element={<ClientSupportPage />} />
              <Route path="appointments" element={<ClientAppointmentsPage />} />
              <Route path="notifications" element={<ClientNotificationsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppRoutes />
      </LanguageProvider>
    </BrowserRouter>
  );
}
