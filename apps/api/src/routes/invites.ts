import type { FastifyInstance } from 'fastify';
import { authenticate, getAuthUserId } from '../middleware/auth.js';
import { authService, AuthError } from '../services/authService.js';

/** Registers invite code routes. */
export async function inviteRoutes(app: FastifyInstance) {
  app.post('/invites', { preHandler: authenticate }, async (request, reply) => {
    try {
      const code = authService.generateInviteCode(getAuthUserId(request));
      return { code };
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get('/invites/mine', { preHandler: authenticate }, async (request) => {
    const codes = authService.listMyInviteCodes(getAuthUserId(request));
    return { codes };
  });
}
