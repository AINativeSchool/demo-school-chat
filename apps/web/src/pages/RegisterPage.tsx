import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { NeonButton } from '../components/NeonButton';
import { useAuth } from '../hooks/useAuth';
import { AuthError } from '../services/authService';

/** Registration page requiring an invite code. */
export function RegisterPage() {
  const { session, register } = useAuth();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState(() => searchParams.get('code') ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/chats" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(inviteCode.trim().toUpperCase(), email, password, displayName);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Join School Chat</h1>
        <p>
          Register with an invite code. Use <code>SCHOOL01</code> for the first account on a new
          browser. Generated codes only work in the same browser where they were created — log out,
          then register here to create a second test account.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="invite">Invite code</label>
            <input
              id="invite"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              spellCheck={false}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="name">Display name</label>
            <input
              id="name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
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
              minLength={6}
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="form-actions">
            <NeonButton type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </NeonButton>
            <p className="form-link">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
