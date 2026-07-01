import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import { aiRoutes } from './routes/ai.js';
import { authRoutes } from './routes/auth.js';
import { inviteRoutes } from './routes/invites.js';
import { friendRoutes } from './routes/friends.js';
import { conversationRoutes } from './routes/conversations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface AppOptions {
  jwtSecret?: string;
  webOrigin?: string;
  serveStatic?: boolean;
  webDistPath?: string;
}

/** Builds the Fastify app used by the server and tests. */
export async function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: options.webOrigin ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(jwt, {
    secret: options.jwtSecret ?? 'test-secret',
  });

  await app.register(authRoutes, { prefix: '/api' });
  await app.register(inviteRoutes, { prefix: '/api' });
  await app.register(friendRoutes, { prefix: '/api' });
  await app.register(conversationRoutes, { prefix: '/api' });
  await app.register(aiRoutes, { prefix: '/api' });

  if (options.serveStatic) {
    const distPath = options.webDistPath ?? path.join(__dirname, '../../web/dist');
    await app.register(fastifyStatic, {
      root: distPath,
      prefix: '/',
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api')) {
        return reply.status(404).send({ error: 'Not found.' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
