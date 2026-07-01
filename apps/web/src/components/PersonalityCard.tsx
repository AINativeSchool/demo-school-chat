import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Calculator,
  Code,
  GraduationCap,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import type { AiPersonality } from '@school-chat/shared';
import { TeacherDisplayName } from './TeacherDisplayName';
import './PersonalityCard.css';

interface PersonalityCardProps {
  personality: AiPersonality;
  onSelect: () => void;
}

/** Maps personality icon slugs to Lucide icons. */
function getPersonalityIcon(icon?: string): LucideIcon {
  switch (icon) {
    case 'calculator':
      return Calculator;
    case 'code':
      return Code;
    case 'sparkles':
      return Sparkles;
    case 'lightbulb':
      return Lightbulb;
    default:
      return GraduationCap;
  }
}

/** Selectable teacher personality tile on the Teacher page. */
export function PersonalityCard({ personality, onSelect }: PersonalityCardProps) {
  const Icon = getPersonalityIcon(personality.icon);
  const accent = personality.accentColor ?? 'var(--neon-cyan)';
  const expertiseLabels =
    personality.expertiseLabels?.length > 0
      ? personality.expertiseLabels
      : personality.description
          .split(',')
          .map((label) => label.trim())
          .filter(Boolean);

  return (
    <button
      type="button"
      className="personality-card"
      onClick={onSelect}
      style={{ '--personality-accent': accent } as CSSProperties}
    >
      <div className="personality-card__icon">
        <Icon size={24} />
      </div>
      <div className="personality-card__body">
        <div className="personality-card__name">
          <TeacherDisplayName name={personality.name} />
        </div>
        {expertiseLabels.length > 0 && (
          <div className="personality-card__expertise">
            {expertiseLabels.map((label) => (
              <span
                key={label}
                className="expertise-label"
                style={{ '--personality-accent': accent } as CSSProperties}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
