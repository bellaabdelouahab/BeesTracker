import { createContext, useContext, useEffect, useMemo } from 'react';
import useApi from '../lib/useApi';
import { api } from '../api';
import { useAuth } from './Auth';
import { useLive } from './Live';
import { usePrefs } from './Prefs';

const Ctx = createContext(null);
export const useData = () => useContext(Ctx);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const { alertTick } = useLive();
  const { refresh } = usePrefs();
  const q = useApi(() => api.overview(), [], { interval: refresh, enabled: !!user });
  const { reload } = q;
  useEffect(() => { if (alertTick) reload(); }, [alertTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const value = useMemo(() => q, [q.data, q.error, q.loading]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** newest streamed reading laid over the stored one, so numbers move without a refetch */
export const withLive = (hive, latest) => {
  const r = latest[hive.id];
  if (!r || (hive.last && r.createdAt < hive.last.createdAt)) return hive;
  const { createdAt, status, temperature, humidity, weight, lid, activity, sound, battery, rssi } = r;
  return { ...hive, status: hive.status === 'offline' ? 'online' : hive.status, last: { createdAt, status, temperature, humidity, weight, lid, activity, sound, battery, rssi } };
};
