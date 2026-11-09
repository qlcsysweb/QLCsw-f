import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createApi } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const WorkspaceContext = createContext(null);
const LEVELS = { VIEW: 1, EDIT: 2, FULL: 3 };

const storeKey = (clientId) => `edu_period_${clientId || 'me'}`;
const readStored = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const writeStored = (k, v) => { try { localStorage.setItem(k, v); } catch { return undefined; } };

export function WorkspaceProvider({ clientId = null, client = null, children }) {
  const { user, hasAccess } = useAuth();
  const api = useMemo(() => createApi(clientId), [clientId]);
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState(null);
  const [state, setState] = useState({ loading: true, error: null });

  const reloadPeriods = useCallback(async (selectId) => {
    try {
      const list = await api.get('/periods');
      setPeriods(list);
      setPeriodId((current) => {
        const wanted = selectId || current || readStored(storeKey(clientId));
        return list.find((p) => p.id === wanted)?.id || list[0]?.id || null;
      });
      setState({ loading: false, error: null });
    } catch (error) {
      setState({ loading: false, error });
    }
  }, [api, clientId]);

  useEffect(() => {
    if (hasAccess) {
      setState((current) => ({ ...current, loading: true }));
      reloadPeriods();
    } else {
      setPeriods([]);
      setPeriodId(null);
      setState({ loading: false, error: null });
    }
  }, [hasAccess, reloadPeriods]);
  useEffect(() => { if (periodId) writeStored(storeKey(clientId), periodId); }, [periodId, clientId]);

  const isAdminView = user?.role === 'ADMIN';
  const value = useMemo(() => ({
    api,
    clientId,
    client,
    isAdminView,
    basePath: clientId ? `/admin/clientes/${clientId}/app` : '/app',
    canEdit: !isAdminView || ((LEVELS[user?.adminLevel] || 0) >= LEVELS.EDIT && !!client?.dataShare?.allowEdit),
    isFullAdmin: isAdminView && user?.adminLevel === 'FULL',
    periods,
    period: periods.find((p) => p.id === periodId) || null,
    selectPeriod: setPeriodId,
    reloadPeriods,
    periodsState: state,
  }), [api, clientId, client, isAdminView, user, periods, periodId, reloadPeriods, state]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export const useWorkspace = () => useContext(WorkspaceContext);
