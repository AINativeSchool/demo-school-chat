# School Friends Chat + AI

A neon-themed school chat app to talk to friends, teachers, and their AI assistants — an alternative to WhatsApp for your school life.

## Prerequisites

- Node.js 20+
- npm

## Quick start

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run dev
```

Edit `apps/api/.env` before chatting with AI:

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | Yes | Any non-empty value for local dev |
| `OPENAI_API_KEY` | For AI chat | See `LLM_*` vars in `.env.example` |

- Web: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001](http://localhost:3001)

Run API and web separately if needed: `npm run dev:api` / `npm run dev:web`.

## Features

- **Invite-only accounts** — register with a code (`SCHOOL01` for first use); username + password
- **1:1 friend chat** — text and images, read receipts, unread counts; syncs across devices via the API
- **Friend requests** — add by username, accept or decline
- **Invite codes** — generate and share from Settings
- **Teacher AI Twins** — Chat with AI Twins of your teachers
- **AI chat for fun** — chat with AI for entertainment
- **Neon WhatsApp-like UI** — dark theme, WhatsApp-familiar layout, full-width chat pages

## Tests

```bash
npm test
```

## Docs

| Document | Contents |
|----------|----------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Full local setup, env reference, contribution workflow |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production VPS deployment |
| [docs/AI_TWINS.md](docs/AI_TWINS.md) | Adding and editing Teacher AI Twins |
| [REQUIREMENTS.md](REQUIREMENTS.md) | Product requirements and feature checklist |
| [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md) | Architecture, API, and data model |
