import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/Auth';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(email, password); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="auth">
      <section className="auth__photo" style={{ backgroundImage: 'linear-gradient(180deg, #17120acc, #17120a33 40%, #17120add), url(/img/apiary.jpg)' }}>
        <div className="brand" style={{ fontSize: 40 }}><img src="/img/bee.png" alt="" style={{ height: 50 }} /><span>iBee<small>Hive monitoring</small></span></div>
        <div className="auth__quote">Weight, brood temperature and entrance traffic for every hive, in every apiary.</div>
      </section>
      <section className="auth__side">
        <form className="panel auth__card" onSubmit={submit}>
          <div className="panel__body stack" style={{ gap: 16, padding: 28 }}>
            <div><h1 style={{ fontSize: 38 }}>Sign in</h1></div>
            <div className="field"><label htmlFor="email">Email</label><input id="email" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></div>
            <div className="field"><label htmlFor="pw">Password</label>
              <div style={{ position: 'relative' }}>
                <input id="pw" className="input" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
                <button type="button" className="btn icon sm ghost" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 4, top: 5 }}>{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            {error && <div className="tag crit" role="alert" style={{ height: 'auto', padding: '8px 10px', whiteSpace: 'normal' }}>{error}</div>}
            <button className="btn primary" style={{ height: 44 }} disabled={busy}>{busy ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Signing in</> : 'Sign in'}</button>
            <p className="faint small">Ask an administrator if you need an account.</p>
          </div>
        </form>
      </section>
    </div>
  );
}
