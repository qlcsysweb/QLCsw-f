import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { WorkspaceProvider } from '../context/WorkspaceContext.jsx';
import { AppLayout } from '../layouts/AppLayout.jsx';
import { AdminClientWorkspace, AdminLayout } from '../layouts/AdminLayout.jsx';
import { AuthLayout } from '../layouts/PublicLayout.jsx';
import { Empty, Loading } from '../components/ui/States.jsx';
import { RequireAuth } from './guards.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import PublicExperience from '../pages/public/experience/PublicExperience.jsx';
import { ForgotPassword, Login, Register, TwoFactorSetup } from '../pages/public/AuthPages.jsx';

const page = (loader) => lazy(loader);

const PRIVATE_PAGES = [
  ['', page(() => import('../pages/app/Dashboard.jsx'))],
  ['academia', page(() => import('../pages/app/academy/AcademyHome.jsx'))],
  ['academia/m/:n', page(() => import('../pages/app/academy/ModulePage.jsx'))],
  ['academia/ruta', page(() => import('../pages/app/academy/RoutePage.jsx'))],
  ['academia/filtro', page(() => import('../pages/app/academy/MarketFilterPage.jsx'))],
  ['acceso', page(() => import('../pages/app/AccessPage.jsx'))],
  ['masterclass', page(() => import('../pages/app/MasterclassPage.jsx'))],
  ['masterclass/:n', page(() => import('../pages/app/MasterclassPage.jsx'))],
  ['cartera', page(() => import('../pages/app/Portfolio.jsx'))],
  ['cartera/:assetId', page(() => import('../pages/app/AssetDetail.jsx'))],
  ['patrimonio', page(() => import('../pages/app/Patrimony.jsx'))],
  ['ingresos-gastos', page(() => import('../pages/app/CashFlow.jsx'))],
  ['proteccion', page(() => import('../pages/app/Protection.jsx'))],
  ['deudas', page(() => import('../pages/app/Debts.jsx'))],
  ['negocios', page(() => import('../pages/app/Business.jsx'))],
  ['allocation', page(() => import('../pages/app/Allocation.jsx'))],
  ['movimientos', page(() => import('../pages/app/Movements.jsx'))],
  ['cortes', page(() => import('../pages/app/Closes.jsx'))],
  ['informe-anual', page(() => import('../pages/app/AnnualReport.jsx'))],
  ['asesoria', page(() => import('../pages/app/Advisory.jsx'))],
];

const ADMIN_PAGES = [
  ['', page(() => import('../pages/admin/AdminDashboard.jsx'))],
  ['solicitudes', page(() => import('../pages/admin/AdminLeads.jsx'))],
  ['aviso-copytrading', page(() => import('../pages/admin/AdminLoginNotice.jsx'))],
  ['ejercicios', page(() => import('../pages/admin/AdminExercises.jsx'))],
  ['clientes', page(() => import('../pages/admin/AdminClients.jsx'))],
  ['clientes/:clientId', page(() => import('../pages/admin/AdminClientDetail.jsx'))],
  ['precios', page(() => import('../pages/admin/AdminPricing.jsx'))],
  ['pagos', page(() => import('../pages/admin/AdminPayments.jsx'))],
  ['archivos', page(() => import('../pages/admin/AdminModuleFiles.jsx'))],
  ['integraciones', page(() => import('../pages/admin/AdminIntegrations.jsx'))],
  ['pasarela', page(() => import('../pages/admin/AdminGateway.jsx'))],
  ['citas', page(() => import('../pages/admin/AdminAppointments.jsx'))],
  ['equipo', page(() => import('../pages/admin/AdminTeam.jsx'))],
  ['suscriptores', page(() => import('../pages/admin/AdminSubscribers.jsx'))],
  ['control-accesos', page(() => import('../pages/admin/AdminAccessControl.jsx'))],
  ['regalos', page(() => import('../pages/admin/AdminGifts.jsx'))],
];

const routesFor = (pages) =>
  pages.map(([path, Page]) => (path === '' ? <Route key="index" index element={<Page />} /> : <Route key={path} path={path} element={<Page />} />));

const LegalPage = page(() => import('../pages/public/legal/LegalPage.jsx'));
const TradingAcademy = page(() => import('../pages/public/marketing/TradingAcademy.jsx'));
const QlcHome = page(() => import('../pages/public/marketing/QlcHome.jsx'));
const RedeemPage = page(() => import('../pages/public/RedeemPage.jsx'));

function NotFound() {
  const { t } = useI18n();
  return <Empty title={t('app.notFoundTitle')} text={t('app.notFoundText')} />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<QlcHome />} />
        <Route path="/educacion-financiera" element={<PublicExperience />} />
        <Route path="/trading-academy" element={<TradingAcademy />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar" element={<ForgotPassword />} />
          <Route path="/seguridad/2fa" element={<TwoFactorSetup />} />
          <Route path="/regalo" element={<RedeemPage />} />
          <Route path="/privacidad" element={<LegalPage doc="privacidad" />} />
          <Route path="/terminos" element={<LegalPage doc="terminos" />} />
        </Route>

        <Route path="/app" element={<RequireAuth role="CLIENT"><WorkspaceProvider><AppLayout /></WorkspaceProvider></RequireAuth>}>
          {routesFor(PRIVATE_PAGES)}
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/clientes/:clientId/app" element={<RequireAuth role="ADMIN"><AdminClientWorkspace /></RequireAuth>}>
          {routesFor(PRIVATE_PAGES.filter(([p]) => p !== 'acceso'))}
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin" element={<RequireAuth role="ADMIN"><AdminLayout /></RequireAuth>}>
          {routesFor(ADMIN_PAGES)}
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
