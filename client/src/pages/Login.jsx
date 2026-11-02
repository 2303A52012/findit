import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { User, ShieldCheck, Mail, Lock } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [params, setParams] = useSearchParams();
  const initialRole = params.get('role') === 'moderator' ? 'moderator' : 'user';
  const [role, setRole] = useState(initialRole);

  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const urlRole = params.get('role');
    if (urlRole === 'moderator' || urlRole === 'user') {
      setRole(urlRole);
    }
  }, [params]);

  function switchRole(selectedRole) {
    setRole(selectedRole);
    setError('');
    setParams({ role: selectedRole });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form);
      if (user.role === 'moderator') {
        navigate('/moderator', { replace: true });
      } else {
        navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const isMod = role === 'moderator';

  return (
    <section className="auth-page">
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${!isMod ? 'active' : ''}`}
          onClick={() => switchRole('user')}
        >
          <User size={18} />
          <span>User Login</span>
        </button>
        <button
          type="button"
          className={`auth-tab ${isMod ? 'active admin' : ''}`}
          onClick={() => switchRole('moderator')}
        >
          <ShieldCheck size={18} />
          <span>Administrator Login</span>
        </button>
      </div>

      <form className="form-card" onSubmit={submit}>
        <div className="auth-header">
          <div className={`auth-badge ${isMod ? 'admin' : 'user'}`}>
            {isMod ? <ShieldCheck size={16} /> : <User size={16} />}
            {isMod ? 'Staff Portal' : 'Public Portal'}
          </div>
          <h1>{isMod ? 'Administrator Sign In' : 'Welcome Back'}</h1>
          <p>
            {isMod
              ? 'Sign in to access moderation tools, review reports, and manage listings.'
              : 'Log in to report items, track your belongings, and submit claims.'}
          </p>
        </div>

        <ErrorMessage message={error} />

        <label>
          Email Address
          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              required
              placeholder={isMod ? 'Enter administrator email' : 'Enter your email'}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </label>

        <label>
          Password
          <div className="input-with-icon">
            <Lock size={18} className="input-icon" />
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </label>

        <button className={`button primary full ${isMod ? 'admin-btn' : ''}`} disabled={loading}>
          {loading ? 'Signing in...' : isMod ? 'Sign In as Administrator' : 'Log In as User'}
        </button>

        <p className="form-footer">
          Don't have an account yet?{' '}
          <Link to={`/register${isMod ? '?role=moderator' : ''}`}>
            {isMod ? 'Register as Administrator' : 'Register as User'}
          </Link>
        </p>
      </form>
    </section>
  );
}
