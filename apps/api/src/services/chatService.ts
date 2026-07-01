import type { Conversation, ConversationSummary, Message } from '@school-chat/shared';
import {
  appendMessage,
  findConversationById,
  findUserById,
  generateId,
  getConversations,
  getLastReadAt,
  getMessages,
  saveConversation,
  setReadState,
  sortedPair,
  toPublicUser,
} from '../db/index.js';
import { friendService } from './friendService.js';

export class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatError';
  }
}

/** Server-side 1:1 conversation and message management. */
export const chatService = {
  getOrCreateConversation(currentUserId: string, friendUserId: string): Conversation {
    if (!friendService.areFriends(currentUserId, friendUserId)) {
      throw new ChatError('You must be friends to start a chat.');
    }
    if (friendService.isBlocked(currentUserId, friendUserId)) {
      throw new ChatError('Cannot message this user.');
    }

    const [userAId, userBId] = sortedPair(currentUserId, friendUserId);
    const conversations = getConversations();
    let conversation = conversations.find((c) => c.userAId === userAId && c.userBId === userBId);

    if (!conversation) {
      conversation = {
        id: generateId(),
        userAId,
        userBId,
        updatedAt: new Date().toISOString(),
      };
      saveConversation(conversation);
    }

    return conversation;
  },

  getUnreadCount(conversationId: string, currentUserId: string): number {
    const lastReadAt = getLastReadAt(currentUserId, conversationId);
    const messages = getMessages(conversationId);
    return messages.filter(
      (m) => m.senderId !== currentUserId && (!lastReadAt || m.createdAt > lastReadAt),
    ).length;
  },

  listConversations(currentUserId: string): ConversationSummary[] {
    const conversations = getConversations().filter(
      (c) => c.userAId === currentUserId || c.userBId === currentUserId,
    );

    return conversations
      .map((conversation) => {
        const otherId =
          conversation.userAId === currentUserId ? conversation.userBId : conversation.userAId;
        const otherUser = findUserById(otherId)!;
        const messages = getMessages(conversation.id);
        const lastMessage = messages[messages.length - 1];
        const unreadCount = this.getUnreadCount(conversation.id, currentUserId);

        return {
          conversation,
          otherUser: toPublicUser(otherUser),
          lastMessage,
          unreadCount,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.conversation.updatedAt;
        const bTime = b.lastMessage?.createdAt ?? b.conversation.updatedAt;
        return bTime.localeCompare(aTime);
      });
  },

  getMessages(conversationId: string, since?: string): Message[] {
    return getMessages(conversationId, since);
  },

  sendMessage(
    currentUserId: string,
    conversationId: string,
    payload: { content?: string; imageDataUrl?: string },
  ): Message {
    const conversation = findConversationById(conversationId);
    if (!conversation) throw new ChatError('Conversation not found.');

    const otherId =
      conversation.userAId === currentUserId ? conversation.userBId : conversation.userAId;

    if (!friendService.areFriends(currentUserId, otherId)) {
      throw new ChatError('You must be friends to send messages.');
    }
    if (friendService.isBlocked(currentUserId, otherId)) {
      throw new ChatError('Cannot message this user.');
    }
    if (!payload.content?.trim() && !payload.imageDataUrl) {
      throw new ChatError('Message cannot be empty.');
    }

    const message: Message = {
      id: generateId(),
      conversationId,
      senderId: currentUserId,
      content: payload.content?.trim(),
      imageDataUrl: payload.imageDataUrl,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    appendMessage(message);
    saveConversation({ ...conversation, updatedAt: message.createdAt });

    return message;
  },

  markAsRead(currentUserId: string, conversationId: string): void {
    setReadState(currentUserId, conversationId, new Date().toISOString());
  },

  getConversation(conversationId: string): Conversation | undefined {
    return findConversationById(conversationId);
  },
};
