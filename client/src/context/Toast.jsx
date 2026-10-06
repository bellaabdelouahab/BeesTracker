import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Hexagon } from 'lucide-react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const dismiss = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((t) => {
    const id = `${Date.now()}${Math.random()}`;
    setItems((l) => [...l.slice(-3), { id, tone: 'info', ...t }]);
    setTimeout(() => dismiss(id), t.duration || 6500);
  }, [dismiss]);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`} onClick={() => dismiss(t.id)}>
            <Hexagon size={18} style={{ flex: 'none', marginTop: 2 }} />
            <div><b>{t.title}</b>{t.text && <p>{t.text}</p>}</div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
