import type { FastifyReply, FastifyRequest } from 'fastify';

/** JWT payload stored on authenticated requests. */
export interface JwtUser {
  userId: string;
  username: string;
}

/** Verifies the Bearer token and attaches the user id to the request. */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: 'Unauthorized.' });
  }
}

/** Reads the authenticated user id from a verified JWT. */
export function getAuthUserId(request: FastifyRequest): string {
  const payload = request.user as JwtUser;
  return payload.userId;
}
