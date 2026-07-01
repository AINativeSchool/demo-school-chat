import type { FastifyInstance } from 'fastify';
import { authenticate, getAuthUserId } from '../middleware/auth.js';
import { friendService, FriendError } from '../services/friendService.js';

/** Registers friend request and block routes. */
export async function friendRoutes(app: FastifyInstance) {
  app.get('/friends', { preHandler: authenticate }, async (request) => {
    const friends = friendService.getFriends(getAuthUserId(request));
    return { friends };
  });

  app.get('/friends/pending', { preHandler: authenticate }, async (request) => {
    return friendService.getPendingRequests(getAuthUserId(request));
  });

  app.post('/friends/request', { preHandler: authenticate }, async (request, reply) => {
    const body = request.body as { username?: string };

    try {
      const friendship = friendService.sendRequest(getAuthUserId(request), body.username ?? '');
      return { friendship };
    } catch (err) {
      if (err instanceof FriendError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/friends/:id/accept', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      friendService.acceptRequest(getAuthUserId(request), id);
      return { ok: true };
    } catch (err) {
      if (err instanceof FriendError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/friends/:id/decline', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      friendService.declineRequest(id);
      return { ok: true };
    } catch (err) {
      if (err instanceof FriendError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.delete('/friends/:userId', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      friendService.unfriend(getAuthUserId(request), userId);
      return { ok: true };
    } catch (err) {
      if (err instanceof FriendError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/friends/:userId/block', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      friendService.blockUser(getAuthUserId(request), userId);
      return { ok: true };
    } catch (err) {
      if (err instanceof FriendError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });
}
