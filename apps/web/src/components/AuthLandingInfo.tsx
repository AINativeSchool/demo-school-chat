import { Link } from 'react-router-dom';
import { DEFAULT_INVITE_CODE } from '../storage/constants';

const TOP_FEATURES = [
  'Chat with school friends',
  'Share notes and files with classmates in chat',
  "Solve doubts with help from Teacher's AI Twins when they are busy",
  'Casual talk to AI for entertainment',
] as const;

/** Left-side landing copy: features and get-started steps (no card wrapper). */
export function AuthLandingInfo({ showRegisterLink = true }: { showRegisterLink?: boolean }) {
  return (
    <div className="auth-landing-info">
      <p className="auth-landing-eyebrow">School Chat</p>
      <h1 className="auth-landing-title">Your school life, in one chat app</h1>
      <p className="auth-landing-lead">
        Message friends, share notes and files, get help from AI teacher twins, and unwind with
        casual AI chat.
      </p>

      <section className="auth-landing-section" aria-label="Features">
        <h2 className="auth-landing-heading">What you can do</h2>
        <ul className="auth-landing-features">
          {TOP_FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>

      <section className="auth-landing-section" aria-label="Get started">
        <h2 className="auth-landing-heading">Get started</h2>
        <ol className="auth-landing-steps">
          <li>
            Register with invite code <code className="invite-code">{DEFAULT_INVITE_CODE}</code>
          </li>
          <li>Add friends by username from the Friends tab</li>
          <li>Start chatting with friends or AI teachers</li>
        </ol>
        {showRegisterLink && (
          <Link className="auth-landing-register-link" to={`/register?code=${DEFAULT_INVITE_CODE}`}>
            Create an account →
          </Link>
        )}
      </section>
    </div>
  );
}