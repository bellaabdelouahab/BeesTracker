import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../api';
import { useAuth } from './Auth';
import { usePrefs } from './Prefs';
import { useToast } from './Toast';

const Ctx = createContext(null);
export const useLive = () => useContext(Ctx);
const MAX_FEED = 300;

/** One socket for the whole app. `latest` = newest reading per hive, `feed` = rolling list, `alertTick` bumps on every alert change. */
export function LiveProvider({ children }) {
  const { user } = useAuth();
  const { toasts } = usePrefs();
  const toast = useToast();
  const [status, setStatus] = useState('connecting');
  const [latest, setLatest] = useState({});
  const [feed, setFeed] = useState([]);
  const [alertTick, setAlertTick] = useState(0);
  const [rate, setRate] = useState(0);
  const stamps = useRef([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;
  const seq = useRef(0);

  useEffect(() => {
    if (!user) return undefined;
    const socket = io({ auth: { token: getToken() }, transports: ['websocket'], reconnectionDelay: 1000, reconnectionDelayMax: 8000 });
    socket.on('connect', () => setStatus('live'));
    socket.on('disconnect', () => setStatus('offline'));
    socket.on('connect_error', () => setStatus('offline'));
    socket.on('reading', (r) => {
      const row = { ...r, _id: ++seq.current };
      setLatest((m) => ({ ...m, [r.hiveId]: row }));
      setFeed((f) => [row, ...f].slice(0, MAX_FEED));
      const now = Date.now();
      stamps.current = [...stamps.current.filter((t) => now - t < 60000), now];
      setRate(stamps.current.length);
    });
    socket.on('notification', ({ kind, notification, hiveName }) => {
      setAlertTick((n) => n + 1);
      if (!toastsRef.current) return;
      if (kind === 'new') toast.push({ tone: notification.severity === 'critical' ? 'crit' : 'warn', title: `${hiveName} · ${notification.type.replace(/_/g, ' ')}`, text: notification.content });
      else toast.push({ tone: 'ok', title: `${hiveName} back to normal`, text: notification.type.replace(/_/g, ' ') });
    });
    return () => socket.close();
  }, [user, toast]);

  useEffect(() => {
    const t = setInterval(() => { const now = Date.now(); stamps.current = stamps.current.filter((x) => now - x < 60000); setRate(stamps.current.length); }, 5000);
    return () => clearInterval(t);
  }, []);

  const value = useMemo(() => ({ status, latest, feed, alertTick, rate }), [status, latest, feed, alertTick, rate]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
