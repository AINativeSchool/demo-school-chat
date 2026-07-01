import { Link } from 'react-router-dom';
import type { ConversationSummary } from '@school-chat/shared';
import { formatListTime } from '../utils/formatTime';
import './ConversationList.css';

interface ConversationListProps {
  conversations: ConversationSummary[];
  currentUserId?: string;
}

/** Builds the one-line preview shown under each contact name. */
function previewText(
  lastMessage: ConversationSummary['lastMessage'],
  currentUserId?: string,
): string {
  if (!lastMessage) return 'Tap to chat';

  const prefix = lastMessage.senderId === currentUserId ? 'You: ' : '';
  if (lastMessage.imageDataUrl) return `${prefix}Photo`;
  return `${prefix}${lastMessage.content ?? ''}`;
}

/** Renders the WhatsApp-style chat list. */
export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="empty-state conversation-list-empty">
        <p>No chats yet.</p>
        <p>Tap the <strong>+</strong> button to message a friend.</p>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map(({ conversation, otherUser, lastMessage, unreadCount }) => {
        const timeSource = lastMessage?.createdAt ?? conversation.updatedAt;

        return (
          <Link key={conversation.id} to={`/chats/${conversation.id}`} className="conversation-row">
            <div className="avatar">{otherUser.displayName.charAt(0).toUpperCase()}</div>
            <div className="conversation-row__body">
              <div className="conversation-row__top">
                <span className="conversation-row__name">{otherUser.displayName}</span>
                <span className={`conversation-row__time ${unreadCount > 0 ? 'unread' : ''}`}>
                  {formatListTime(timeSource)}
                </span>
              </div>
              <div className="conversation-row__bottom">
                <span className="conversation-row__preview">
                  {previewText(lastMessage, currentUserId)}
                </span>
                {unreadCount > 0 && <span className="conversation-row__badge">{unreadCount}</span>}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
