import type { Conversation, ConversationSummary, Message, PublicUser } from '@school-chat/shared';
import { apiClient, ApiError } from '../api/client';

export class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatError';
  }
}

/** Maps API errors to chat errors for the UI layer. */
function wrapChatError(err: unknown): never {
  if (err instanceof ApiError) {
    throw new ChatError(err.message);
  }
  throw err;
}

/** Manages 1:1 conversations and messages via the shared API. */
export const chatService = {
  async getOrCreateConversation(friendUserId: string): Promise<Conversation> {
    try {
      const { conversation } = await apiClient.post<{ conversation: Conversation }>(
        `/conversations/with/${friendUserId}`,
      );
      return conversation;
    } catch (err) {
      wrapChatError(err);
    }
  },

  async listConversations(): Promise<ConversationSummary[]> {
    try {
      const { conversations } = await apiClient.get<{ conversations: ConversationSummary[] }>(
        '/conversations',
      );
      return conversations;
    } catch (err) {
      wrapChatError(err);
    }
  },

  async getMessages(conversationId: string, since?: string): Promise<Message[]> {
    try {
      const query = since ? `?since=${encodeURIComponent(since)}` : '';
      const { messages } = await apiClient.get<{ messages: Message[] }>(
        `/conversations/${conversationId}/messages${query}`,
      );
      return messages;
    } catch (err) {
      wrapChatError(err);
    }
  },

  async sendMessage(
    conversationId: string,
    payload: { content?: string; imageDataUrl?: string },
  ): Promise<Message> {
    try {
      const { message } = await apiClient.post<{ message: Message }>(
        `/conversations/${conversationId}/messages`,
        payload,
      );
      return message;
    } catch (err) {
      wrapChatError(err);
    }
  },

  async markAsRead(conversationId: string): Promise<void> {
    try {
      await apiClient.post(`/conversations/${conversationId}/read`);
    } catch (err) {
      wrapChatError(err);
    }
  },

  async getConversationWithUser(
    conversationId: string,
  ): Promise<{ conversation: Conversation; otherUser: PublicUser } | null> {
    try {
      const conversations = await this.listConversations();
      const summary = conversations.find((entry) => entry.conversation.id === conversationId);
      if (!summary) return null;
      return { conversation: summary.conversation, otherUser: summary.otherUser };
    } catch (err) {
      wrapChatError(err);
    }
  },
};
