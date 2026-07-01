# Teacher AI Twins

How to add, edit, or disable **Teacher AI Twins** — the tutors shown on the **Teacher** tab.

There is **no admin UI or REST admin API in v1**. Personalities are defined in code, stored in SQLite, and synced on API startup.

For the product context, see [REQUIREMENTS.md](../REQUIREMENTS.md) (Teacher AI personalities). For API shapes, see [TECHNICAL_DESIGN.md](../TECHNICAL_DESIGN.md).

---

## How it works

```text
DEFAULT_PERSONALITIES (code)
        ↓  seed / backfill on API start
ai_personalities (SQLite)
        ↓  GET /api/ai/personalities  (metadata only)
Teacher page + chat UI
        ↓  POST /api/ai/chat + personalityId
system_prompt resolved server-side → LLM
```

- **`system_prompt` never leaves the server** — the browser only gets name, expertise labels, opener text, colours, and icons.
- **`COACHING_STYLE`** and **`SAFETY_SUFFIX`** are appended automatically to every `systemPrompt` in seed data (see `apps/api/src/db/index.ts`).
- Each student gets **one ongoing thread per personality slug** in browser `localStorage` (not synced across devices).
- The UI shows the teacher **name**, a subtle **AI Twin** label after the name, and **expertise** pills (1–2 words each).

---

## Source of truth (recommended)

Edit **`DEFAULT_PERSONALITIES`** in:

```text
apps/api/src/db/index.ts
```

On every API start, `backfillPersonalityContent()`:

- **Updates** rows whose `slug` matches a seed entry (name, labels, prompts, opener, colours, order)
- **Inserts** any seed slug missing from the database
- **Disables** slugs listed in `RETIRED_PERSONALITY_SLUGS`

Restart the API after changing seed data:

```bash
npm run dev:api
# or restart your production process (PM2, etc.)
```

---

## Personality fields

| Field | Purpose | Client-visible |
|-------|---------|----------------|
| `slug` | Stable id used in API and chat threads, e.g. `math` | Yes |
| `name` | Display name, e.g. `Praveen Sir` | Yes |
| `expertiseLabels` | Short tags (1–2 words each), e.g. `['Math', 'Puzzles']` | Yes |
| `systemPrompt` | Core LLM instructions for this AI Twin | **No** |
| `openingMessage` | First assistant message in a new/empty thread (markdown ok) | Yes (as chat content) |
| `accentColor` | Hex colour for card icon and expertise pills | Yes |
| `icon` | Icon slug for the Teacher card (see below) | Yes |
| `isDefault` | Used when `personalityId` is omitted in teacher chat | Yes |
| `sortOrder` | Order on the Teacher page (lower = first) | Yes |

**Rules:**

- Exactly **one** personality should have `isDefault: true` (usually `general` / Pradeep Sir).
- **`slug` must be unique** and stable — changing a slug starts a new thread for existing users.
- **Expertise labels:** one or two words; use a few labels to combine skills (e.g. `AI`, `Startups`).
- **Opening message:** mention they are an AI Twin, not the real teacher; suggest 2–3 ways to start; note that chatting here helps when Sir is busy or asleep.

### Current seed (reference)

| slug | name | expertiseLabels |
|------|------|-----------------|
| `general` | Pradeep Sir | AI, Startups |
| `math` | Praveen Sir | Math, Puzzles |
| `coding` | Surya Sir | Coding, Software |
| `thinking` | Mayank Sir | Decision Making, Judgement |

---

## Add a new personality

1. **Requirements** — Add the tutor to [REQUIREMENTS.md](../REQUIREMENTS.md).
2. **Design** — Note slug, API behaviour, and UI in [TECHNICAL_DESIGN.md](../TECHNICAL_DESIGN.md).
3. **Seed** — Append an object to `DEFAULT_PERSONALITIES`:

