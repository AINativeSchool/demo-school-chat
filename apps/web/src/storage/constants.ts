/** localStorage keys for the school chat app. */
export const STORAGE_KEYS = {
  session: 'schoolchat:session',
  users: 'schoolchat:users',
  inviteCodes: 'schoolchat:invite_codes',
  friends: 'schoolchat:friends',
  conversations: 'schoolchat:conversations',
  messages: 'schoolchat:messages',
  readState: 'schoolchat:read_state',
  aiConversations: 'schoolchat:ai_conversations',
  aiMessages: 'schoolchat:ai_messages',
} as const;

export const DEFAULT_INVITE_CODE = 'SCHOOL01';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
