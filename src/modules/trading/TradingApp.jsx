import { useState } from 'react';
import { Routes, Route, Navigate } from './router.jsx';
import { applyDocumentHead } from '../../shared/documentHead.js';
import { languagePromptPending } from '../../shared/languageChoice.js';
import './styles/theme.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import UpdateBanner from './components/UpdateBanner';
import WelcomeLanguageGate from './i18n/WelcomeLanguageGate';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PasswordResetPage from './pages/PasswordResetPage';
import TwoFactorSetupPage from './pages/TwoFactorSetupPage';
import RegisterPage from './pages/RegisterPage';
import PublicHomePage from './modules/public/PublicHomePage';
import PrivacyPolicyPage from './modules/public/PrivacyPolicyPage';
import TermsOfServicePage from './modules/public/TermsOfServicePage';

import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './modules/admin/DashboardPage';
import ClientsListPage from './modules/admin/ClientsListPage';
import ClientDetailPage from './modules/admin/ClientDetailPage';
import AdminSubaccountDetailPage from './modules/admin/SubaccountDetailPage';
import AdminAppointmentsPage from './modules/admin/AppointmentsPage';
import AdminSupportPage from './modules/admin/SupportPage';
import ProspectsPage from './modules/admin/ProspectsPage';
import AdminsPage from './modules/admin/AdminsPage';
import CmsPage from './modules/admin/cms/CmsPage';
import TrackRecordPage from './modules/admin/TrackRecordPage';
import GoogleDriveSettingsPage from './modules/admin/settings/GoogleDriveSettingsPage';
import EmailSettingsPage from './modules/admin/settings/EmailSettingsPage';
import PlatformSettingsPage from './modules/admin/PlatformSettingsPage';
import AdminGuidesPage from './modules/admin/GuidesPage';
import ProcessStepsPage from './modules/admin/ProcessStepsPage';
import AdminNotificationsPage from './modules/admin/NotificationsPage';
import SubaccountAuditPage from './modules/admin/SubaccountAuditPage';
import AdminAffiliatesPage from './modules/admin/AffiliatesPage';
import AdminAffiliateDetailPage from './modules/admin/AffiliateDetailPage';

import ClientLayout from './layouts/ClientLayout';
import ClientDashboardPage from './modules/client/DashboardPage';
import ClientProfilePage from './modules/client/ProfilePage';
import ClientSubaccountsPage from './modules/client/SubaccountsPage';
import ClientSubaccountDetailPage from './modules/client/SubaccountDetailPage';
import ClientSupportPage from './modules/client/SupportPage';
import ClientNotificationsPage from './modules/client/NotificationsPage';
import ClientGuidesPage from './modules/client/GuidesPage';
import ClientAffiliatePage from './modules/client/AffiliatePage';

const DESCRIPTION = 'QLC es una estrategia de bot trading institucional que ejecuta una estrategia cuantitativa directamente en la cuenta del cliente mediante tecnología propia y una conexión API autorizada. Accesible desde 100 USDT.';

applyDocumentHead({
  title: 'Quantum Liquidity Capital — Bot Trading Institucional',
  icon: '/favicon.png',
  names: { description: DESCRIPTION },
  properties: {
    'og:type': 'website',
    'og:title': 'Quantum Liquidity Capital — Bot Trading Institucional',
    'og:description': 'Trading institucional accesible desde 100 USDT. El capital permanece en tu propia cuenta del exchange — QLC ejecuta la estrategia mediante una conexión API autorizada.',
    'og:image': '/favicon.png',
  },
});

function AppRoutes() {
  const { hasChosenLanguage } = useLanguage();

  const [promptPending, setPromptPending] = useState(languagePromptPending);

  if (!hasChosenLanguage || promptPending) return <WelcomeLanguageGate onDone={() => setPromptPending(false)} />;

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
          <Route path="/faq-affiliate-program" element={<PublicHomePage />} />
          <Route path="/contacto" element={<PublicHomePage />} />
          <Route path="/privacidad" element={<PrivacyPolicyPage />} />
          <Route path="/terminos" element={<TermsOfServicePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/restablecer-contrasena" element={<PasswordResetPage />} />
          <Route path="/seguridad-2fa" element={<TwoFactorSetupPage />} />
          <Route path="/registro" element={<RegisterPage />} />

          <Route element={<ProtectedRoute role="ADMIN" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="clients" element={<ClientsListPage />} />
              <Route path="messages" element={<Navigate to="/admin" replace />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="clients/:clientId/api-subaccounts/:id" element={<AdminSubaccountDetailPage />} />
              <Route path="cms" element={<CmsPage />} />
              <Route path="track-record" element={<TrackRecordPage />} />
              <Route path="guides" element={<AdminGuidesPage />} />
              <Route path="settings/drive" element={<GoogleDriveSettingsPage />} />
              <Route path="settings/email" element={<EmailSettingsPage />} />
              <Route path="settings/platform" element={<PlatformSettingsPage />} />
              <Route path="settings/process-steps" element={<ProcessStepsPage />} />
              <Route path="appointments" element={<AdminAppointmentsPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="prospects" element={<ProspectsPage />} />
              <Route path="admins" element={<AdminsPage />} />
              <Route path="subaccounts-audit" element={<SubaccountAuditPage />} />
              <Route path="affiliates" element={<AdminAffiliatesPage />} />
              <Route path="affiliates/:clientId" element={<AdminAffiliateDetailPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="CLIENT" />}>
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<ClientDashboardPage />} />
              <Route path="profile" element={<ClientProfilePage />} />
              <Route path="api-subaccounts" element={<ClientSubaccountsPage />} />
              <Route path="api-subaccounts/:id" element={<ClientSubaccountDetailPage />} />
              {/* Ya no se pide identificación oficial (QLC es un software): Documentos redirige al inicio. */}
              <Route path="documents" element={<Navigate to="/client" replace />} />
              <Route path="messages" element={<Navigate to="/client" replace />} />
              <Route path="guides" element={<ClientGuidesPage />} />
              <Route path="affiliates" element={<ClientAffiliatePage />} />
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
    <LanguageProvider>
      <AppRoutes />
      <UpdateBanner />
    </LanguageProvider>
  );
}
