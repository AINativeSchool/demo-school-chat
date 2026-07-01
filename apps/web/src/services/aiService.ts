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
