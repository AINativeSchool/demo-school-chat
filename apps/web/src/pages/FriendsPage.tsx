import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeonButton } from '../components/NeonButton';
import { useLocalStorageSync } from '../hooks/useLocalStorage';
import { chatService } from '../services/chatService';
import { friendService, FriendError } from '../services/friendService';

/** Friends list with add, accept/decline, unfriend, and block actions. */
export function FriendsPage() {
  const navigate = useNavigate();
  const { bump } = useLocalStorageSync();
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const friends = friendService.getFriends();
  const { incoming, outgoing } = friendService.getPendingRequests();

  const handleAdd = () => {
    setError('');
    setMessage('');
    try {
      friendService.sendRequest(username);
      setUsername('');
      setMessage('Friend request sent!');
      bump();
    } catch (err) {
      setError(err instanceof FriendError ? err.message : 'Failed to send request.');
    }
  };

  const handleAccept = (id: string) => {
    friendService.acceptRequest(id);
    bump();
  };

  const handleDecline = (id: string) => {
    friendService.declineRequest(id);
    bump();
  };

  const handleUnfriend = (userId: string) => {
    friendService.unfriend(userId);
    bump();
  };

  const handleBlock = (userId: string) => {
    friendService.blockUser(userId);
    bump();
  };

  const openChat = (userId: string) => {
    try {
      const conv = chatService.getOrCreateConversation(userId);
      navigate(`/chats/${conv.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot open chat.');
    }
  };

  return (
    <div className="page">
      <h1 className="page-header">Friends</h1>

      <div className="form-group">
        <label htmlFor="username">Add friend by username</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            id="username"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <NeonButton variant="cyan" className="neon-btn--sm" onClick={handleAdd} style={{ width: 'auto' }}>
            Add
          </NeonButton>
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      {message && <p style={{ color: 'var(--neon-green)', fontSize: '0.875rem' }}>{message}</p>}

      <div className="tabs">
        <button type="button" className={`tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
          Friends ({friends.length})
        </button>
        <button type="button" className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          Requests ({incoming.length + outgoing.length})
        </button>
      </div>

      {tab === 'friends' && (
        <>
          {friends.length === 0 ? (
            <div className="empty-state">
              <p>No friends yet.</p>
              <p>Register a second account (log out first) and add them by username.</p>
            </div>
          ) : (
            friends.map(({ user }) => (
              <div key={user.id} className="list-row">
                <div className="avatar avatar-sm">{user.displayName.charAt(0).toUpperCase()}</div>
                <div className="list-row-content">
                  <div className="list-row-title">{user.displayName}</div>
                  <div className="list-row-subtitle">@{user.username}</div>
                </div>
                <div className="row-actions">
                  <NeonButton variant="cyan" className="neon-btn--sm" onClick={() => openChat(user.id)}>
                    Chat
                  </NeonButton>
                  <NeonButton variant="ghost" className="neon-btn--sm" onClick={() => handleUnfriend(user.id)}>
                    Unfriend
                  </NeonButton>
                  <NeonButton variant="ghost" className="neon-btn--sm" onClick={() => handleBlock(user.id)}>
                    Block
                  </NeonButton>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {tab === 'requests' && (
        <>
          {incoming.length === 0 && outgoing.length === 0 ? (
            <div className="empty-state">No pending requests.</div>
          ) : (
            <>
              {incoming.map(({ id, user }) => (
                <div key={id} className="list-row">
                  <div className="list-row-content">
                    <div className="list-row-title">{user.displayName}</div>
                    <div className="list-row-subtitle">Wants to be friends</div>
                  </div>
                  <div className="row-actions">
                    <NeonButton variant="cyan" className="neon-btn--sm" onClick={() => handleAccept(id)}>
                      Accept
                    </NeonButton>
                    <NeonButton variant="ghost" className="neon-btn--sm" onClick={() => handleDecline(id)}>
                      Decline
                    </NeonButton>
                  </div>
                </div>
              ))}
              {outgoing.map(({ id, user }) => (
                <div key={id} className="list-row">
                  <div className="list-row-content">
                    <div className="list-row-title">{user.displayName}</div>
                    <div className="list-row-subtitle">Request sent — pending</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
