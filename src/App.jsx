import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { isTradingPath, TRADING_BASE_PATH } from './shared/config.js';
import { migrateEducationStorage, migrateTradingStorage } from './shared/legacyStorage.js';

const isTrading = isTradingPath(window.location.pathname);

// Cada plataforma trae su propia hoja de estilos global, por eso solo se carga
// la que corresponde a la URL: se separan en dos chunks y nunca conviven.
if (isTrading) migrateTradingStorage(TRADING_BASE_PATH);
else migrateEducationStorage();

const TradingApp = lazy(() => import('./modules/trading/TradingApp.jsx'));
const EducationApp = lazy(() => import('./modules/education/EducationApp.jsx'));

export default function App() {
  const { pathname, search, hash } = useLocation();

  if (isTradingPath(pathname) !== isTrading) {
    window.location.replace(`${pathname}${search}${hash}`);
    return null;
  }

  return (
    <Suspense fallback={null}>
      {isTrading ? (
        <Routes>
          <Route path={`${TRADING_BASE_PATH}/*`} element={<TradingApp />} />
        </Routes>
      ) : (
        <EducationApp />
      )}
    </Suspense>
  );
}
