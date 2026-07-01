import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PublicUser } from '@school-chat/shared';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchBar } from '../components/SearchBar';
import { usePolling } from '../hooks/usePolling';
import { chatService } from '../services/chatService';
import { friendService, FriendError } from '../services/friendService';

/** Filters friends and requests by display name or username. */
function matchesSearch(user: PublicUser, query: string): boolean {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  return (
    user.displayName.toLowerCase().includes(term) ||
    user.username.toLowerCase().includes(term)
  );
}

/** Friends list with add, accept/decline, unfriend, and block actions. */
export function FriendsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');
  const [search, setSearch] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [friends, setFriends] = useState<Array<{ user: PublicUser }>>([]);
  const [incoming, setIncoming] = useState<Array<{ id: string; user: PublicUser }>>([]);
  const [outgoing, setOutgoing] = useState<Array<{ id: string; user: PublicUser }>>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [friendList, pending] = await Promise.all([
        friendService.getFriends(),
        friendService.getPendingRequests(),
      ]);
      setFriends(friendList);
      setIncoming(pending.incoming);
      setOutgoing(pending.outgoing);
    } catch {
      setFriends([]);
      setIncoming([]);
      setOutgoing([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  usePolling(refresh, 5000);

  const filteredFriends = useMemo(
    () => friends.filter(({ user }) => matchesSearch(user, search)),
    [friends, search],
  );

  const handleAdd = async () => {
    setError('');
    setMessage('');
    try {
      await friendService.sendRequest(username);
      setUsername('');
      setMessage('Friend request sent!');
      await refresh();
    } catch (err) {
      setError(err instanceof FriendError ? err.message : 'Failed to send request.');
    }
  };

  const handleAccept = async (id: string) => {
    await friendService.acceptRequest(id);
    await refresh();
  };

  const handleDecline = async (id: string) => {
    await friendService.declineRequest(id);
    await refresh();
  };

  const openChat = async (userId: string) => {
    setError('');
    try {
      const conv = await chatService.getOrCreateConversation(userId);
      navigate(`/chats/${conv.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cannot open chat.');
    }
  };

  if (loading) {
    return (
      <div className="screen">
        <ScreenHeader title="Friends" />
        <div className="empty-state">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="screen">
      <ScreenHeader title="Friends" />

      <div className="friends-add">
        <label htmlFor="username" className="friends-add__label">
          Add friend by username
        </label>
        <div className="friends-add__row">
          <input
            id="username"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="button" className="friends-add__btn" onClick={handleAdd}>
            Add
          </button>
        </div>
      </div>

      {error && <p className="error-text friends-feedback">{error}</p>}
      {message && <p className="friends-feedback friends-feedback--success">{message}</p>}

      <div className="tabs tabs--wa">
        <button type="button" className={`tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
          Friends ({friends.length})
        </button>
        <button type="button" className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          Requests ({incoming.length + outgoing.length})
        </button>
      </div>

      {tab === 'friends' && (
        <>
          <SearchBar value={search} onChange={setSearch} placeholder="Search friends" />
          {friends.length === 0 ? (
            <div className="empty-state">
              <p>No friends yet.</p>
              <p>Share your invite code from Settings, then add friends by username.</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="empty-state">No friends match your search.</div>
          ) : (
            <div className="contact-list">
              {filteredFriends.map(({ user }) => (
                <button
                  key={user.id}
                  type="button"
                  className="contact-row"
                  onClick={() => openChat(user.id)}
                >
                  <div className="avatar">{user.displayName.charAt(0).toUpperCase()}</div>
                  <div className="contact-row__body">
                    <div className="contact-row__name">{user.displayName}</div>
                    <div className="contact-row__subtitle">@{user.username}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'requests' && (
        <>
          {incoming.length === 0 && outgoing.length === 0 ? (
            <div className="empty-state">No pending requests.</div>
          ) : (
            <div className="contact-list">
              {incoming.map(({ id, user }) => (
                <div key={id} className="contact-row contact-row--static">
                  <div className="avatar avatar-sm">{user.displayName.charAt(0).toUpperCase()}</div>
                  <div className="contact-row__body">
                    <div className="contact-row__name">{user.displayName}</div>
                    <div className="contact-row__subtitle">Wants to be friends</div>
                  </div>
                  <div className="contact-row__actions">
                    <button type="button" className="contact-row__action accept" onClick={() => handleAccept(id)}>
                      Accept
                    </button>
                    <button type="button" className="contact-row__action" onClick={() => handleDecline(id)}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {outgoing.map(({ id, user }) => (
                <div key={id} className="contact-row contact-row--static">
                  <div className="avatar avatar-sm">{user.displayName.charAt(0).toUpperCase()}</div>
                  <div className="contact-row__body">
                    <div className="contact-row__name">{user.displayName}</div>
                    <div className="contact-row__subtitle">Request sent - pending</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
