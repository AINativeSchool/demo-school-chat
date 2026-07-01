import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AiMode } from '@school-chat/shared';
import { NeonButton } from '../components/NeonButton';
import { useLocalStorageSync } from '../hooks/useLocalStorage';
import { aiService } from '../services/aiService';

/** Lists AI conversation threads and lets user start a new one. */
export function AIPage() {
  const navigate = useNavigate();
  const { version } = useLocalStorageSync();
  const [mode, setMode] = useState<AiMode>('learn');
  const [showPicker, setShowPicker] = useState(false);

  const conversations = useMemo(() => aiService.listConversations(), [version]);

  const startChat = () => {
    const conv = aiService.createConversation(mode);
    navigate(`/ai/${conv.id}`);
  };

  return (
    <div className="page">
      <h1 className="page-header">AI Chat</h1>

      {!showPicker ? (
        <NeonButton variant="magenta" onClick={() => setShowPicker(true)}>
          + New AI chat
        </NeonButton>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <div className="mode-picker">
            <button
              type="button"
              className={`mode-btn learn ${mode === 'learn' ? 'active' : ''}`}
              onClick={() => setMode('learn')}
            >
              Learn
            </button>
            <button
              type="button"
              className={`mode-btn chat ${mode === 'chat' ? 'active' : ''}`}
              onClick={() => setMode('chat')}
            >
              Chat
            </button>
          </div>
          <NeonButton variant="magenta" onClick={startChat}>
            Start
          </NeonButton>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        {conversations.length === 0 ? (
          <div className="empty-state">
            <p>No AI conversations yet.</p>
            <p>Start one to learn or chat for fun!</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Link key={conv.id} to={`/ai/${conv.id}`} className="list-row" style={{ display: 'flex', color: 'inherit' }}>
              <div className="list-row-content">
                <div className="list-row-title">{conv.title}</div>
                <div className="list-row-subtitle">{conv.mode === 'learn' ? 'Learn mode' : 'Chat mode'}</div>
              </div>
              <span className="ai-badge">AI</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
