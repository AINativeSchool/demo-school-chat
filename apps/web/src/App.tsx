import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import { AIPage } from './pages/AIPage';
import { AIChatPage } from './pages/AIChatPage';
import { ChatPage } from './pages/ChatPage';
import { ChatsPage } from './pages/ChatsPage';
import { FriendsPage } from './pages/FriendsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';

/** Root application with public and protected routes. */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/chats" replace />} />
            <Route path="chats" element={<ChatsPage />} />
            <Route path="friends" element={<FriendsPage />} />
            <Route path="ai" element={<AIPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="chats/:id" element={<ChatPage />} />
          <Route path="ai/:id" element={<AIChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/chats" replace />} />
      </Routes>
    </AuthProvider>
  );
}
