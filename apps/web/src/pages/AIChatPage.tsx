import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { AIChatPanel } from '../components/AIChatPanel';
import { AIMessageContent } from '../components/AIMessageContent';
import { NeonButton } from '../components/NeonButton';
import { useLocalStorageSync } from '../hooks/useLocalStorage';
import { aiService } from '../services/aiService';
import { AiError } from '../services/aiService';

/** Single AI conversation thread. */
export function AIChatPage() {
  const { id } = useParams<{ id: string }>();
  const { version, bump } = useLocalStorageSync();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = useMemo(
    () => (id ? aiService.getConversation(id) : undefined),
    [id, version],
  );

  const messages = useMemo(
    () => (id ? aiService.getMessages(id) : []),
    [id, version],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!id || !text.trim() || loading) return;
    setError('');
    setLoading(true);
    const content = text;
    setText('');
    bump();
    try {
      await aiService.sendMessage(id, content);
      bump();
    } catch (err) {
      setError(err instanceof AiError ? err.message : 'Failed to get AI reply.');
    } finally {
      setLoading(false);
    }
  };

  const backPath = '/chats';

  if (!conversation) {
    return (
      <div className="page">
        <p className="empty-state">AI conversation not found.</p>
        <Link to="/chats">Back to Chats</Link>
      </div>
    );
  }

  return (
    <div className="chat-page chat-page-full">
      <div className="chat-header">
        <Link to={backPath} aria-label="Back">
          <ArrowLeft size={22} />
        </Link>
        <span>{conversation.title}</span>
      </div>
      <AIChatPanel mode={conversation.mode} />
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
            <AIMessageContent content={msg.content} role={msg.role} />
          </div>
        ))}
        {loading && <p className="ai-loading">AI is thinking...</p>}
        <div ref={bottomRef} />
      </div>
      {error && <p className="error-text" style={{ padding: '0 1rem' }}>{error}</p>}
      <form
        className="message-input"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <div className="message-input__row">
          <input
            type="text"
            placeholder="Ask the AI..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
          />
          <NeonButton type="submit" variant="magenta" className="message-input__send" disabled={loading || !text.trim()}>
            <Send size={18} />
          </NeonButton>
        </div>
      </form>
    </div>
  );
}
