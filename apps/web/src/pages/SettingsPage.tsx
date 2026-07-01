import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InviteCode } from '@school-chat/shared';
import { NeonButton } from '../components/NeonButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

/** Account settings, invite codes, and data notices. */
export function SettingsPage() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [latestInviteCode, setLatestInviteCode] = useState('');
  const [myInviteCodes, setMyInviteCodes] = useState<InviteCode[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authService.listMyInviteCodes().then(setMyInviteCodes).catch(() => setMyInviteCodes([]));
  }, [latestInviteCode]);

  const handleSave = async () => {
    setError('');
    try {
      await authService.updateProfile({ displayName });
      refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    }
  };

  const handleGenerateInvite = async () => {
    setError('');
    try {
      const code = await authService.generateInviteCode();
      setLatestInviteCode(code);
      const codes = await authService.listMyInviteCodes();
      setMyInviteCodes(codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invite code.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const copyInvite = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="screen">
      <ScreenHeader title="Settings" />

      <div className="page">
      <div className="settings-section">
        <h2>Profile</h2>
        <div className="form-group">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        {user && <p className="notice">Username: @{user.username}</p>}
        <NeonButton variant="cyan" onClick={handleSave}>
          {saved ? 'Saved!' : 'Save profile'}
        </NeonButton>
      </div>

      <div className="settings-section">
        <h2>Invite friends</h2>
        <p className="notice">
          Generate a code and share it with friends. They can register from any device using the
          same app URL.
        </p>
        <NeonButton variant="cyan" onClick={handleGenerateInvite}>
          Generate invite code
        </NeonButton>
        {latestInviteCode && (
          <>
            <div className="invite-code">{latestInviteCode}</div>
            <NeonButton variant="ghost" onClick={() => copyInvite(latestInviteCode)}>
              Copy latest code
            </NeonButton>
          </>
        )}
        {myInviteCodes.length > 0 && (
          <div className="invite-code-list">
            <p className="notice">Active codes you created:</p>
            {myInviteCodes.map((entry) => (
              <div key={entry.code} className="invite-code-row">
                <span className="invite-code">{entry.code}</span>
                <span className="notice">
                  {entry.maxUses - entry.useCount} use{entry.maxUses - entry.useCount === 1 ? '' : 's'} left
                </span>
                <NeonButton variant="ghost" onClick={() => copyInvite(entry.code)}>
                  Copy
                </NeonButton>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="settings-section">
        <h2>Data & privacy</h2>
        <p className="notice">
          Account, friends, and messages are stored on the shared server so you can chat across
          devices. AI conversation history stays in this browser for now. Image uploads are limited
          to about 2 MB to protect storage space.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <NeonButton variant="ghost" onClick={handleLogout}>
        Log out
      </NeonButton>
      </div>
    </div>
  );
}
