/** Shared domain types for the school chat app. */

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export type AiMode = 'learn' | 'chat';

export type AiRole = 'user' | 'assistant' | 'system';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  email: string;
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
