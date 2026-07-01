import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { NeonButton } from '../components/NeonButton';
import { useAuth } from '../hooks/useAuth';
import { AuthError } from '../services/authService';

/** Login page with neon-themed form. */
export function LoginPage() {
  const { session, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/chats" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>School Chat</h1>
        <p>Welcome back — log in to continue.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="form-actions">
            <NeonButton type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </NeonButton>
            <p className="form-link">
              No account? <Link to="/register">Register with invite code</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
