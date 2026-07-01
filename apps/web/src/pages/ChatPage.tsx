import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ChatBubble } from '../components/ChatBubble';
import { MessageInput } from '../components/MessageInput';
import { useAuth } from '../hooks/useAuth';
import { useLocalStorageSync } from '../hooks/useLocalStorage';
import { chatService } from '../services/chatService';
import { ChatError } from '../services/chatService';
import { storageService } from '../storage/storageService';

/** Single 1:1 chat thread view. */
export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { version, bump } = useLocalStorageSync();
  const [error, setError] = useState('');

  const conversation = useMemo(
    () => (id ? chatService.getConversation(id) : undefined),
    [id, version],
  );

  const messages = useMemo(
    () => (id ? chatService.getMessages(id) : []),
    [id, version],
  );

  const otherUser = useMemo(() => {
    if (!conversation || !user) return null;
    const otherId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;
    return storageService.getUsers().find((u) => u.id === otherId) ?? null;
  }, [conversation, user, version]);

  useEffect(() => {
    if (id) chatService.markAsRead(id);
    bump();
  }, [id, bump]);

  const handleSend = (payload: { content?: string; imageDataUrl?: string }) => {
    if (!id) return;
    setError('');
    try {
      chatService.sendMessage(id, payload);
      bump();
    } catch (err) {
      setError(err instanceof ChatError ? err.message : 'Failed to send message.');
    }
  };

  if (!conversation || !otherUser) {
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
        <Link to="/chats" aria-label="Back">
          <ArrowLeft size={22} />
        </Link>
        <div className="avatar avatar-sm">{otherUser.displayName.charAt(0).toUpperCase()}</div>
        <span>{otherUser.displayName}</span>
      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="empty-state">Say hello to {otherUser.displayName}!</p>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
        ))}
      </div>
      {error && <p className="error-text" style={{ padding: '0 1rem' }}>{error}</p>}
      <MessageInput onSend={handleSend} />
    </div>
  );
}
