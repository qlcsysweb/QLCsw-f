import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useAsync } from './useAsync.js';

export function usePeriodSummary() {
  const { api, period } = useWorkspace();
  const res = useAsync(() => api.get(`/periods/${period.id}/summary`), [api, period?.id], { enabled: !!period });
  return { ...res, summary: res.data?.summary || null, period };
}