```typescript
{
  slug: 'physics',
  name: 'Ravi Sir',
  expertiseLabels: ['Physics', 'Experiments'],
  systemPrompt:
    'You are an AI Twin of Ravi Sir... Say when unsure.',
  openingMessage:
    "Hi! I'm Ravi Sir's AI Twin — ...",
  accentColor: '#bf00ff',
  icon: 'lightbulb',
  isDefault: false,
  sortOrder: 4,
},
```

4. **Icon** — If you use a new `icon` slug, map it in `apps/web/src/components/PersonalityCard.tsx` (`getPersonalityIcon`). Built-in slugs today: `sparkles`, `calculator`, `code`, `lightbulb`; default fallback is `graduation-cap`.
5. **Restart API** — Backfill inserts the new row.
6. **Test** — Open **Teacher**, pick the new card, send a message; optional: extend `apps/api/src/app.test.ts`.

---

## Edit an existing personality

1. Change the matching entry in `DEFAULT_PERSONALITIES` (same `slug`).
2. Restart the API — backfill overwrites name, labels, prompts, and opener for that slug.

**Note:** Existing chat threads in `localStorage` keep old messages; only the **first opener** is seeded when the thread was created. Students see updated name/labels on the Teacher page immediately after refresh.

To force a fresh opener for everyone, change `slug` (creates new threads) or clear AI data in browser storage (dev only).

---

## Disable a personality

**Preferred:** Add the slug to `RETIRED_PERSONALITY_SLUGS` in `apps/api/src/db/index.ts` and remove it from `DEFAULT_PERSONALITIES` (or leave in seed but set `enabled` via retire list). Restart API — the row gets `enabled = 0` and disappears from `GET /ai/personalities`.

**Direct SQL** (emergency on a live server):

```sql
UPDATE ai_personalities SET enabled = 0, updated_at = datetime('now') WHERE slug = 'old-slug';
```

---

## Direct SQLite editing (advanced)

Database path: `DATABASE_PATH` in `apps/api/.env` (default `apps/api/data/schoolchat.db`).

Table: `ai_personalities`

| Column | Notes |
|--------|--------|
| `expertise_labels` | JSON array string, e.g. `["Math","Puzzles"]` |
| `system_prompt` | Include coaching/safety behaviour or rely on next deploy backfill |
| `enabled` | `1` = visible, `0` = hidden |

Manual SQL edits are **overwritten on next deploy** if the same `slug` exists in `DEFAULT_PERSONALITIES` and the API runs backfill. Prefer seed changes for anything permanent.

Inspect personalities:

```bash
sqlite3 apps/api/data/schoolchat.db "SELECT slug, name, enabled, expertise_labels FROM ai_personalities ORDER BY sort_order;"
```

---

## Verify

**HTTP:**

```bash
curl -s http://localhost:3001/api/ai/personalities | jq .
```

Confirm: no `systemPrompt` in response; `expertiseLabels` arrays present; disabled slugs omitted.

**Automated:**

```bash
npm test
```

**UI:** Teacher tab → cards show name, AI Twin label, expertise pills → open chat → opener appears once → replies use the correct tutor tone.

---

## Related files

| File | Role |
|------|------|
| `apps/api/src/db/index.ts` | Seed data, migrations, backfill |
| `apps/api/src/services/personalityService.ts` | Resolve personality + system prompt |
| `apps/api/src/routes/ai.ts` | `GET /ai/personalities`, `POST /ai/chat` |
| `packages/shared/src/types.ts` | `AiPersonality` type |
| `apps/web/src/pages/AIPage.tsx` | Teacher picker |
| `apps/web/src/components/PersonalityCard.tsx` | Card UI + icons |
| `apps/web/src/services/aiService.ts` | Threads, opener seeding, chat requests |

---

## Future: admin API

An authenticated admin API for CRUD on personalities is **deferred**. When added, update this doc and [TECHNICAL_DESIGN.md](../TECHNICAL_DESIGN.md); until then, use seed data + restart as above.
