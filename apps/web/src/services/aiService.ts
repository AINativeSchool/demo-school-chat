import type { AiConversation, AiMessage, AiMode } from '@school-chat/shared';
import { authService } from './authService';
import { storageService } from '../storage/storageService';

export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiError';
  }
}

const AI_API_URL = import.meta.env.VITE_AI_API_URL ?? '/api';

export const CASUAL_CHAT_TITLE = 'AI';
export const LEARN_CHAT_TITLE = 'Learn with AI';

/** Manages AI conversations locally and proxies chat requests to the API. */
export const aiService = {
  createConversation(mode: AiMode, title?: string): AiConversation {
    const user = authService.getCurrentUser();
    if (!user) throw new AiError('Not logged in.');

    const conversation: AiConversation = {
      id: storageService.generateId(),
      userId: user.id,
      title: title ?? (mode === 'learn' ? 'Learn chat' : 'Casual chat'),
      mode,
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

  /** Returns the default learn-mode thread, creating it on first access. */
  getOrCreateLearnChat(): AiConversation {
    const user = authService.getCurrentUser();
    if (!user) throw new AiError('Not logged in.');

    const learnConversations = storageService
      .getAiConversations()
      .filter((c) => c.userId === user.id && c.mode === 'learn');

    if (learnConversations.length > 0) {
      return learnConversations.sort((a, b) => {
        const aMessages = storageService.getAiMessages(a.id);
        const bMessages = storageService.getAiMessages(b.id);
        const aTime = aMessages[aMessages.length - 1]?.createdAt ?? a.createdAt;
        const bTime = bMessages[bMessages.length - 1]?.createdAt ?? b.createdAt;
        return bTime.localeCompare(aTime);
      })[0];
    }

    return this.createConversation('learn', LEARN_CHAT_TITLE);
  },

  /** Route path for the pinned learn-mode AI chat. */
  getLearnChatPath(): string {
    return `/ai/${this.getOrCreateLearnChat().id}`;
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

    const response = await fetch(`${AI_API_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: conversation.mode, messages: history }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new AiError(body.error ?? 'AI service unavailable. Is the API running?');
    }

    const data = await response.json();
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
    localStorage.setItem('schoolchat:ai_messages', JSON.stringify(map));
  },
};
