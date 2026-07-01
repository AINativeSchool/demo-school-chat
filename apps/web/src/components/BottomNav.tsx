import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bot, MessageCircle, Settings, Users } from 'lucide-react';
import { aiService } from '../services/aiService';
import './BottomNav.css';

/** Returns true when the current route is the learn-mode AI chat. */
function isLearnChatPath(pathname: string): boolean {
  const match = pathname.match(/^\/ai\/([^/]+)$/);
  if (!match) return pathname === '/ai';

  return aiService.getConversation(match[1])?.mode === 'learn';
}

/** Fixed bottom navigation for the four main app sections. */
export function BottomNav() {
  const location = useLocation();
  const learnChatPath = useMemo(() => aiService.getLearnChatPath(), []);
  const learnActive = isLearnChatPath(location.pathname);

  return (
    <nav className="bottom-nav">
      <NavLink to="/chats" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <MessageCircle size={24} />
        <span>Chats</span>
      </NavLink>
      <NavLink to="/friends" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <Users size={24} />
        <span>Friends</span>
      </NavLink>
      <NavLink
        to={learnChatPath}
        className={() => `bottom-nav__item ai ${learnActive ? 'active' : ''}`}
      >
        <Bot size={24} />
        <span>Learn</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <Settings size={24} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
