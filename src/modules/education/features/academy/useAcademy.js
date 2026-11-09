import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';

export function useAcademy() {
  const { api } = useWorkspace();
  return useAsync(() => api.get('/academy'), [api]);
}

export function useModule(number) {
  const { api } = useWorkspace();
  return useAsync(() => api.get(`/academy/modules/${number}`), [api, number]);
}

export const modulePath = (basePath, n) => `${basePath}/academia/m/${n}`;
