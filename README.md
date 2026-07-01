# School Friends Chat + AI

A neon-themed school chat app with localStorage persistence and an AI chatbot.

## Setup

```bash
npm install
```

### Web app

```bash
npm run dev
```

Opens at http://localhost:5173

### AI proxy (optional, for AI chat)

Copy `apps/api/.env.example` to `apps/api/.env` and add your LLM API key.

```bash
npm run dev:api
```

## First use

1. Register with invite code `SCHOOL01`
2. Log out and register a second account (or generate an invite in Settings)
3. Add friend by username, accept request, start chatting
4. Use the AI tab for Learn or Chat mode (requires API running)

## Tests

```bash
npm test
```

## Note

All data lives in browser localStorage on this device. Messages do not sync across devices in v1.
