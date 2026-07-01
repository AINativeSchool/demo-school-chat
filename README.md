# School Friends Chat + AI

A neon-themed school chat app with a shared SQLite backend and an AI chatbot.

## Setup

```bash
npm install
```

Copy `apps/api/.env.example` to `apps/api/.env` and set at least `JWT_SECRET`. Add an LLM API key if you want AI chat.

## Development

Run both the API and web app:

```bash
npm run dev:api
npm run dev
```

- Web app: http://localhost:5173
- API: http://localhost:3001

The Vite dev server proxies `/api` requests to the API.

## First use

1. Make sure the API is running
2. Register with invite code `SCHOOL01`
3. Generate an invite code in Settings and share it with a friend on another device
4. Add friends by username, accept requests, and start chatting
5. Use the **Teacher** tab to pick a tutor, or the pinned **AI** chat on Chats for casual conversation (requires LLM keys in `apps/api/.env`)

## Tests

```bash
npm test
```

API integration tests use an in-memory SQLite database.

## Production on a VPS

Build the web app, then run the API with static file serving enabled:

```bash
npm run build
```

Set these env vars on the VPS:

```env
PORT=3001
WEB_ORIGIN=https://chat.yourdomain.com
JWT_SECRET=long-random-secret
DATABASE_PATH=/var/lib/schoolchat/data.db
SERVE_STATIC=true
WEB_DIST_PATH=/path/to/apps/web/dist
OPENAI_API_KEY=...
```

Start with a process manager:

```bash
pm2 start apps/api/src/index.ts --name school-chat --interpreter npx --interpreter-args tsx
```

Put Caddy or nginx in front for HTTPS:

```text
chat.yourdomain.com -> reverse proxy -> localhost:3001
```

Back up the SQLite file regularly:

```bash
cp /var/lib/schoolchat/data.db /var/backups/schoolchat-$(date +%F).db
```

## Data notes

- Accounts, friends, messages, and teacher personalities are stored in the shared SQLite database on the server
- AI conversation history stays in browser localStorage for now
- Image uploads are stored as base64 in SQLite and limited to about 2 MB
