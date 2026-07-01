/** Shared domain types for the school chat app. */

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export type AiMode = 'teacher' | 'chat';

/** Public tutor metadata - safe to send to the browser (no system prompt). */
export interface AiPersonality {
  id: string;
  slug: string;
  name: string;
  /** @deprecated Use expertiseLabels - kept for older clients. */
  description: string;
  /** Short expertise tags (one or two words each) shown on the Teacher picker. */
  expertiseLabels: string[];
  /** Coaching opener shown when a new teacher thread starts. */
  openingMessage?: string;
  accentColor?: string;
  icon?: string;
  isDefault: boolean;
  sortOrder: number;
}

export type AiRole = 'user' | 'assistant' | 'system';

export interface User {
  id: string;
  passwordHash: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

/** User record safe to send to clients (no password hash). */
export type PublicUser = Omit<User, 'passwordHash'>;

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface Session {
  userId: string;
  username: string;
  displayName: string;
}

export interface InviteCode {
  code: string;
  createdBy: string;
  maxUses: number;
  useCount: number;
  expiresAt?: string;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userAId: string;
  userBId: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  imageDataUrl?: string;
  status: MessageStatus;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  mode: AiMode;
  /** Personality slug for teacher-mode threads, e.g. "math". */
  personalityId?: string;
  /** Cached display name for chat headers. */
  personalityName?: string;
  createdAt: string;
}

export interface AiMessage {
  id: string;
  aiConversationId: string;
  role: AiRole;
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  conversation: Conversation;
  otherUser: User;
  lastMessage?: Message;
  unreadCount: number;
}

export interface PendingRequests {
  incoming: Array<Friendship & { user: User }>;
  outgoing: Array<Friendship & { user: User }>;
}
