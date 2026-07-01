import type { FastifyInstance } from 'fastify';
import { authenticate, getAuthUserId } from '../middleware/auth.js';
import { chatService, ChatError } from '../services/chatService.js';
import { findUserById, toPublicUser } from '../db/index.js';

/** Registers 1:1 conversation and message routes. */
export async function conversationRoutes(app: FastifyInstance) {
  app.get('/conversations', { preHandler: authenticate }, async (request) => {
    const conversations = chatService.listConversations(getAuthUserId(request));
    return { conversations };
  });

  app.post('/conversations/with/:userId', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      const conversation = chatService.getOrCreateConversation(getAuthUserId(request), userId);
      const otherUser = findUserById(userId);
      return { conversation, otherUser: otherUser ? toPublicUser(otherUser) : null };
    } catch (err) {
      if (err instanceof ChatError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get('/conversations/:id/messages', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { since } = request.query as { since?: string };
    const conversation = chatService.getConversation(id);

    if (!conversation) {
      return reply.status(404).send({ error: 'Conversation not found.' });
    }

    const userId = getAuthUserId(request);
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      return reply.status(403).send({ error: 'Not authorized.' });
    }

    const messages = chatService.getMessages(id, since);
    return { messages };
  });

  app.post('/conversations/:id/messages', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { content?: string; imageDataUrl?: string };

    try {
      const message = chatService.sendMessage(getAuthUserId(request), id, body);
      return { message };
    } catch (err) {
      if (err instanceof ChatError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/conversations/:id/read', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const conversation = chatService.getConversation(id);

    if (!conversation) {
      return reply.status(404).send({ error: 'Conversation not found.' });
    }

    const userId = getAuthUserId(request);
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      return reply.status(403).send({ error: 'Not authorized.' });
    }

    chatService.markAsRead(userId, id);
    return { ok: true };
  });
}
