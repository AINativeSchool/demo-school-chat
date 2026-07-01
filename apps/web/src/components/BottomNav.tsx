import { useLocation } from 'react-router-dom';
import { Bot, MessageCircle, Settings, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { aiService } from '../services/aiService';
import './BottomNav.css';

/** Returns true when the current route is the Teacher tab or a teacher-mode chat. */
function isTeacherRoute(pathname: string): boolean {
  if (pathname === '/ai') return true;

  const match = pathname.match(/^\/ai\/([^/]+)$/);
  if (!match) return false;

  const conversation = aiService.getConversation(match[1]);
  return !conversation || conversation.mode === 'teacher';
}

/** Fixed bottom navigation for the four main app sections. */
export function BottomNav() {
  const location = useLocation();
  const teacherActive = isTeacherRoute(location.pathname);

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
      <NavLink to="/ai" className={() => `bottom-nav__item ai ${teacherActive ? 'active' : ''}`}>
        <Bot size={24} />
        <span>Teacher</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}>
        <Settings size={24} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
