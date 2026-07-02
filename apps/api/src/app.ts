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
  basePath?: string;
}

function normalizeBasePath(basePath: string | undefined): string {
  const raw = (basePath ?? '').trim();
  if (!raw) return '';
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const withoutTrailingSlash = withLeadingSlash.endsWith('/')
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
  return withoutTrailingSlash;
}

/** Builds the Fastify app used by the server and tests. */
export async function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: false });

  const basePath = normalizeBasePath(options.basePath ?? process.env.BASE_PATH);
  const apiPrefix = `${basePath}/api`;

  await app.register(cors, {
    origin: options.webOrigin ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(jwt, {
    secret: options.jwtSecret ?? 'test-secret',
  });

  await app.register(authRoutes, { prefix: apiPrefix });
  await app.register(inviteRoutes, { prefix: apiPrefix });
  await app.register(friendRoutes, { prefix: apiPrefix });
  await app.register(conversationRoutes, { prefix: apiPrefix });
  await app.register(aiRoutes, { prefix: apiPrefix });

  if (options.serveStatic) {
    const distPath = options.webDistPath ?? path.join(__dirname, '../../web/dist');
    await app.register(fastifyStatic, {
      root: distPath,
      prefix: `${basePath}/`,
    });

    const spaPrefix = `${basePath}/` || '/';
    app.get(spaPrefix, async (_request, reply) => reply.sendFile('index.html'));
    if (basePath) {
      app.get('/', async (_request, reply) => reply.redirect(spaPrefix));
    }

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith(apiPrefix)) {
        return reply.status(404).send({ error: 'Not found.' });
      }

      // If hosted under a sub-path (e.g. /chat), redirect root traffic to that entrypoint.
      if (basePath && request.url === '/') {
        return reply.redirect(spaPrefix);
      }

      // Some clients/proxies hit the base path without a trailing slash (e.g. /chat).
      // Serve the SPA directly instead of relying on redirects.
      if (basePath && request.url === basePath) {
        return reply.sendFile('index.html');
      }

      // SPA-fallback only under the configured base path.
      if (basePath && request.url.startsWith(`${basePath}/`)) {
        return reply.sendFile('index.html');
      }

      // If no basePath is configured, keep the old behavior: root SPA.
      if (!basePath) {
        return reply.sendFile('index.html');
      }

      return reply.status(404).send({ error: 'Not found.' });
    });
  }

  return app;
}
