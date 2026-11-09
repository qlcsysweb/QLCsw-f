import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync(fn, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const seq = useRef(0);

  const run = useCallback(async () => {
    if (!enabled) return setState({ data: null, error: null, loading: false });
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (id === seq.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === seq.current) setState({ data: null, error, loading: false });
    }

  }, [...deps, enabled]);

  useEffect(() => { run(); }, [run]);

  return { ...state, reload: run };
}
