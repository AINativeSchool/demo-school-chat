# Requirements: School Friends Chat + AI Chatbot (v1)

## 1. Overview

A private messaging app for 1:1 chat with school friends, plus an AI chatbot for learning and casual conversation.

**v1 goals**

- Chat one-on-one with friends instead of using WhatsApp
- Talk to an AI to learn about a topic or chat for fun
- Sync friend messages across devices via a shared backend

**Not in v1**

- Group chats
- Voice/video calls
- Public profiles or finding strangers
- Push notifications (in-app unread only)
- End-to-end encryption

---

## 2. Users

- **Students** — message friends, share images, get notifications
- **Learners** — ask the AI to explain topics or quiz them
- **Casual users** — chat with the AI for entertainment

---

## 3. v1 Features

### Accounts

- ✅ Sign up and log in (invite-only via code)
- ✅ Username as primary identity (no email required)
- ✅ Display name
- Optional avatar (API supports `avatarUrl`; UI shows initials for now)

### Friends

- ✅ Add friends by username
- ✅ Accept/decline friend requests
- ✅ Generate and share invite codes (Settings)
- Unfriend (API implemented; not exposed in UI)
- Block a user (API implemented; not exposed in UI)

### Messaging (1:1 only)

- ✅ Text messages between two friends (cross-device via server)
- ✅ Message history in each conversation
- ✅ Timestamps and sent/read status
- ✅ Send and preview images (base64, ~2 MB limit)
- ✅ HTTP polling for near-real-time updates (~5 s)

### Notifications

- ✅ In-app unread count per conversation
- Push notifications (deferred — in-app only for v1)

### AI Chatbot

- ✅ Separate section from friend chats (clearly labeled as AI)
- ✅ Text in / text out
- ✅ Two modes: **Learn** (explain topics, answer questions) and **Chat** (casual conversation)
- ✅ Conversation history saved so users can continue later (browser localStorage)
- ✅ Start a new AI conversation anytime (Learn tab) or continue casual chat (pinned on Chats)
- ✅ Disclaimer that AI can make mistakes
- Age-appropriate responses via system prompts (no separate moderation layer yet)

### Onboarding & UX

- ✅ Empty state when user has no friends — CTAs to add a friend or chat with AI
- ✅ WhatsApp-familiar patterns: chat list, search, contact rows, message bubbles, bottom nav
- ✅ **Neon theme** — dark background with bright neon accents and subtle glow effects
- ✅ Full-width chat homepage (matches chat detail layout)

---

## 4. Security & Privacy

- ✅ HTTPS everywhere when deployed (reverse proxy documented in README)
- ✅ Passwords hashed with bcrypt before saving to server database
- ✅ Invite-only sign-up — no public user directory
- ✅ JWT bearer tokens for authenticated API requests
- Block a user (API only; UI not wired yet)
- AI conversation history stays in browser localStorage (not synced to server)

---

## 5. UX

**Navigation**

1. **Chats** — list of 1:1 conversations with unread badges; pinned casual AI chat at top
2. **Friends** — add and manage friends
3. **AI** — Learn-mode bot conversations
4. **Settings** — account, invite codes, logout

**Design**

- ✅ **Neon theme** — dark background with bright neon accents and subtle glow effects
- ✅ Simple, familiar chat layout (WhatsApp-like structure, neon styling)
- ✅ AI section visually distinct from friend chats (magenta accent vs cyan for friends)

---

## 6. Non-Functional

- ✅ Shared **SQLite** database on the server for users, friends, conversations, and messages
- ✅ AI history in browser **localStorage** (client-only for now)
- ✅ Messages sync across devices via REST API + polling
- ✅ Mobile-friendly responsive web app
- ✅ Single VPS deployment path documented (pm2, HTTPS proxy, SQLite backup)

---

## 7. v1 Checklist

- ✅ Sign up / login (invite-only, username-based)
- ✅ Add friends and friend requests
- ✅ 1:1 text chat with cross-device delivery (polling)
- ✅ Message history
- ✅ Image sharing
- ✅ Unread notifications (in-app)
- ✅ AI chat (learn + casual) with saved history
- ✅ Mobile-friendly web UI
- ✅ Neon theme with full-width chat layout
- ✅ Onboarding for users with no friends

---

## 8. Decisions (resolved)

| Decision | Choice |
|----------|--------|
| Platform | Web only |
| AI provider | Any provider via [resilient-llm](https://github.com/gitcommitshow/resilient-llm) |
| Registration | Invite codes only |
| Identity | Username (no email) |
| Persistence | SQLite on server for app data; localStorage for AI history |
| Cross-device sync | REST API + HTTP polling (simplest approach) |
| Hosting | Single VPS with Fastify serving API + optional static web |

---

## 9. Success Criteria

- Friends use it for daily 1:1 chat instead of WhatsApp
- Messages feel instant and reliable across two computers
- AI is useful for studying and fun, without feeling unsafe
- A new friend can join in under 2 minutes (register → add by username → chat)

---

## 10. User Stories

- ✅ As a student, I want to message a friend directly so we can talk privately.
- ✅ As a student, I want to see unread messages so I know what I missed.
- ✅ As a student, I want to send a photo so I can share notes or memes.
- ✅ As a student, I want to ask the AI to explain a topic so I can study.
- ✅ As a student, I want to chat with the AI when I'm bored.
- ✅ As a student, I want to invite friends with a code so only people we know join.
- ✅ As a student, I want to clearly see when I'm talking to the AI, not a real person.
- ✅ As a new user, I want guidance when I have no friends yet so I know what to do next.
