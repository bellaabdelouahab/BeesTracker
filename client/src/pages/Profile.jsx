import { PageHead, Panel, Seg, Switch } from '../components/ui';
import { useAuth } from '../context/Auth';
import { usePrefs } from '../context/Prefs';

const Row = ({ title, hint, children }) => (
  <div className="row between top" style={{ padding: '14px 0', borderBottom: '1px dotted var(--line-strong)', gap: 20 }}>
    <div style={{ maxWidth: 380 }}><b>{title}</b><div className="muted small">{hint}</div></div><div>{children}</div>
  </div>
);

export default function Profile() {
  const { user, isAdmin } = useAuth();
  const prefs = usePrefs();
  return (
    <div className="page">
      <PageHead title="Profile" sub="Preferences are stored in this browser only." />
      <div className="grid side">
        <Panel title="Preferences">
          <Row title="Units" hint="Metric: °C and kg. Imperial: °F and lb."><Seg value={prefs.units} onChange={(units) => prefs.set({ units })} options={[{ value: 'metric', label: '°C · kg' }, { value: 'imperial', label: '°F · lb' }]} /></Row>
          <Row title="Refresh interval" hint="How often lists and charts reload. Live values always update immediately."><select className="select" value={prefs.refresh} onChange={(e) => prefs.set({ refresh: Number(e.target.value) })} aria-label="Refresh interval">{[10, 20, 30, 60].map((s) => <option key={s} value={s}>every {s} s</option>)}</select></Row>
          <Row title="Pop-up alerts" hint="Show a notification when an alert opens or closes."><Switch on={prefs.toasts} onChange={(toasts) => prefs.set({ toasts })} label="Pop-up alerts" /></Row>
        </Panel>
        <Panel title="Account">
          <div className="row" style={{ gap: 14 }}>
            <div style={{ width: 54, height: 54, background: 'var(--ink)', color: 'var(--amber)', display: 'grid', placeItems: 'center', font: '700 26px var(--display)', clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)' }}>{(user.name || user.email)[0].toUpperCase()}</div>
            <div><b style={{ font: '600 20px var(--display)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{user.name}</b><div className="muted small">{user.email}</div><span className="tag amber" style={{ marginTop: 6 }}>{user.role}</span></div>
          </div>
          <p className="faint small" style={{ marginTop: 14 }}>{isAdmin ? 'Administrators can control the simulator.' : 'You can view every apiary, log inspections and edit hive limits.'}</p>
        </Panel>
      </div>
    </div>
  );
}
