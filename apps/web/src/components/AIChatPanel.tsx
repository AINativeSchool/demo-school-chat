import type { AiMode } from '@school-chat/shared';
import { TeacherDisplayName } from './TeacherDisplayName';
import './AIChatPanel.css';

interface AIChatPanelProps {
  mode: AiMode;
  personalityName?: string;
}

/** AI chat header with mode badge and disclaimer banner. */
export function AIChatPanel({ mode, personalityName }: AIChatPanelProps) {
  const modeLabel =
    mode === 'teacher'
      ? personalityName
        ? <TeacherDisplayName name={personalityName} />
        : 'Teacher mode'
      : 'Chat mode';

  return (
    <>
      <div className="ai-banner">
        You are chatting with AI - not a real person. AI can make mistakes - verify important facts.
      </div>
      <div className={`ai-mode-indicator ${mode}`}>
        <span className="ai-badge">AI</span>
        <span>{modeLabel}</span>
      </div>
    </>
  );
}
