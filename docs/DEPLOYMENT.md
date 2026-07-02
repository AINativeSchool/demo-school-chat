# Deployment

Put School Friends Chat + AI live on a single VPS. For local setup and contributing, see [CONTRIBUTING.md](../CONTRIBUTING.md).

Architecture and env reference: [TECHNICAL_DESIGN.md](../TECHNICAL_DESIGN.md).

---

## Overview

Recommended production layout:

```text
Internet → HTTPS (Caddy/nginx) → Node (Fastify on :3001)
                                      ├── REST API + SQLite
                                      └── static web app (apps/web/dist)
```

One Node process serves both the API and the built React app (`SERVE_STATIC=true`).

---

## Prerequisites

- VPS with Node.js 20+
- Domain pointing at the server (e.g. `chat.yourdomain.com`)
- Reverse proxy for TLS (Caddy or nginx)
- Process manager (PM2, systemd, or similar)
- Writable path for the SQLite database (e.g. `/var/lib/schoolchat/`)

---

## 1. Build

On the server or in CI, from the repo root:

```bash
npm install
npm run build
```

Output: `apps/web/dist`

---

## 2. Production environment

Create `apps/api/.env` on the server (or inject via PM2/systemd):

```env
PORT=3001
WEB_ORIGIN=https://chat.yourdomain.com
JWT_SECRET=long-random-secret
DATABASE_PATH=/var/lib/schoolchat/data.db
SERVE_STATIC=true
WEB_DIST_PATH=/path/to/repo/apps/web/dist
BASE_PATH=/chat
OPENAI_API_KEY=...
```

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | Yes | Long random string; never reuse dev secrets |
| `WEB_ORIGIN` | Yes | Public HTTPS origin — used for CORS |
| `DATABASE_PATH` | Yes | Persistent path outside the repo if possible |
| `SERVE_STATIC` | Yes | Must be `true` |
| `WEB_DIST_PATH` | Yes | Absolute path to `apps/web/dist` |
| `BASE_PATH` | No | Host the app under a sub-path (e.g. `/chat`). Leave empty for root |
| `OPENAI_API_KEY` | For AI | See `apps/api/.env.example` for `LLM_*` options |
| `PORT` | No | Default `3001` |

Create the database directory and restrict permissions:

```bash
sudo mkdir -p /var/lib/schoolchat
sudo chown "$USER" /var/lib/schoolchat
```

---

## 3. Start the process

Example with PM2:

```bash
pm2 start apps/api/src/index.ts --name school-chat --interpreter npx --interpreter-args tsx
pm2 save
pm2 startup   # follow printed instructions for reboot persistence
```

Entrypoint: `apps/api/src/index.ts`

After deploys that change seed data or personalities, restart the process so SQLite backfill runs.

---

## 4. HTTPS reverse proxy

Point DNS at the VPS, then proxy to `localhost:3001`:

```text
chat.yourdomain.com  →  Caddy/nginx  →  http://127.0.0.1:3001
```

`WEB_ORIGIN` must match the public URL (`https://…`).

**Caddy (minimal):**

```text
chat.yourdomain.com {
    reverse_proxy localhost:3001
}
```

If you deploy under a sub-path like `/chat`, keep the same reverse proxy. The app will serve:

- the SPA at `/chat`
- hashed assets at `/chat/assets/*`
- the API at `/chat/api/*`

---

## 5. Backups

All server-side data lives in one SQLite file (`DATABASE_PATH`):

- Users, friends, messages, invite codes, teacher personalities

Schedule regular copies:

```bash
cp /var/lib/schoolchat/data.db /var/backups/schoolchat-$(date +%F).db
```

AI conversation history is stored in each user's browser (`localStorage`) and is **not** in this file.

---

## 6. Post-deploy checks

1. Open `https://chat.yourdomain.com` — web app loads
2. Register with invite code `SCHOOL01` (or a code you seeded)
3. API health: `curl -s https://chat.yourdomain.com/api/ai/personalities` returns JSON
4. Friend chat works between two devices on the same server
5. AI chat works if LLM keys are set

---

## Updating production

```bash
git pull
npm install
npm run build
pm2 restart school-chat
```

If personality seed data changed in `apps/api/src/db/index.ts`, the restart applies backfill automatically.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Blank page | `SERVE_STATIC=true`, correct `WEB_DIST_PATH`, `npm run build` ran |
| CORS errors | `WEB_ORIGIN` matches the browser URL exactly |
| 401 on API | `JWT_SECRET` unchanged between restarts (changing it invalidates tokens) |
| AI not replying | `OPENAI_API_KEY` / `LLM_*` in production env |
| Old teacher names | Restart API after seed changes |
