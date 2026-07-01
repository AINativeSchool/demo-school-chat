import { Link } from 'react-router-dom';
import type { ConversationSummary } from '@school-chat/shared';
import './ConversationList.css';

interface ConversationListProps {
  conversations: ConversationSummary[];
}

/** Renders the list of 1:1 chat conversations. */
export function ConversationList({ conversations }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="empty-state">
        <p>No conversations yet.</p>
        <p>Add friends and start chatting!</p>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map(({ conversation, otherUser, lastMessage, unreadCount }) => (
        <Link key={conversation.id} to={`/chats/${conversation.id}`} className="conversation-row">
          <div className="avatar">{otherUser.displayName.charAt(0).toUpperCase()}</div>
          <div className="list-row-content">
            <div className="list-row-title">{otherUser.displayName}</div>
            <div className="list-row-subtitle">
              {lastMessage?.imageDataUrl
                ? '📷 Image'
                : lastMessage?.content ?? 'No messages yet'}
            </div>
          </div>
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </Link>
      ))}
    </div>
  );
}
