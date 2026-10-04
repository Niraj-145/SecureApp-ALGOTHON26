import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      login(data.access_token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuick = (demoEmail, demoPw) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert size={28} />
          <h1>SecureApp</h1>
        </div>
        <p className="auth-subtitle">
          Web Application Security Assessment & Remediation Platform
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
          <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            <UserCheck size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Quick Demo Accounts:
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fillQuick('admin@secureapp.local', 'Admin@123')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fillQuick('alice@secureapp.local', 'Alice@123')}
            >
              Alice (User A)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fillQuick('bob@secureapp.local', 'Bob@12345')}
            >
              Bob (User B)
            </button>
          </div>
        </div>

        <div className="mt-3 text-center text-sm">
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600, textDecoration: 'underline' }}>
            Register new account
          </Link>
        </div>
      </div>
    </div>
  );
}
