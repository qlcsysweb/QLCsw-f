import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import WelcomeLanguageGate from './i18n/WelcomeLanguageGate';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PublicHomePage from './modules/public/PublicHomePage';
import PrivacyPolicyPage from './modules/public/PrivacyPolicyPage';
import TermsOfServicePage from './modules/public/TermsOfServicePage';

import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './modules/admin/DashboardPage';
import ClientsListPage from './modules/admin/ClientsListPage';
import ClientDetailPage from './modules/admin/ClientDetailPage';
import AdminSubaccountDetailPage from './modules/admin/SubaccountDetailPage';
import AdminPaymentsPage from './modules/admin/PaymentsPage';
import AdminAppointmentsPage from './modules/admin/AppointmentsPage';
import AdminSupportPage from './modules/admin/SupportPage';
import ProspectsPage from './modules/admin/ProspectsPage';
import AdminsPage from './modules/admin/AdminsPage';
import CmsPage from './modules/admin/cms/CmsPage';
import TrackRecordPage from './modules/admin/TrackRecordPage';
import GoogleDriveSettingsPage from './modules/admin/settings/GoogleDriveSettingsPage';
import EmailSettingsPage from './modules/admin/settings/EmailSettingsPage';
import SecuritySettingsPage from './modules/admin/settings/SecuritySettingsPage';
import PlatformSettingsPage from './modules/admin/PlatformSettingsPage';
import AdminGuidesPage from './modules/admin/GuidesPage';
import ProcessStepsPage from './modules/admin/ProcessStepsPage';
import AdminNotificationsPage from './modules/admin/NotificationsPage';
import SubaccountAuditPage from './modules/admin/SubaccountAuditPage';

import ClientLayout from './layouts/ClientLayout';
import ClientDashboardPage from './modules/client/DashboardPage';
import ClientProfilePage from './modules/client/ProfilePage';
import ClientSubaccountsPage from './modules/client/SubaccountsPage';
import ClientSubaccountDetailPage from './modules/client/SubaccountDetailPage';
import ClientDocumentsPage from './modules/client/DocumentsPage';
import ClientSupportPage from './modules/client/SupportPage';
import ClientNotificationsPage from './modules/client/NotificationsPage';
import ClientGuidesPage from './modules/client/GuidesPage';

function AppRoutes() {
  const { hasChosenLanguage } = useLanguage();

  if (!hasChosenLanguage) return <WelcomeLanguageGate />;

  return (
    <AuthProvider>
      <Routes>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/modelo" element={<PublicHomePage />} />
          <Route path="/como-funciona" element={<PublicHomePage />} />
          <Route path="/tecnologia" element={<PublicHomePage />} />
          <Route path="/microposiciones" element={<PublicHomePage />} />
          <Route path="/el-problema" element={<PublicHomePage />} />
          <Route path="/modelos" element={<PublicHomePage />} />
          <Route path="/resultados" element={<PublicHomePage />} />
          <Route path="/seguridad" element={<PublicHomePage />} />
          <Route path="/sobre-qlc" element={<PublicHomePage />} />
          <Route path="/faq" element={<PublicHomePage />} />
          <Route path="/privacidad" element={<PrivacyPolicyPage />} />
          <Route path="/terminos" element={<TermsOfServicePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          <Route element={<ProtectedRoute role="ADMIN" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="clients" element={<ClientsListPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="clients/:clientId/api-subaccounts/:id" element={<AdminSubaccountDetailPage />} />
              <Route path="cms" element={<CmsPage />} />
              <Route path="track-record" element={<TrackRecordPage />} />
              <Route path="guides" element={<AdminGuidesPage />} />
              <Route path="settings/drive" element={<GoogleDriveSettingsPage />} />
              <Route path="settings/email" element={<EmailSettingsPage />} />
              <Route path="settings/platform" element={<PlatformSettingsPage />} />
              <Route path="settings/security" element={<SecuritySettingsPage />} />
              <Route path="settings/process-steps" element={<ProcessStepsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="appointments" element={<AdminAppointmentsPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="prospects" element={<ProspectsPage />} />
              <Route path="admins" element={<AdminsPage />} />
              <Route path="subaccounts-audit" element={<SubaccountAuditPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="CLIENT" />}>
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<ClientDashboardPage />} />
              <Route path="profile" element={<ClientProfilePage />} />
              <Route path="api-subaccounts" element={<ClientSubaccountsPage />} />
              <Route path="api-subaccounts/:id" element={<ClientSubaccountDetailPage />} />
              <Route path="documents" element={<ClientDocumentsPage />} />
              <Route path="guides" element={<ClientGuidesPage />} />
              {/* CORRECCIÓN 16 (bloque de 20) — "Citas" ya no es una ruta
                  independiente: se solicita desde dentro de un caso en
                  Soporte. Se conserva el redirect por si queda algún enlace
                  antiguo guardado. */}
              <Route path="support" element={<ClientSupportPage />} />
              <Route path="appointments" element={<Navigate to="/client/support" replace />} />
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
