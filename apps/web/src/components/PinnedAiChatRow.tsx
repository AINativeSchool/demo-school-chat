import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { useLocalStorageSync } from '../hooks/useLocalStorage';
import { aiService } from '../services/aiService';
import { formatListTime } from '../utils/formatTime';
import './ConversationList.css';
import './PinnedAiChatRow.css';

/** Builds the preview line for the pinned casual AI chat row. */
function previewText(lastMessage?: { role: string; content: string }): string {
  if (!lastMessage) return 'Chat for fun — tap to start';

  const prefix = lastMessage.role === 'user' ? 'You: ' : '';
  return `${prefix}${lastMessage.content}`;
}

/** Pinned AI chat entry at the top of the main chats list. */
export function PinnedAiChatRow() {
  const { version } = useLocalStorageSync();

  const summary = useMemo(() => aiService.getCasualChatSummary(), [version]);
  const { conversation, lastMessage } = summary;
  const timeSource = lastMessage?.createdAt ?? conversation.createdAt;

  return (
    <Link to={`/ai/${conversation.id}`} className="conversation-row conversation-row--pinned-ai">
      <div className="avatar avatar--ai">
        <Bot size={22} />
      </div>
      <div className="conversation-row__body">
        <div className="conversation-row__top">
          <span className="conversation-row__name">{conversation.title}</span>
          <span className="conversation-row__time">{formatListTime(timeSource)}</span>
        </div>
        <div className="conversation-row__bottom">
          <span className="conversation-row__preview">{previewText(lastMessage)}</span>
          <span className="ai-badge">AI</span>
        </div>
      </div>
    </Link>
  );
}
