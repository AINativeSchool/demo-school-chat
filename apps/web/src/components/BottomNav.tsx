import { NavLink } from 'react-router-dom';
import { Bot, MessageCircle, Settings, Users } from 'lucide-react';
import './BottomNav.css';

/** Fixed bottom navigation for the four main app sections. */
export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/chats" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <MessageCircle size={22} />
        <span>Chats</span>
      </NavLink>
      <NavLink to="/ai" className={({ isActive }) => `bottom-nav__item ai ${isActive ? 'active' : ''}`}>
        <Bot size={22} />
        <span>AI</span>
      </NavLink>
      <NavLink to="/friends" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <Users size={22} />
        <span>Friends</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <Settings size={22} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
