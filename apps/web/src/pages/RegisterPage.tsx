import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { AuthPageShell } from '../components/AuthPageShell';
import { NeonButton } from '../components/NeonButton';
import { useAuth } from '../hooks/useAuth';
import { AuthError } from '../services/authService';
import { DEFAULT_INVITE_CODE } from '../storage/constants';

/** Registration page requiring an invite code. */
export function RegisterPage() {
  const { session, register } = useAuth();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState(
    () => searchParams.get('code') ?? DEFAULT_INVITE_CODE,
  );
  const [username, setUsername] = useState('');
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
      await register(inviteCode.trim().toUpperCase(), username, password, displayName);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell showRegisterLink={false}>
      <div className="auth-card">
        <h1>Create account</h1>
        <p>
          Sign up with an invite code — new users can use{' '}
          <code className="invite-code">{DEFAULT_INVITE_CODE}</code>.
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
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              pattern="[a-z0-9_]{3,20}"
              title="3–20 characters: letters, numbers, underscores"
              required
              minLength={3}
              maxLength={20}
            />
            <p className="form-hint">Your login name. Friends can add you with this username.</p>
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
    </AuthPageShell>
  );
}
