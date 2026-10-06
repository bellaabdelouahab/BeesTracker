import { useEffect, useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { Empty, ErrorBox, Kpi, PageHead, Panel, Seg, Skeleton } from '../components/ui';
import AlertRow from '../components/AlertRow';
import useApi from '../lib/useApi';
import useNow from '../lib/useNow';
import { api } from '../api';
import { useData } from '../context/Data';
import { useLive } from '../context/Live';
import { ALERT_TYPES } from '../lib/metrics';

export default function Alerts() {
  const { alertTick } = useLive();
  const { data: ov, reload: reloadOverview } = useData();
  const now = useNow(10000);
  const [status, setStatus] = useState('active');
  const [severity, setSeverity] = useState('');
  const [hive, setHive] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi(() => api.notifications({ status, severity, hive, page, limit: 15 }), [status, severity, hive, page], { interval: 20 });
  useEffect(() => { if (alertTick) reload(); }, [alertTick]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [status, severity, hive]);

  const refresh = () => { reload(); reloadOverview(); };
  const read = async (n) => { await api.markRead(n.id); refresh(); };
  const readAll = async () => { await api.readAll(); refresh(); };
  const hives = (ov?.farms || []).flatMap((f) => f.hives);
  const sum = data?.summary;
  if (error && !data) return <div className="page"><ErrorBox error={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHead title="Alerts" sub="Raised when a hive reading leaves its limits. They close automatically once the value is back in range.">
        <button className="btn" onClick={readAll} disabled={!sum?.unread}><CheckCheck size={15} />Mark all read ({sum?.unread || 0})</button>
      </PageHead>
      <div className="grid g4" style={{ marginBottom: 20 }}>
        <Kpi label="Critical" value={sum?.bySeverity?.critical || 0} meta="open now" loading={!sum} />
        <Kpi label="Warnings" value={sum?.bySeverity?.warning || 0} meta="open now" loading={!sum} />
        <Kpi label="Unread" value={sum?.unread || 0} meta="not yet seen" loading={!sum} />
        <Kpi label="Resolved" value={sum?.byStatus?.resolved || 0} meta="kept 45 days" loading={!sum} />
      </div>
      <div className="grid side">
        <Panel flush>
          <div className="row wrap" style={{ padding: '12px 18px', borderBottom: '1px dotted var(--line-strong)' }}>
            <Seg value={status} onChange={setStatus} options={[{ value: 'active', label: 'Open' }, { value: 'resolved', label: 'Resolved' }, { value: 'all', label: 'All' }]} />
            <Seg value={severity} onChange={setSeverity} options={[{ value: '', label: 'Any' }, { value: 'critical', label: 'Critical' }, { value: 'warning', label: 'Warning' }]} />
            <select className="select" value={hive} onChange={(e) => setHive(e.target.value)} aria-label="Hive"><option value="">All hives</option>{hives.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
          </div>
          {loading && !data && [1, 2, 3].map((i) => <div key={i} style={{ padding: 16 }}><Skeleton h={44} /></div>)}
          {data?.items.map((n) => <AlertRow key={n.id} n={n} now={now} onRead={read} />)}
          {data && !data.items.length && <Empty title={status === 'active' ? 'No open alerts' : 'Nothing to show'}>{status === 'active' ? 'Every hive is inside its limits.' : 'No alert matches these filters.'}</Empty>}
          {data && data.pages > 1 && (
            <div className="row between" style={{ padding: '12px 18px', borderTop: '1px dotted var(--line-strong)' }}>
              <span className="small faint">Page {data.page} of {data.pages} · {data.total} alerts</span>
              <div className="row"><button className="btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><button className="btn sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button></div>
            </div>
          )}
        </Panel>
        <Panel title="Alert rules" sub="Checked on every reading" flush>
          {Object.entries(ALERT_TYPES).map(([k, v]) => <div key={k} className="alertrow"><div><b style={{ font: '600 15px var(--display)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{v.label}</b><div className="muted small">{v.rule}</div></div></div>)}
        </Panel>
      </div>
    </div>
  );
}
