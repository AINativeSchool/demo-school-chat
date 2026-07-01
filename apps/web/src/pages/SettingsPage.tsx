import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeonButton } from '../components/NeonButton';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

/** Account settings, invite codes, and data notices. */
export function SettingsPage() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [latestInviteCode, setLatestInviteCode] = useState('');
  const [saved, setSaved] = useState(false);

  const myInviteCodes = useMemo(() => authService.listMyInviteCodes(), [latestInviteCode, user?.id]);

  const handleSave = () => {
    authService.updateProfile({ displayName });
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGenerateInvite = () => {
    const code = authService.generateInviteCode();
    setLatestInviteCode(code);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const copyInvite = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="page">
      <h1 className="page-header">Settings</h1>

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
          Generate a code, then log out and register a second account in this same browser to test
          with a friend. Codes do not sync to other devices or incognito windows in v1.
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
          All data is stored locally in this browser. Clearing site data will delete your account,
          messages, and AI chats. Cross-device sync is not available in v1 — friends on different
          phones cannot see your messages yet.
        </p>
      </div>

      <NeonButton variant="ghost" onClick={handleLogout}>
        Log out
      </NeonButton>
    </div>
  );
}
