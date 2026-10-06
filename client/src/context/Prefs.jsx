import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const KEY = 'ibee.prefs';
const DEFAULTS = { units: 'metric', toasts: true, refresh: 20 };
const Ctx = createContext(null);
export const usePrefs = () => useContext(Ctx);

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(() => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return DEFAULTS; } });
  const set = useCallback((patch) => setPrefs((p) => {
    const n = { ...p, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(n)); } catch (e) { /* storage may be blocked */ }
    return n;
  }), []);
  const value = useMemo(() => ({ ...prefs, set }), [prefs, set]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
