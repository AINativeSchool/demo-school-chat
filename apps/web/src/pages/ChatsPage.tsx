import { ConversationList } from '../components/ConversationList';
import { useConversations } from '../hooks/useConversations';

/** Lists all 1:1 conversations with unread badges. */
export function ChatsPage() {
  const { conversations } = useConversations();

  return (
    <div className="page">
      <h1 className="page-header">Chats</h1>
      <ConversationList conversations={conversations} />
    </div>
  );
}
