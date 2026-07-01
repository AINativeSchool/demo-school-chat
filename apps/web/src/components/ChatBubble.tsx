import { Check, CheckCheck } from 'lucide-react';
import type { Message, MessageStatus } from '@school-chat/shared';
import { formatMessageTime } from '../utils/formatTime';
import './ChatBubble.css';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
}

/** Renders WhatsApp-style read receipt ticks for outgoing messages. */
function ReadReceipt({ status }: { status: MessageStatus }) {
  if (status === 'read') {
    return <CheckCheck size={14} className="chat-bubble__ticks read" aria-label="Read" />;
  }
  if (status === 'delivered') {
    return <CheckCheck size={14} className="chat-bubble__ticks" aria-label="Delivered" />;
  }
  return <Check size={14} className="chat-bubble__ticks" aria-label="Sent" />;
}

/** Renders a single chat message bubble. */
export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const time = formatMessageTime(message.createdAt);

  return (
    <div className={`chat-bubble ${isOwn ? 'own' : 'other'}`}>
      <div className="chat-bubble__content">
        {message.imageDataUrl && (
          <img src={message.imageDataUrl} alt="Shared" className="chat-bubble__image" />
        )}
        {message.content && <p className="chat-bubble__text">{message.content}</p>}
        <div className="chat-bubble__footer">
          <span className="chat-bubble__time">{time}</span>
          {isOwn && <ReadReceipt status={message.status} />}
        </div>
      </div>
    </div>
  );
}
