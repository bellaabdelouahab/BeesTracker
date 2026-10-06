import { useCallback, useEffect, useRef, useState } from 'react';

/** Fetches with `fn`, keeps the previous data while refetching, optionally polls every `interval` seconds. */
export default function useApi(fn, deps = [], { interval = 0, enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const ref = useRef(fn);
  ref.current = fn;
  const run = useCallback(async (silent) => {
    if (!silent) setState((s) => ({ ...s, loading: true }));
    try { setState({ data: await ref.current(), error: null, loading: false }); } catch (e) { setState((s) => ({ data: s.data, error: e, loading: false })); }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (enabled) run(false); }, [enabled, run, ...deps]);
  useEffect(() => {
    if (!interval || !enabled) return undefined;
    const t = setInterval(() => run(true), interval * 1000);
    return () => clearInterval(t);
  }, [interval, enabled, run]);
  return { ...state, reload: () => run(true) };
}
