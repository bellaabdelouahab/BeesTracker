import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Hex, SeverityTag } from './ui';
import { timeAgo } from '../lib/format';

export default function AlertRow({ n, onRead, now }) {
  const tone = n.status === 'resolved' ? 'online' : n.severity === 'critical' ? 'critical' : 'warning';
  return (
    <div className="alertrow" style={{ opacity: n.status === 'resolved' ? 0.72 : 1 }}>
      <Hex status={tone} size={18} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="row wrap" style={{ gap: 8 }}>
          <b style={{ font: '600 16px var(--display)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{n.label}</b>
          <SeverityTag severity={n.severity} />
          {n.status === 'resolved' && <span className="tag ok">resolved</span>}
          {!n.read && n.status === 'open' && <span className="tag amber">new</span>}
        </div>
        <div className="muted small" style={{ marginTop: 2 }}>{n.content}</div>
        <div className="faint small" style={{ marginTop: 2 }}>
          <Link to={`/hives/${n.hiveId}`} style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{n.hiveName}</Link> · {n.farmName} · {n.status === 'resolved' ? `resolved ${timeAgo(n.resolvedAt, now)}` : `since ${timeAgo(n.createdAt, now)}`}{n.count > 1 && n.status === 'open' ? ` · ${n.count} readings` : ''}
        </div>
      </div>
      {onRead && !n.read && n.status === 'open' && <button className="btn sm" onClick={() => onRead(n)}><Check size={13} />Read</button>}
    </div>
  );
}
