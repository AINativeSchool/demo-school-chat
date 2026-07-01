import type { AiMode } from '@school-chat/shared';
import './AIChatPanel.css';

interface AIChatPanelProps {
  mode: AiMode;
}

/** AI chat header with mode badge and disclaimer banner. */
export function AIChatPanel({ mode }: AIChatPanelProps) {
  return (
    <>
      <div className="ai-banner">
        You are chatting with AI — not a real person. AI can make mistakes — verify important facts.
      </div>
      <div className={`ai-mode-indicator ${mode}`}>
        <span className="ai-badge">AI</span>
        <span>{mode === 'learn' ? 'Learn mode' : 'Chat mode'}</span>
      </div>
    </>
  );
}
