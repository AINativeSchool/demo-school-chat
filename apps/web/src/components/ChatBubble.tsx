import type { Message } from '@school-chat/shared';
import './ChatBubble.css';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

/** Renders a single chat message bubble. */
export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`chat-bubble ${isOwn ? 'own' : 'other'}`}>
      <div className="chat-bubble__content">
        {message.imageDataUrl && (
          <img src={message.imageDataUrl} alt="Shared" className="chat-bubble__image" />
        )}
        {message.content && <p>{message.content}</p>}
      </div>
      <div className="chat-bubble__meta">
        <span>{time}</span>
        {isOwn && <span className="chat-bubble__status">{message.status}</span>}
      </div>
    </div>
  );
}
