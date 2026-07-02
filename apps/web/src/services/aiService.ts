import type { AiConversation, AiMessage, AiMode, AiPersonality } from '@school-chat/shared';
import { apiClient } from '../api/client';
import { authService } from './authService';
import { storageService } from '../storage/storageService';

export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiError';
  }
}

export const CASUAL_CHAT_TITLE = 'AI';

/** Saves the coach's opening message when a teacher thread has no messages yet. */
function seedOpeningMessageIfEmpty(conversationId: string, content: string): boolean {
  if (storageService.getAiMessages(conversationId).length > 0) return false;

  const message: AiMessage = {
    id: storageService.generateId(),
    aiConversationId: conversationId,
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  };
  storageService.appendAiMessage(conversationId, message);
  return true;
}

/** Manages AI conversations locally and proxies chat requests to the API. */
export const aiService = {
  async fetchPersonalities(): Promise<AiPersonality[]> {
    const data = await apiClient.get<{ personalities: AiPersonality[] }>('/ai/personalities');
    return data.personalities;
  },

  createConversation(
    mode: AiMode,
    title?: string,
    personality?: Pick<AiPersonality, 'slug' | 'name'>,
  ): AiConversation {
    const user = authService.getCurrentUser();
    if (!user) throw new AiError('Not logged in.');

    const conversation: AiConversation = {
      id: storageService.generateId(),
      userId: user.id,
      title: title ?? (mode === 'teacher' ? 'Teacher chat' : 'Casual chat'),
      mode,
      personalityId: personality?.slug,
      personalityName: personality?.name,
      createdAt: new Date().toISOString(),
    };

    const conversations = storageService.getAiConversations();
    conversations.push(conversation);
    storageService.saveAiConversations(conversations);
    return conversation;
  },

  listConversations(): AiConversation[] {
    const user = authService.getCurrentUser();
    if (!user) return [];

    return storageService
      .getAiConversations()
      .filter((c) => c.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** Returns one ongoing teacher thread per personality, creating it on first access. */
  getOrCreateTeacherChat(personality: AiPersonality): AiConversation {
    const user = authService.getCurrentUser();
    if (!user) throw new AiError('Not logged in.');

    const existing = storageService
      .getAiConversations()
      .find(
        (c) =>
          c.userId === user.id &&
          c.mode === 'teacher' &&
          c.personalityId === personality.slug,
      );

    if (existing) {
      if (personality.openingMessage) {
        seedOpeningMessageIfEmpty(existing.id, personality.openingMessage);
      }
      return existing;
    }

    const conversation = this.createConversation('teacher', personality.name, personality);
    if (personality.openingMessage) {
      seedOpeningMessageIfEmpty(conversation.id, personality.openingMessage);
    }
    return conversation;
  },

  /** Adds a coaching opener to empty teacher threads (e.g. legacy or missed on create). */
  async ensureTeacherOpening(conversationId: string): Promise<boolean> {
    const conversation = this.getConversation(conversationId);
    if (!conversation || conversation.mode !== 'teacher') return false;
    if (this.getMessages(conversationId).length > 0) return false;

    const personalities = await this.fetchPersonalities();

    // Re-check after async fetch - avoids duplicate openers under React Strict Mode.
    if (this.getMessages(conversationId).length > 0) return false;

    const personality =
      personalities.find((entry) => entry.slug === conversation.personalityId) ??
      personalities.find((entry) => entry.isDefault);

    if (!personality?.openingMessage) return false;

    return seedOpeningMessageIfEmpty(conversationId, personality.openingMessage);
  },

  /** Teacher threads with last message preview, sorted by recent activity. */
  listTeacherConversations(): Array<{ conversation: AiConversation; lastMessage?: AiMessage }> {
    const user = authService.getCurrentUser();
    if (!user) return [];

    return storageService
      .getAiConversations()
      .filter((c) => c.userId === user.id && c.mode === 'teacher')
      .map((conversation) => {
        const messages = this.getMessages(conversation.id);
        return { conversation, lastMessage: messages[messages.length - 1] };
      })
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.conversation.createdAt;
        const bTime = b.lastMessage?.createdAt ?? b.conversation.createdAt;
        return bTime.localeCompare(aTime);
      });
  },

  /** Returns the pinned casual chat thread, creating it on first access. */
  getOrCreateCasualChat(): AiConversation {
    const user = authService.getCurrentUser();
    if (!user) throw new AiError('Not logged in.');

    const chatConversations = storageService
      .getAiConversations()
      .filter((c) => c.userId === user.id && c.mode === 'chat');

    if (chatConversations.length > 0) {
      return chatConversations.sort((a, b) => {
        const aMessages = storageService.getAiMessages(a.id);
        const bMessages = storageService.getAiMessages(b.id);
        const aTime = aMessages[aMessages.length - 1]?.createdAt ?? a.createdAt;
        const bTime = bMessages[bMessages.length - 1]?.createdAt ?? b.createdAt;
        return bTime.localeCompare(aTime);
      })[0];
    }

    return this.createConversation('chat', CASUAL_CHAT_TITLE);
  },

  /** Preview data for the pinned AI row on the main chat list. */
  getCasualChatSummary(): { conversation: AiConversation; lastMessage?: AiMessage } {
    const conversation = this.getOrCreateCasualChat();
    const messages = this.getMessages(conversation.id);
    return { conversation, lastMessage: messages[messages.length - 1] };
  },

  getConversation(id: string): AiConversation | undefined {
    const user = authService.getCurrentUser();
    if (!user) return undefined;
    return storageService.getAiConversations().find((c) => c.id === id && c.userId === user.id);
  },

  getMessages(aiConversationId: string): AiMessage[] {
    return storageService
      .getAiMessages(aiConversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async sendMessage(aiConversationId: string, content: string): Promise<AiMessage> {
    const user = authService.getCurrentUser();
    if (!user) throw new AiError('Not logged in.');

    const conversation = this.getConversation(aiConversationId);
    if (!conversation) throw new AiError('Conversation not found.');

    const trimmed = content.trim();
    if (!trimmed) throw new AiError('Message cannot be empty.');

    const userMessage: AiMessage = {
      id: storageService.generateId(),
      aiConversationId,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    storageService.appendAiMessage(aiConversationId, userMessage);

    const history = this.getMessages(aiConversationId)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const payload: {
      mode: AiMode;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      personalityId?: string;
    } = {
      mode: conversation.mode,
      messages: history,
    };

    if (conversation.mode === 'teacher' && conversation.personalityId) {
      payload.personalityId = conversation.personalityId;
    }

    const data = await apiClient.post<{
      reply: { content: string };
      personality?: { name: string };
    }>('/ai/chat', payload);

    if (data.personality?.name && conversation.personalityName !== data.personality.name) {
      const conversations = storageService.getAiConversations().map((entry) =>
        entry.id === conversation.id
          ? { ...entry, personalityName: data.personality!.name, title: data.personality!.name }
          : entry,
      );
      storageService.saveAiConversations(conversations);
    }

    const assistantMessage: AiMessage = {
      id: storageService.generateId(),
      aiConversationId,
      role: 'assistant',
      content: data.reply.content,
      createdAt: new Date().toISOString(),
    };
    storageService.appendAiMessage(aiConversationId, assistantMessage);
    return assistantMessage;
  },

  deleteConversation(id: string): void {
    const user = authService.getCurrentUser();
    if (!user) throw new AiError('Not logged in.');

    const conversations = storageService
      .getAiConversations()
      .filter((c) => !(c.id === id && c.userId === user.id));
    storageService.saveAiConversations(conversations);

    const map = storageService.getAiMessagesMap();
    delete map[id];
    storageService.saveAiMessagesMap(map);
  },
};
