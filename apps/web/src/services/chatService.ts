import type { Conversation, ConversationSummary, Message } from '@school-chat/shared';
import { authService } from './authService';
import { friendService } from './friendService';
import { storageService } from '../storage/storageService';

export class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatError';
  }
}

/** Sort two user IDs for a stable conversation pair key. */
function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Manages 1:1 conversations and messages in localStorage. */
export const chatService = {
  getOrCreateConversation(friendUserId: string): Conversation {
    const current = authService.getCurrentUser();
    if (!current) throw new ChatError('Not logged in.');
    if (!friendService.areFriends(friendUserId)) {
      throw new ChatError('You must be friends to start a chat.');
    }
    if (friendService.isBlocked(friendUserId)) {
      throw new ChatError('Cannot message this user.');
    }

    const [userAId, userBId] = sortedPair(current.id, friendUserId);
    const conversations = storageService.getConversations();
    let conversation = conversations.find((c) => c.userAId === userAId && c.userBId === userBId);

    if (!conversation) {
      conversation = {
        id: storageService.generateId(),
        userAId,
        userBId,
        updatedAt: new Date().toISOString(),
      };
      conversations.push(conversation);
      storageService.saveConversations(conversations);
    }

    return conversation;
  },

  getUnreadCount(conversationId: string, currentUserId: string): number {
    const lastReadAt = storageService.getReadState()[conversationId];
    const messages = storageService.getMessages(conversationId);
    return messages.filter(
      (m) => m.senderId !== currentUserId && (!lastReadAt || m.createdAt > lastReadAt),
    ).length;
  },

  listConversations(): ConversationSummary[] {
    const current = authService.getCurrentUser();
    if (!current) return [];

    const users = storageService.getUsers();
    const conversations = storageService
      .getConversations()
      .filter((c) => c.userAId === current.id || c.userBId === current.id);

    return conversations
      .map((conversation) => {
        const otherId = conversation.userAId === current.id ? conversation.userBId : conversation.userAId;
        const otherUser = users.find((u) => u.id === otherId)!;
        const messages = storageService.getMessages(conversation.id);
        const lastMessage = messages[messages.length - 1];
        const unreadCount = this.getUnreadCount(conversation.id, current.id);

        return { conversation, otherUser, lastMessage, unreadCount };
      })
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.conversation.updatedAt;
        const bTime = b.lastMessage?.createdAt ?? b.conversation.updatedAt;
        return bTime.localeCompare(aTime);
      });
  },

  getMessages(conversationId: string): Message[] {
    return storageService.getMessages(conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  sendMessage(
    conversationId: string,
    payload: { content?: string; imageDataUrl?: string },
  ): Message {
    const current = authService.getCurrentUser();
    if (!current) throw new ChatError('Not logged in.');

    const conversations = storageService.getConversations();
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation) throw new ChatError('Conversation not found.');

    const otherId =
      conversation.userAId === current.id ? conversation.userBId : conversation.userAId;

    if (!friendService.areFriends(otherId)) {
      throw new ChatError('You must be friends to send messages.');
    }
    if (friendService.isBlocked(otherId)) {
      throw new ChatError('Cannot message this user.');
    }

    if (!payload.content?.trim() && !payload.imageDataUrl) {
      throw new ChatError('Message cannot be empty.');
    }

    const message: Message = {
      id: storageService.generateId(),
      conversationId,
      senderId: current.id,
      content: payload.content?.trim(),
      imageDataUrl: payload.imageDataUrl,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    storageService.appendMessage(conversationId, message);

    conversation.updatedAt = message.createdAt;
    storageService.saveConversations(conversations);

    return message;
  },

  markAsRead(conversationId: string): void {
    storageService.setReadState(conversationId, new Date().toISOString());
  },

  getConversation(conversationId: string): Conversation | undefined {
    return storageService.getConversations().find((c) => c.id === conversationId);
  },
};
