import type { AiPersonality } from '@school-chat/shared';
import {
  findDefaultPersonality,
  findPersonalityBySlugOrId,
  getPersonalitySystemPrompt,
  listEnabledPersonalities,
  rowToPublicPersonality,
} from '../db/index.js';

export class PersonalityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersonalityError';
  }
}

/** Resolved personality used when building an AI chat request. */
export interface ResolvedPersonality {
  id: string;
  slug: string;
  name: string;
  systemPrompt: string;
}

/** Lists enabled teacher personalities without system prompts. */
export function getEnabledPersonalities(): AiPersonality[] {
  return listEnabledPersonalities();
}

/** Resolves a teacher personality by slug/id, or the default when omitted. */
export function resolvePersonality(idOrSlug?: string): ResolvedPersonality {
  const row = idOrSlug
    ? findPersonalityBySlugOrId(idOrSlug)
    : findDefaultPersonality() ?? findPersonalityBySlugOrId('general');

  if (!row || row.enabled !== 1) {
    throw new PersonalityError('Unknown or disabled teacher personality.');
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    systemPrompt: getPersonalitySystemPrompt(row),
  };
}

/** Returns the default teacher personality metadata. */
export function getDefaultPersonality(): AiPersonality {
  const row = findDefaultPersonality();
  if (!row) {
    throw new PersonalityError('Default teacher personality is not configured.');
  }
  return rowToPublicPersonality(row);
}
