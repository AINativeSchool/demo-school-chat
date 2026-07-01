import { Link } from 'react-router-dom';
import './OnboardingEmptyState.css';

interface OnboardingEmptyStateProps {
  displayName?: string;
  compact?: boolean;
}

/** Welcome screen shown when a new user has no friends yet. */
export function OnboardingEmptyState({ displayName, compact = false }: OnboardingEmptyStateProps) {
  const greeting = displayName ? `Welcome, ${displayName}!` : 'Welcome!';

  return (
    <div className={`onboarding-empty ${compact ? 'onboarding-empty--compact' : ''}`}>
      <h1 className="onboarding-empty__title">{greeting}</h1>
      <p className="onboarding-empty__text">
        {compact
          ? 'Add school friends to start messaging. Tap AI above to chat for fun, or use Teacher in the menu to study.'
          : 'Add school friends to start chatting. You can also try the AI helper to learn something new or just chat for fun.'}
      </p>
      <div className="onboarding-empty__actions">
        <Link to="/friends" className="neon-btn neon-btn--cyan">
          Add Friend
        </Link>
        {!compact && (
          <Link to="/ai" className="neon-btn neon-btn--ghost">
            Teacher AI
          </Link>
        )}
      </div>
    </div>
  );
}
