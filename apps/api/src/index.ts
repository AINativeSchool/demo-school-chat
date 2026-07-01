import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { aiRoutes } from './routes/ai.js';

const PORT = Number(process.env.PORT ?? 3001);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

/** Starts the thin AI proxy server. */
async function start() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: WEB_ORIGIN,
    methods: ['POST', 'OPTIONS'],
  });

  await app.register(aiRoutes, { prefix: '/api' });

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`AI proxy listening on http://localhost:${PORT}`);
}

start();
