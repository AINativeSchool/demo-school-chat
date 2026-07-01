import type { FastifyInstance } from 'fastify';
import { authenticate, getAuthUserId } from '../middleware/auth.js';
import { authService, AuthError, buildAuthResponse } from '../services/authService.js';

/** Registers authentication and profile routes. */
export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = request.body as {
      inviteCode?: string;
      username?: string;
      password?: string;
      displayName?: string;
    };

    try {
      const { user } = await authService.register(
        body.inviteCode ?? '',
        body.username ?? '',
        body.password ?? '',
        body.displayName ?? '',
      );
      return buildAuthResponse(user, (payload) => app.jwt.sign(payload));
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const body = request.body as { username?: string; password?: string };

    try {
      const { user } = await authService.login(body.username ?? '', body.password ?? '');
      return buildAuthResponse(user, (payload) => app.jwt.sign(payload));
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(401).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get('/auth/me', { preHandler: authenticate }, async (request) => {
    const userId = getAuthUserId(request);
    return { user: authService.getMe(userId) };
  });

  app.patch('/auth/me', { preHandler: authenticate }, async (request, reply) => {
    const body = request.body as { displayName?: string; avatarUrl?: string };

    try {
      const user = authService.updateProfile(getAuthUserId(request), body);
      return { user };
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });
}
