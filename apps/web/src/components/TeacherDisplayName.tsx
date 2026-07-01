import './TeacherDisplayName.css';

interface TeacherDisplayNameProps {
  name: string;
  className?: string;
}

/** Strips a legacy "[AI Twin]" prefix from cached personality names. */
export function normalizeTeacherName(name: string): string {
  return name.replace(/^\[AI Twin\]\s*/i, '').trim();
}

/** Renders the teacher name with a tiny AI Twin label after it. */
export function TeacherDisplayName({ name, className = '' }: TeacherDisplayNameProps) {
  return (
    <span className={`teacher-display-name ${className}`.trim()}>
      <span className="teacher-display-name__name">{normalizeTeacherName(name)}</span>
      <span className="ai-twin-label">AI Twin</span>
    </span>
  );
}
