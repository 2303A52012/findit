import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, ShieldCheck, Mail, Lock, KeyRound } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [params, setParams] = useSearchParams();
  const initialRole = params.get('role') === 'moderator' ? 'moderator' : 'user';
  const [role, setRole] = useState(initialRole);

  const { register, registerModerator, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    adminSecretCode: ''
  });
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

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError('Passwords do not match');
    }

    try {
      if (role === 'moderator') {
        if (!form.adminSecretCode.trim()) {
          return setError('Please enter the Administrator Access Code.');
        }
        await registerModerator({
          name: form.name,
          email: form.email,
          password: form.password,
          adminSecretCode: form.adminSecretCode.trim()
        });
        navigate('/moderator');
      } else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password
        });
        navigate('/dashboard');
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
          <span>User Registration</span>
        </button>
        <button
          type="button"
          className={`auth-tab ${isMod ? 'active admin' : ''}`}
          onClick={() => switchRole('moderator')}
        >
          <ShieldCheck size={18} />
          <span>Administrator Registration</span>
        </button>
      </div>

      <form className="form-card" onSubmit={submit}>
        <div className="auth-header">
          <div className={`auth-badge ${isMod ? 'admin' : 'user'}`}>
            {isMod ? <ShieldCheck size={16} /> : <User size={16} />}
            {isMod ? 'Staff Portal' : 'Public Portal'}
          </div>
          <h1>{isMod ? 'Create Administrator Account' : 'Create User Account'}</h1>
          <p>
            {isMod
              ? 'Authorized access for facility staff and moderators to review and manage listings.'
              : 'Sign up to report lost items, post found belongings, and claim your items.'}
          </p>
        </div>

        <ErrorMessage message={error} />

        <label>
          Full Name
          <div className="input-with-icon">
            <User size={18} className="input-icon" />
            <input
              name="name"
              required
              minLength="2"
              placeholder={isMod ? 'e.g. Officer Davis' : 'e.g. Alice Johnson'}
              value={form.name}
              onChange={update}
            />
          </div>
        </label>

        <label>
          {isMod ? 'Staff / Official Email' : 'Email Address'}
          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input
              name="email"
              type="email"
              required
              placeholder={isMod ? 'Enter administrator email' : 'Enter your email'}
              value={form.email}
              onChange={update}
            />
          </div>
        </label>

        {isMod && (
          <label>
            Administrator Access Code
            <div className="input-with-icon">
              <KeyRound size={18} className="input-icon" />
              <input
                name="adminSecretCode"
                type="password"
                required
                placeholder="Enter organization security code"
                value={form.adminSecretCode}
                onChange={update}
              />
            </div>
            <span className="field-hint">Enter the authorization code provided by your organization.</span>
          </label>
        )}

        <div className="form-row">
          <label>
            Password
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                name="password"
                type="password"
                required
                minLength="6"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={update}
              />
            </div>
          </label>

          <label>
            Confirm Password
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                name="confirm"
                type="password"
                required
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={update}
              />
            </div>
          </label>
        </div>

        <button className={`button primary full ${isMod ? 'admin-btn' : ''}`} disabled={loading}>
          {loading ? 'Creating Account...' : isMod ? 'Register as Administrator' : 'Register as User'}
        </button>

        <p className="form-footer">
          Already have an account?{' '}
          <Link to={`/login${isMod ? '?role=moderator' : ''}`}>Log in</Link>
        </p>
      </form>
    </section>
  );
}
