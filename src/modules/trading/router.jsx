import { forwardRef, useCallback, useMemo } from 'react';
import {
  Link as BaseLink,
  Navigate as BaseNavigate,
  NavLink as BaseNavLink,
  useLocation as useBaseLocation,
  useNavigate as useBaseNavigate,
} from 'react-router-dom';
import { stripTradingBase, tradingPath } from '../../shared/config.js';

export { Outlet, Route, Routes, useParams, useSearchParams } from 'react-router-dom';

function withBase(to) {
  if (typeof to === 'string') return to.startsWith('/') ? tradingPath(to) : to;
  if (to && typeof to === 'object' && typeof to.pathname === 'string' && to.pathname.startsWith('/')) {
    return { ...to, pathname: tradingPath(to.pathname) };
  }
  return to;
}

export const Link = forwardRef(function Link({ to, ...props }, ref) {
  return <BaseLink ref={ref} to={withBase(to)} {...props} />;
});

export const NavLink = forwardRef(function NavLink({ to, ...props }, ref) {
  return <BaseNavLink ref={ref} to={withBase(to)} {...props} />;
});

export function Navigate({ to, ...props }) {
  return <BaseNavigate to={withBase(to)} {...props} />;
}

export function useNavigate() {
  const navigate = useBaseNavigate();
  return useCallback((to, options) => (typeof to === 'number' ? navigate(to) : navigate(withBase(to), options)), [navigate]);
}

export function useLocation() {
  const location = useBaseLocation();
  return useMemo(() => ({ ...location, pathname: stripTradingBase(location.pathname) }), [location]);
}
