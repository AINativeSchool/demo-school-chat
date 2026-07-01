import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AIChatPanel } from '../components/AIChatPanel';
import { AIMessageContent } from '../components/AIMessageContent';
import { MessageInput } from '../components/MessageInput';
import { TeacherDisplayName } from '../components/TeacherDisplayName';
import { useLocalStorageSync } from '../hooks/useLocalStorage';
import { aiService } from '../services/aiService';
import { AiError } from '../services/aiService';

/** Single AI conversation thread. */
export function AIChatPage() {
  const { id } = useParams<{ id: string }>();
  const { version, bump } = useLocalStorageSync();
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

  useEffect(() => {
    if (!id || !conversation || conversation.mode !== 'teacher' || messages.length > 0) return;

    aiService
      .ensureTeacherOpening(id)
      .then((seeded) => {
        if (seeded) bump();
      })
      .catch(() => {});
  }, [id, conversation, messages.length, bump]);

  const handleSend = async (content: string) => {
    if (!id || !content.trim() || loading) return;
    setError('');
    setLoading(true);
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

  const backPath = conversation?.mode === 'teacher' ? '/ai' : '/chats';

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
        {conversation.mode === 'teacher' ? (
          <TeacherDisplayName name={conversation.personalityName ?? conversation.title} />
        ) : (
          <span>{conversation.title}</span>
        )}
      </div>
      <AIChatPanel mode={conversation.mode} personalityName={conversation.personalityName} />
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
            <AIMessageContent content={msg.content} role={msg.role} />
          </div>
        ))}
        {loading && <p className="ai-loading">AI is thinking...</p>}
        <div ref={bottomRef} />
      </div>
      {error && <p className="error-text chat-page__error">{error}</p>}
      <MessageInput
        onSend={({ content }) => {
          if (content) handleSend(content);
        }}
        disabled={loading}
        showAttach={false}
        placeholder={
          conversation.mode === 'teacher'
            ? 'Reply or pick an option above…'
            : 'Ask the AI...'
        }
      />
    </div>
  );
}
