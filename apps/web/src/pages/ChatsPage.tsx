import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ConversationSummary } from '@school-chat/shared';
import { ConversationList } from '../components/ConversationList';
import { NewChatFab } from '../components/NewChatFab';
import { OnboardingEmptyState } from '../components/OnboardingEmptyState';
import { PinnedAiChatRow } from '../components/PinnedAiChatRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../hooks/useAuth';
import { useConversations } from '../hooks/useConversations';
import { usePolling } from '../hooks/usePolling';
import { friendService } from '../services/friendService';

/** Filters conversations by contact name or message preview. */
function filterConversations(
  conversations: ConversationSummary[],
  query: string,
): ConversationSummary[] {
  const term = query.trim().toLowerCase();
  if (!term) return conversations;

  return conversations.filter(({ otherUser, lastMessage }) => {
    const haystack = [
      otherUser.displayName,
      otherUser.username,
      lastMessage?.content ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  });
}

/** Lists all 1:1 conversations with unread badges. */
export function ChatsPage() {
  const { user } = useAuth();
  const { conversations, loading: conversationsLoading } = useConversations();
  const [friendCount, setFriendCount] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const refreshFriends = useCallback(async () => {
    try {
      const friends = await friendService.getFriends();
      setFriendCount(friends.length);
    } catch {
      setFriendCount(0);
    }
  }, []);

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  usePolling(refreshFriends, 5000);

  const filteredConversations = useMemo(
    () => filterConversations(conversations, search),
    [conversations, search],
  );

  const loading = conversationsLoading || friendCount === null;

  if (loading) {
    return (
      <div className="chat-home">
        <ScreenHeader title="Chats" />
        <div className="empty-state">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="chat-home">
      <ScreenHeader title="Chats" />
      <SearchBar value={search} onChange={setSearch} placeholder="Search chats" />
      <PinnedAiChatRow />
      {friendCount === 0 ? (
        <OnboardingEmptyState displayName={user?.displayName} compact />
      ) : (
        <>
          <ConversationList conversations={filteredConversations} currentUserId={user?.id} />
          <NewChatFab />
        </>
      )}
    </div>
  );
}
