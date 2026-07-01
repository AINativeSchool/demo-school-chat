import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AiPersonality } from '@school-chat/shared';
import { PersonalityCard } from '../components/PersonalityCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { TeacherDisplayName, normalizeTeacherName } from '../components/TeacherDisplayName';
import { useLocalStorageSync } from '../hooks/useLocalStorage';
import { aiService } from '../services/aiService';
import { formatListTime } from '../utils/formatTime';
import '../components/ConversationList.css';

/** Teacher page - pick a tutor personality and resume past sessions. */
export function AIPage() {
  const navigate = useNavigate();
  const { version } = useLocalStorageSync();
  const [personalities, setPersonalities] = useState<AiPersonality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    aiService
      .fetchPersonalities()
      .then(setPersonalities)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load teachers.');
      })
      .finally(() => setLoading(false));
  }, []);

  const recentSessions = useMemo(() => aiService.listTeacherConversations(), [version]);

  const handleSelect = (personality: AiPersonality) => {
    const conversation = aiService.getOrCreateTeacherChat(personality);
    navigate(`/ai/${conversation.id}`);
  };

  return (
    <div className="screen">
      <ScreenHeader title="Teacher" />

      <div className="page">
        <p className="teacher-ai-intro">Chat with your teacher&apos;s AI assistant</p>

        {error && <p className="error-text">{error}</p>}

        {loading ? (
          <div className="empty-state">Loading teachers...</div>
        ) : (
          <div className="personality-grid">
            {personalities.map((personality) => (
              <PersonalityCard
                key={personality.id}
                personality={personality}
                onSelect={() => handleSelect(personality)}
              />
            ))}
          </div>
        )}

        {recentSessions.length > 0 && (
          <>
            <h2 className="teacher-section-title">Recent sessions</h2>
            <div>
              {recentSessions.map(({ conversation, lastMessage }) => (
                <Link
                  key={conversation.id}
                  to={`/ai/${conversation.id}`}
                  className="conversation-row"
                  style={{ color: 'inherit' }}
                >
                  <div className="avatar avatar--ai">
                    {normalizeTeacherName(conversation.personalityName ?? conversation.title).charAt(0)}
                  </div>
                  <div className="conversation-row__body">
                    <div className="conversation-row__top">
                      <span className="conversation-row__name">
                        <TeacherDisplayName name={conversation.personalityName ?? conversation.title} />
                      </span>
                      <span className="conversation-row__time">
                        {formatListTime(lastMessage?.createdAt ?? conversation.createdAt)}
                      </span>
                    </div>
                    <div className="conversation-row__bottom">
                      <span className="conversation-row__preview">
                        {lastMessage
                          ? `${lastMessage.role === 'user' ? 'You: ' : ''}${lastMessage.content}`
                          : 'Tap to start learning'}
                      </span>
                      <span className="ai-badge">AI</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
