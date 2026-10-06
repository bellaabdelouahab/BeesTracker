import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { useAuth } from '../context/Auth';
import { useLive } from '../context/Live';
import { useData } from '../context/Data';
import { Skeleton } from './ui';
import { cx } from '../lib/format';

const NAV = [['/', 'Map', true], ['/apiaries', 'Apiaries'], ['/hives', 'Hives'], ['/alerts', 'Alerts', false, true], ['/analytics', 'Analytics'], ['/control', 'Control']];

export const Brand = () => (
  <Link to="/" className="brand" aria-label="iBee, home">
    <img src="/img/bee.png" alt="" />
    <span>iBee<small>Hive monitoring</small></span>
  </Link>
);

export default function Shell() {
  const { user, logout } = useAuth();
  const { status, rate } = useLive();
  const { data } = useData();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const ref = useRef();
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const alerts = data ? data.kpis.alertsCritical + data.kpis.alertsWarning : 0;
  const live = status === 'live';
  return (
    <div className="app">
      <header className="topbar">
        <button className="btn icon sm burger" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={18} /> : <Menu size={18} />}</button>
        <Brand />
        <nav className={cx('nav', open && 'open')}>
          {NAV.map(([to, label, end, badge]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx(isActive && 'active')}>
              {label}{badge && alerts > 0 && <span className="count">{alerts}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="right">
          <span className={cx('live-pill', live && 'on')} title={live ? 'Receiving data in real time' : 'Reconnecting'}>
            <i className={cx('hex', live && 'live')} style={{ width: 10, height: 11 }} />{live ? <>Live{rate ? <span className="hide-sm"> · {rate}/min</span> : null}</> : status === 'connecting' ? 'Connecting' : 'Offline'}
          </span>
          <div ref={ref} style={{ position: 'relative' }}>
            <button className="btn sm" onClick={() => setMenu(!menu)}><User size={15} /><span className="hide-sm">{(user?.name || '').split(' ')[0]}</span><ChevronDown size={14} /></button>
            {menu && (
              <div className="usermenu">
                <div style={{ padding: '8px 10px' }}><b>{user?.name}</b><div className="small faint">{user?.email}</div><span className="tag amber" style={{ marginTop: 6 }}>{user?.role}</span></div>
                <hr className="rule" />
                <Link to="/profile" onClick={() => setMenu(false)}><User size={15} />Profile</Link>
                <button onClick={logout}><LogOut size={15} />Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <Suspense fallback={<div className="page"><Skeleton h={40} w={280} /><div style={{ height: 18 }} /><Skeleton h={180} /></div>}><Outlet /></Suspense>
    </div>
  );
}
