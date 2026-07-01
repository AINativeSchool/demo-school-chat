import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { initDb } from './db/index.js';
import { buildApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3001);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const DATABASE_PATH = process.env.DATABASE_PATH ?? path.join(__dirname, '../data/schoolchat.db');
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const SERVE_STATIC = process.env.SERVE_STATIC === 'true';
const WEB_DIST_PATH =
  process.env.WEB_DIST_PATH ?? path.join(__dirname, '../../web/dist');

/** Starts the shared API server for auth, chat, and AI. */
async function start() {
  initDb(DATABASE_PATH);

  const app = await buildApp({
    jwtSecret: JWT_SECRET,
    webOrigin: WEB_ORIGIN,
    serveStatic: SERVE_STATIC,
    webDistPath: WEB_DIST_PATH,
  });

  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`School Chat API listening on http://localhost:${PORT}`);
}

start();
