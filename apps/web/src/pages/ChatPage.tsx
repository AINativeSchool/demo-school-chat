import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Message, PublicUser } from '@school-chat/shared';
import { ChatBubble } from '../components/ChatBubble';
import { MessageInput } from '../components/MessageInput';
import { useAuth } from '../hooks/useAuth';
import { useMessagePolling } from '../hooks/usePolling';
import { chatService, ChatError } from '../services/chatService';

/** Single 1:1 chat thread view. */
export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThread = useCallback(async () => {
    if (!id) return;

    try {
      const [allMessages, thread] = await Promise.all([
        chatService.getMessages(id),
        chatService.getConversationWithUser(id),
      ]);
      setMessages(allMessages);
      setOtherUser(thread?.otherUser ?? null);
      await chatService.markAsRead(id);
    } catch {
      setOtherUser(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadThread();
  }, [loadThread]);

  useMessagePolling(id, loadThread);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (payload: { content?: string; imageDataUrl?: string }) => {
    if (!id) return;
    setError('');
    try {
      const message = await chatService.sendMessage(id, payload);
      setMessages((current) => [...current, message]);
    } catch (err) {
      setError(err instanceof ChatError ? err.message : 'Failed to send message.');
    }
  };

  if (loading) {
    return <div className="page empty-state">Loading chat...</div>;
  }

  if (!otherUser) {
    return (
      <div className="page">
        <p className="empty-state">Conversation not found.</p>
        <Link to="/chats">Back to chats</Link>
      </div>
    );
  }

  return (
    <div className="chat-page chat-page-full">
      <div className="chat-header">
        <Link to="/chats" className="chat-header__back" aria-label="Back">
          <ArrowLeft size={22} />
        </Link>
        <div className="avatar avatar-sm">{otherUser.displayName.charAt(0).toUpperCase()}</div>
        <div className="chat-header__info">
          <span className="chat-header__name">{otherUser.displayName}</span>
          <span className="chat-header__subtitle">@{otherUser.username}</span>
        </div>
      </div>
      <div className="chat-messages chat-messages--wallpaper">
        {messages.length === 0 && (
          <p className="chat-messages__empty">Messages are end-to-end styled. Say hi to {otherUser.displayName}!</p>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
        ))}
        <div ref={bottomRef} />
      </div>
      {error && <p className="error-text chat-page__error">{error}</p>}
      <MessageInput onSend={handleSend} />
    </div>
  );
}
