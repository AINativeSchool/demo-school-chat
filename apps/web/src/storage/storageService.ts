import type {
  AiConversation,
  AiMessage,
  Conversation,
  Friendship,
  InviteCode,
  Message,
  Session,
  User,
} from '@school-chat/shared';
import { DEFAULT_INVITE_CODE, STORAGE_KEYS } from './constants';
import { safeStorage } from './safeStorage';

/** Read JSON from localStorage with a fallback default. */
function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = safeStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Write JSON to localStorage. */
function writeJson<T>(key: string, value: T): void {
  safeStorage.setItem(key, JSON.stringify(value));
}

/** Single persistence boundary for all app data in localStorage. */
export const storageService = {
  generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  },

  seedDefaults(): void {
    const codes = this.getInviteCodes();
    if (codes.length === 0) {
      this.saveInviteCodes([
        {
          code: DEFAULT_INVITE_CODE,
          createdBy: 'system',
          maxUses: 100,
          useCount: 0,
        },
      ]);
    }
  },

  getSession(): Session | null {
    return readJson<Session | null>(STORAGE_KEYS.session, null);
  },

  setSession(session: Session | null): void {
    if (session) {
      writeJson(STORAGE_KEYS.session, session);
    } else {
      safeStorage.removeItem(STORAGE_KEYS.session);
    }
  },

  getUsers(): User[] {
    return readJson<User[]>(STORAGE_KEYS.users, []);
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    writeJson(STORAGE_KEYS.users, users);
  },

  findUserByUsername(username: string): User | undefined {
    return this.getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
  },

  getInviteCodes(): InviteCode[] {
    return readJson<InviteCode[]>(STORAGE_KEYS.inviteCodes, []);
  },

  saveInviteCodes(codes: InviteCode[]): void {
    writeJson(STORAGE_KEYS.inviteCodes, codes);
  },

  getFriendships(): Friendship[] {
    return readJson<Friendship[]>(STORAGE_KEYS.friends, []);
  },

  saveFriendships(friendships: Friendship[]): void {
    writeJson(STORAGE_KEYS.friends, friendships);
  },

  getConversations(): Conversation[] {
    return readJson<Conversation[]>(STORAGE_KEYS.conversations, []);
  },

  saveConversations(conversations: Conversation[]): void {
    writeJson(STORAGE_KEYS.conversations, conversations);
  },

  getMessagesMap(): Record<string, Message[]> {
    return readJson<Record<string, Message[]>>(STORAGE_KEYS.messages, {});
  },

  getMessages(conversationId: string): Message[] {
    return this.getMessagesMap()[conversationId] ?? [];
  },

  appendMessage(conversationId: string, message: Message): void {
    const map = this.getMessagesMap();
    const messages = map[conversationId] ?? [];
    messages.push(message);
    map[conversationId] = messages;
    writeJson(STORAGE_KEYS.messages, map);
  },

  getReadState(): Record<string, string> {
    return readJson<Record<string, string>>(STORAGE_KEYS.readState, {});
  },

  setReadState(conversationId: string, lastReadAt: string): void {
    const state = this.getReadState();
    state[conversationId] = lastReadAt;
    writeJson(STORAGE_KEYS.readState, state);
  },

  getAiConversations(): AiConversation[] {
    const raw = readJson<AiConversation[]>(STORAGE_KEYS.aiConversations, []);
    let migrated = false;

    const conversations = raw.map((conversation) => {
      let next = conversation;

      if ((next.mode as string) === 'learn') {
        migrated = true;
        next = { ...next, mode: 'teacher' };
      }

      if (next.mode === 'teacher' && !next.personalityId) {
        migrated = true;
        next = {
          ...next,
          personalityId: 'general',
          personalityName: next.personalityName ?? next.title ?? 'Pradeep Sir',
        };
      }

      return next;
    });

    if (migrated) {
      writeJson(STORAGE_KEYS.aiConversations, conversations);
    }

    return conversations;
  },

  saveAiConversations(conversations: AiConversation[]): void {
    writeJson(STORAGE_KEYS.aiConversations, conversations);
  },

  getAiMessagesMap(): Record<string, AiMessage[]> {
    return readJson<Record<string, AiMessage[]>>(STORAGE_KEYS.aiMessages, {});
  },

  getAiMessages(aiConversationId: string): AiMessage[] {
    return this.getAiMessagesMap()[aiConversationId] ?? [];
  },

  appendAiMessage(aiConversationId: string, message: AiMessage): void {
    const map = this.getAiMessagesMap();
    const messages = map[aiConversationId] ?? [];
    messages.push(message);
    map[aiConversationId] = messages;
    writeJson(STORAGE_KEYS.aiMessages, map);
  },

  saveAiMessagesMap(map: Record<string, AiMessage[]>): void {
    writeJson(STORAGE_KEYS.aiMessages, map);
  },

  /** Clear all data - useful for tests. */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => safeStorage.removeItem(key));
  },
};
