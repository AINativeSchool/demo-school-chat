import { Link } from 'react-router-dom';
import { MessageSquarePlus } from 'lucide-react';
import './NewChatFab.css';

/** Floating action button to start a new chat (WhatsApp-style). */
export function NewChatFab() {
  return (
    <Link to="/friends" className="new-chat-fab" aria-label="New chat">
      <MessageSquarePlus size={24} />
    </Link>
  );
}
