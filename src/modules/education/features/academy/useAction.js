import { useCallback, useState } from 'react';

export function useAction() {
  const [state, setState] = useState({ busy: false, error: null, saved: false });
  const run = useCallback(async (fn) => {
    setState({ busy: true, error: null, saved: false });
    try {
      const result = await fn();
      setState({ busy: false, error: null, saved: true });
      return result ?? true;
    } catch (error) {
      setState({ busy: false, error, saved: false });
      return null;
    }
  }, []);
  const reset = useCallback(() => setState({ busy: false, error: null, saved: false }), []);
  return { ...state, run, reset };
}
