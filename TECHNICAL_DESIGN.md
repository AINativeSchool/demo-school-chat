# Technical Design: School Friends Chat + AI (v1)

Based on [REQUIREMENTS.md](REQUIREMENTS.md). **Implemented** — monorepo with React frontend, Fastify API, and SQLite persistence.

## Decisions locked in

| Topic | Choice |
|-------|--------|
| Platform | Web only (mobile-responsive SPA) |
| Persistence | **SQLite** on server (`better-sqlite3`) for users, friends, messages; **localStorage** for AI history only |
| Registration | Invite code required; username is primary identity (no email) |
| Authentication | JWT bearer tokens; bcrypt password hashing |
| Messaging scope | 1:1 only (no groups) |
| Real-time updates | HTTP polling (~5 s), not WebSockets |
| AI integration | [resilient-llm](https://github.com/gitcommitshow/resilient-llm) via Fastify API proxy (keys stay server-side) |
| Visual design | Neon theme (dark + glowing accents); WhatsApp-familiar layout patterns |
| Cross-device sync | REST API + shared SQLite database |
| Deployment | Single VPS — Fastify serves API and optionally static web build |

---

## Architecture

```mermaid
flowchart TB
  subgraph client [Web Client]
    SPA[React SPA]
    LS[(localStorage — AI only)]
    ApiClient[apiClient]
  end

  subgraph server [Fastify API]
    Auth[Auth Routes]
    Friends[Friend Routes]
    Chat[Conversation Routes]
    AI[AI Route]
    DB[(SQLite)]
    LLM[resilient-llm]
  end

  SPA --> ApiClient
  SPA --> LS
  ApiClient -->|REST + JWT| Auth
  ApiClient --> Friends
  ApiClient --> Chat
  ApiClient -->|POST /ai/chat| AI
  Auth --> DB
  Friends --> DB
  Chat --> DB
  AI --> LLM
```

**Pattern:** The React SPA calls a **Fastify REST API** for auth, friends, and messaging. All shared data lives in SQLite on the server so two users on different computers see the same messages. AI conversation history stays client-side in `localStorage` and is sent to the AI proxy per request.

**Why this stack**

- **React + Vite** — fast dev, mobile-friendly UI
- **SQLite + Fastify** — minimal infra, no separate DB server, good for a small friend group on one VPS
- **HTTP polling** — simplest cross-device sync without WebSocket infrastructure
- **Thin AI proxy** — resilient-llm stays server-side; client sends mode + recent history in the request body

---

## Repository layout

```
an-intro-session-2/
├── REQUIREMENTS.md
├── TECHNICAL_DESIGN.md
├── README.md
├── package.json                 # npm workspaces root
├── apps/
│   ├── web/                     # React + Vite frontend
│   │   └── src/
│   │       ├── api/client.ts    # HTTP client with JWT
│   │       ├── services/        # auth, friend, chat, ai
│   │       ├── storage/         # localStorage (AI history only)
│   │       ├── hooks/           # useAuth, usePolling, useConversations
│   │       ├── pages/           # Login, Register, Chats, Chat, Friends, AI, Settings
│   │       └── components/      # ChatBubble, ConversationList, BottomNav, etc.
│   └── api/                     # Fastify REST API + AI proxy
│       └── src/
│           ├── db/index.ts      # SQLite schema + data access
│           ├── routes/          # auth, friends, conversations, invites, ai
│           ├── services/        # auth, friend, chat, ai
│           └── middleware/auth.ts
└── packages/
    └── shared/                  # shared TypeScript types
```

---

## Data model

### Server (SQLite)

```mermaid
erDiagram
  users ||--o{ invite_codes : creates
  users ||--o{ friendships : participates
  users ||--o{ messages : sends
  conversations ||--o{ messages : contains

  users {
    string id PK
    string password_hash
    string display_name
    string username UK
    string avatar_url
    timestamp created_at
  }

  invite_codes {
    string code PK
    string created_by
    int max_uses
    int use_count
    timestamp expires_at
  }

  friendships {
    string id PK
    string requester_id
    string addressee_id
    enum status
    timestamp created_at
  }

  conversations {
    string id PK
    string user_a_id
    string user_b_id
    timestamp updated_at
  }

  messages {
    string id PK
    string conversation_id
    string sender_id
    text content
    string image_data_url
    enum status
    timestamp created_at
  }
```

### Client (localStorage — AI only)

| Key | Type | Contents |
|-----|------|----------|
| `schoolchat:ai_conversations` | array | AI thread list |
| `schoolchat:ai_messages` | object | `{ [aiConversationId]: AiMessage[] }` |
| `schoolchat:session` | object | Cached session `{ userId, username, displayName }` + JWT token |

**Key constraints**

- **conversations:** unique pair `(user_a_id, user_b_id)` with IDs stored in sorted order
- **friendships:** status ∈ `pending | accepted | blocked`
- **messages:** `content` OR `image_data_url` required; images stored as base64 (~2 MB limit)
- **users:** `username` unique, normalized lowercase, 3–20 chars, `[a-z0-9_]`
- **invite_codes:** validated at register; `use_count` incremented on success; default seed `SCHOOL01`

---

## REST API

All routes prefixed with `/api`. Authenticated routes require `Authorization: Bearer <jwt>`.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | `{ inviteCode, username, password, displayName }` |
| POST | `/auth/login` | `{ username, password }` |
| GET | `/auth/me` | Current user profile |
| PATCH | `/auth/me` | Update `{ displayName?, avatarUrl? }` |

### Invites

| Method | Path | Description |
|--------|------|-------------|
| POST | `/invites` | Generate new invite code |
| GET | `/invites/mine` | List codes created by current user |

### Friends

| Method | Path | Description |
|--------|------|-------------|
| GET | `/friends` | List accepted friends |
| GET | `/friends/requests` | Incoming + outgoing pending requests |
| POST | `/friends/request` | `{ username }` — send friend request |
| POST | `/friends/requests/:id/accept` | Accept request |
| POST | `/friends/requests/:id/decline` | Decline request |
| DELETE | `/friends/:userId` | Unfriend |
| POST | `/friends/:userId/block` | Block user |

### Conversations & messages

| Method | Path | Description |
|--------|------|-------------|
| GET | `/conversations` | List with last message + unread count |
| POST | `/conversations` | `{ friendUserId }` — get or create 1:1 thread |
| GET | `/conversations/:id/messages` | Message history |
| POST | `/conversations/:id/messages` | Send `{ content?, imageDataUrl? }` |
| POST | `/conversations/:id/read` | Mark conversation read |

### AI

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/chat` | `{ mode, messages[] }` → `{ reply }` |

---

## Client-side services

| Module | Path | Responsibility |
|--------|------|----------------|
| `apiClient` | `apps/web/src/api/client.ts` | HTTP requests, JWT header, error handling |
| `authService` | `apps/web/src/services/authService.ts` | Register, login, logout, profile, invites |
| `friendService` | `apps/web/src/services/friendService.ts` | Requests, accept/decline, block, unfriend |
| `chatService` | `apps/web/src/services/chatService.ts` | Conversations, send message, read state |
| `aiService` | `apps/web/src/services/aiService.ts` | AI threads, call AI proxy, persist to localStorage |
| `storageService` | `apps/web/src/storage/storageService.ts` | localStorage read/write (AI history) |

### Auth flow

1. User registers with invite code + username + password
2. Server validates invite, hashes password (bcrypt), saves user, returns JWT
3. Client stores JWT + session; sends `Authorization` header on subsequent requests
4. Login matches username + password hash → JWT

**Bootstrap:** Server seeds default invite code `SCHOOL01` on first run.

### Messaging flow

```mermaid
sequenceDiagram
  participant UI as React_UI
  participant Poll as usePolling
  participant Chat as chatService
  participant API as Fastify_API
  participant DB as SQLite

  UI->>Chat: sendMessage(conversationId, content)
  Chat->>API: POST /conversations/:id/messages
  API->>DB: INSERT message
  API-->>Chat: message
  Chat-->>UI: message

  loop Every 5s
    Poll->>Chat: listConversations()
    Chat->>API: GET /conversations
    API->>DB: SELECT + unread counts
    API-->>UI: updated list
  end
```

**Unread counts:** Server computes messages after `last_read_at` from the other user. Opening a chat calls `POST /conversations/:id/read`.

---

## AI proxy

**Endpoint:** `POST /api/ai/chat`

**Request body:**

```json
{
  "mode": "learn",
  "messages": [
    { "role": "user", "content": "Explain photosynthesis" }
  ]
}
```

**Response:**

```json
{
  "reply": { "role": "assistant", "content": "..." }
}
```

**Location:** `apps/api/src/services/aiService.ts` — wraps resilient-llm.

**Client flow**

1. User sends message in AI chat
2. `aiService` saves user message to `localStorage`
3. `aiService` POSTs mode + last 20 messages to `/api/ai/chat`
4. Server prepends system prompt, calls `llm.chat()`, returns reply
5. `aiService` saves assistant message to `localStorage`

**Modes**

- **Learn** — separate AI tab; user starts new sessions
- **Chat** — single pinned casual thread at top of Chats list

**System prompts**

- **Learn:** Friendly tutor for students aged 14–18; explain clearly, offer quizzes, stay safe
- **Chat:** Fun, age-appropriate companion; concise responses safe for teens

**Safety**

- LLM API keys server-side only
- Static disclaimer banner in AI UI
- No separate content moderation layer beyond prompts

---

## Auth & security

| Concern | Approach |
|---------|----------|
| Passwords | bcrypt hash in SQLite |
| Sessions | JWT (configurable secret via `JWT_SECRET`) |
| Invite codes | Validated server-side; use count tracked |
| CORS | Restricted to `WEB_ORIGIN` |
| Images | Client-side size/type validation; base64 in SQLite |
| HTTPS | Required in production (reverse proxy) |
| AI keys | Never exposed to client |

---

## Visual design (Neon theme)

Dark-first UI with vivid neon accents, soft glows, and high contrast. Layout patterns follow familiar chat-app conventions (list → thread, bottom nav, search, FAB) with neon styling.

### Design tokens

Defined in `apps/web/src/styles/theme.css`:

| Token | Usage |
|-------|-------|
| `--neon-cyan` | Primary actions, sent messages, active nav, friend chat |
| `--neon-magenta` | AI section accent, Learn mode, unread badges |
| `--neon-green` | Online/success states |
| `--neon-purple` | Chat mode accent |
| `--glow-cyan` / `--glow-magenta` | Buttons, focus rings, badges |

### AI vs friend chat distinction

| Area | Friend chat | AI chat |
|------|-------------|---------|
| Accent color | `--neon-cyan` | `--neon-magenta` |
| Header badge | — | "AI" pill with magenta glow |
| Banner | — | "You are chatting with AI — not a real person" |
| Learn mode | — | Magenta accent |
| Chat mode | — | Purple accent; pinned on Chats list |

### Layout

- **Full-width** chat homepage (`chat-home`) — same width as chat detail page
- **Bottom nav** spans full viewport width
- **Font:** Space Grotesk

---

## Frontend structure

```
apps/web/src/
├── styles/
│   ├── theme.css
│   └── global.css
├── api/
│   └── client.ts
├── storage/
│   └── storageService.ts      # AI history only
├── services/
│   ├── authService.ts
│   ├── friendService.ts
│   ├── chatService.ts
│   └── aiService.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── ChatsPage.tsx          # full-width; pinned AI + onboarding
│   ├── ChatPage.tsx
│   ├── AIPage.tsx             # Learn mode list
│   ├── AIChatPage.tsx
│   ├── FriendsPage.tsx
│   └── SettingsPage.tsx
├── components/
│   ├── ChatBubble.tsx
│   ├── ConversationList.tsx
│   ├── MessageInput.tsx
│   ├── AIChatPanel.tsx
│   ├── BottomNav.tsx
│   ├── NeonButton.tsx
│   ├── ScreenHeader.tsx
│   ├── SearchBar.tsx
│   ├── NewChatFab.tsx
│   ├── OnboardingEmptyState.tsx
│   └── PinnedAiChatRow.tsx
└── hooks/
    ├── useAuth.tsx
    ├── useConversations.ts
    ├── usePolling.ts
    └── useLocalStorage.ts
```

---

## Deployment

| Component | Service |
|-----------|---------|
| API + web (production) | Single VPS — Fastify with `SERVE_STATIC=true` |
| Database | SQLite file at `DATABASE_PATH` |
| Process manager | pm2 |
| HTTPS | Caddy or nginx reverse proxy |
| Backup | Regular copy of SQLite file |

See [README.md](README.md) for env vars and setup steps.

---

## Environment variables

```env
# apps/api/.env
LLM_PRIMARY_PROVIDER=openai
LLM_FALLBACK_PROVIDERS=anthropic,gemini
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

PORT=3001
WEB_ORIGIN=http://localhost:5173
JWT_SECRET=change-me-in-production
DATABASE_PATH=./data/schoolchat.db

# Production: serve built web app from the same process
SERVE_STATIC=false
WEB_DIST_PATH=../web/dist
```

Vite dev server proxies `/api` to the API on port 3001.

---

## Implementation status

| Phase | Status |
|-------|--------|
| Scaffold — Vite + React, shared types, neon theme | ✅ Done |
| SQLite schema + seed invite code | ✅ Done |
| JWT auth + register/login/me + invite generation | ✅ Done |
| Friends — requests, accept/decline, block (API) | ✅ Done |
| 1:1 chat — conversations, messages, read state, unread | ✅ Done |
| Images — base64 encode, size validation, preview | ✅ Done |
| AI proxy — Fastify route + resilient-llm | ✅ Done |
| AI chat UI — Learn/Chat modes, localStorage history | ✅ Done |
| Cross-device sync — REST + polling | ✅ Done |
| Username-based auth (no email) | ✅ Done |
| Onboarding empty state | ✅ Done |
| Full-width neon chat layout | ✅ Done |
| VPS deployment docs | ✅ Done |
| Avatar upload UI | Not implemented |
| Unfriend/block UI | Not implemented (API ready) |
| Push notifications | Out of scope |

---

## Testing strategy

Integration tests in `apps/api/src/app.test.ts` (Vitest, in-memory SQLite):

1. **Happy path:** Register with invite → add friend → send message → see in thread
2. **Edge case:** Register with invalid invite code → error
3. **Edge case:** Blocked user cannot send message → error

---

## Out of scope for v1

- WebSockets / true real-time push
- Group chats, voice/video, push notifications
- End-to-end encryption
- Message edit/delete, search, typing indicators
- Native mobile apps
- Cloud image storage (CDN/S3)
- AI history sync to server

## Future enhancements

- WebSocket or SSE for instant message delivery
- Avatar upload UI
- Unfriend/block actions in Friends UI
- Sync AI history to server per user
- PostgreSQL if user count grows beyond SQLite comfort zone
