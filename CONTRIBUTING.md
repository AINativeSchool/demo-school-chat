# Contributing

Thank you for helping improve School Friends Chat + AI. Follow the workflow below for new work; use **Local development** to run the app on your machine.

---

## Workflow: requirements → design → code

Do **not** jump straight to coding for new features or behaviour changes. Work in this order:

### 1. Requirements (`REQUIREMENTS.md`)

Start here. Describe **what** users need and **why**, not implementation details.

- Add or update user-facing behaviour in plain language
- Scope v1 clearly — defer nice-to-haves when they distract from the main goal
- Mark completed items with ✅ when shipped
- Call out non-goals and open questions

**Done when:** Someone who has not read the code can understand the feature and how to tell if it works.

### 2. Technical design (`TECHNICAL_DESIGN.md`)

Turn approved requirements into **how** the system will work.

- Data model changes (SQLite tables, `localStorage` keys, shared types)
- API routes and request/response shapes
- Frontend pages, services, and key UI flows
- Migration or backfill notes for existing deployments
- Link to focused docs under `docs/` when a topic deserves its own guide (e.g. [personalities](docs/PERSONALITIES.md))

**Done when:** A contributor knows which files to touch and what “correct” looks like before writing code.

### 3. Implementation

Only after requirements and design are aligned (or explicitly marked as a small fix exempt from design).

| Area | Location |
|------|----------|
| Shared types | `packages/shared/src/types.ts` |
| API routes & DB | `apps/api/src/` |
| Web UI | `apps/web/src/` |
| Tests | `apps/api/src/app.test.ts` (keep to a small, meaningful set) |

Guidelines:

- Match existing patterns — naming, file layout, neon UI, service boundaries
- Minimize scope; avoid drive-by refactors
- Update `REQUIREMENTS.md` / `TECHNICAL_DESIGN.md` if behaviour or architecture changed
- Add or adjust docs in `docs/` when operators or contributors need a runbook

### 4. Verify

```bash
npm test
npm run dev   # smoke-test in the browser
```

For API or personality changes, restart the API so SQLite seed/backfill runs.

---

## Local development

### Prerequisites

- Node.js 20+
- npm (workspaces monorepo: `apps/web`, `apps/api`, `packages/shared`)

### Setup

```bash
npm install
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:

| Variable | Dev default | Notes |
|----------|-------------|-------|
| `JWT_SECRET` | `change-me-in-production` | Any non-empty value is fine locally |
| `PORT` | `3001` | API port |
| `WEB_ORIGIN` | `http://localhost:5173` | Vite dev origin |
| `DATABASE_PATH` | `./data/schoolchat.db` | Created automatically |
| `SERVE_STATIC` | `false` | Vite serves the web app in dev |
| `OPENAI_API_KEY` | — | Required for AI chat; see `LLM_*` in `.env.example` |

### Run

Both API and web (recommended):

```bash
npm run dev
```

Or separately:

```bash
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:5173 — proxies /api to the API
```

### First use

1. Register with invite code **`SCHOOL01`**
2. Generate an invite in **Settings** and share it with a friend on another device
3. Add friends by username, accept requests, and chat
4. **Teacher** tab — pick an AI Twin tutor
5. **Chats** — pinned **AI** row for casual conversation (needs LLM keys)

Cross-device friend chat requires both clients to hit the same running API.

### Data notes (dev)

| Data | Where |
|------|--------|
| Users, friends, messages, invite codes, teacher personalities | `DATABASE_PATH` (SQLite) |
| AI conversation history | Browser `localStorage` per device |
| Image attachments | Base64 in SQLite (~2 MB limit) |

AI history does not sync across browsers. Clearing site data removes local AI threads.

---

## Tests

```bash
npm test
```

API integration tests use an in-memory SQLite database — production data is never touched.

---

## Repository layout

```text
apps/api/          Fastify API, SQLite, AI personalities seed
apps/web/          React + Vite frontend
packages/shared/   Types shared by api and web
docs/              Operational and contributor guides
REQUIREMENTS.md    Product requirements
TECHNICAL_DESIGN.md Architecture and API reference
```

---

## Docs index

| Document | Use when |
|----------|----------|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Going live on a VPS |
| [docs/PERSONALITIES.md](docs/PERSONALITIES.md) | Adding or editing Teacher AI Twins |
| [REQUIREMENTS.md](REQUIREMENTS.md) | Defining or checking product scope |
| [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md) | Architecture and API details |

---

## Pull requests (informal)

- One logical change per PR when possible
- Include a short summary: requirement → design → what changed
- Note any manual steps (API restart, env vars, DB backfill)
- Do not commit secrets (`.env`, API keys)

---

## Small fixes

Typos, obvious bugs, and styling tweaks that do **not** change behaviour may skip a full design pass. If unsure, add a one-line note to `TECHNICAL_DESIGN.md` or the relevant `docs/` file anyway.
