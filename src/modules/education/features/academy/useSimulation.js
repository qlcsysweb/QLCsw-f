import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';

export function useSimulation(moduleNumber, initialInput, { auto = true } = {}) {
  const { api } = useWorkspace();
  const [input, setInput] = useState(initialInput);
  const [result, setResult] = useState(null);
  const [state, setState] = useState({ busy: false, error: null, savedAt: null });
  const history = useAsync(() => api.get(`/academy/modules/${moduleNumber}/simulations`), [api, moduleNumber]);
  const first = useRef(auto);

  const run = useCallback(async (save = false, values = input) => {
    setState((s) => ({ ...s, busy: true, error: null }));
    try {
      const res = await api.post(`/academy/modules/${moduleNumber}/simulate`, { input: values, save });
      setResult(res.result);
      setState({ busy: false, error: null, savedAt: save ? new Date() : null });
      if (save) history.reload();
      return res;
    } catch (error) {
      setState({ busy: false, error, savedAt: null });
      return null;
    }
  }, [api, moduleNumber, input, history]);

  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    run(false, initialInput);
  }, [run, initialInput]);

  const set = (key, cast = (v) => v) => (e) => setInput((prev) => ({ ...prev, [key]: cast(e.target.value) }));

  return { input, setInput, set, result, run, ...state, history: history.data || [] };
}
