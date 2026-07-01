# Requirements: School Friends Chat + AI Chatbot (v1)

## 1. Overview

A private messaging app for 1:1 chat with school friends, plus an AI chatbot for learning and casual conversation.

**v1 goals**

- Chat one-on-one with friends instead of using WhatsApp
- Talk to an AI to learn about a topic or chat for fun

**Not in v1**

- Server database (using browser localStorage instead)
- Cross-device / real-time sync between friends on different phones
- Group chats
- Voice/video calls
- Public profiles or finding strangers

---

## 2. Users

- **Students** — message friends, share images, get notifications
- **Learners** — ask the AI to explain topics or quiz them
- **Casual users** — chat with the AI for entertainment

---

## 3. v1 Features

### Accounts

- Sign up and log in (invite-only via link or code)
- Display name and optional avatar

### Friends

- Add friends by username or invite link
- Accept/decline friend requests
- Unfriend

### Messaging (1:1 only)

- Real-time text messages between two friends
- Message history in each conversation
- Timestamps and sent status
- Send and preview images

### Notifications

- In-app unread count per conversation
- Notify when a new message arrives (in-app; push optional for v1)

### AI Chatbot

- Separate section from friend chats (clearly labeled as AI)
- Text in / text out
- Two modes: **Learn** (explain topics, answer questions) and **Chat** (casual conversation)
- Conversation history saved so users can continue later
- Start a new AI conversation anytime
- Age-appropriate responses with basic content moderation
- Disclaimer that AI can make mistakes

---

## 4. Security & Privacy

- HTTPS everywhere (when deployed)
- Passwords hashed before saving to localStorage
- Data stays on the user's browser — clearing site data removes it
- Invite-only sign-up — no public user directory
- Block a user

---

## 5. UX

**Navigation**

1. **Chats** — list of 1:1 conversations with unread badges
2. **AI** — bot conversations
3. **Friends** — add and manage friends
4. **Settings** — account and notifications

**Design**

- **Neon theme** — dark background with bright neon accents and subtle glow effects
- Simple, familiar chat layout
- AI section visually distinct from friend chats (different neon accent color)

---

## 6. Non-Functional

- All data stored in browser **localStorage** (no database for v1)
- Messages appear instantly on the same device
- Mobile-friendly web app
- Cross-device friend sync is not in v1 (requires a backend later)

---

## 7. v1 Checklist

- [ ] Sign up / login (invite-only)
- [ ] Add friends and friend requests
- [ ] 1:1 text chat with real-time delivery
- [ ] Message history
- [ ] Image sharing
- [ ] Unread notifications
- [ ] AI chat (learn + casual) with saved history
- [ ] Mobile-friendly web UI

---

## 8. Open Decisions

1. Web only for v1, or native mobile too? Yes, web only
2. Which AI provider to use (cost, privacy, age policy)? Any of them we should be able to use via resilient-llm
3. Invite codes only, or username search among invited users? invite codes only

---

## 9. Success Criteria

- Friends use it for daily 1:1 chat instead of WhatsApp
- Messages feel instant and reliable
- AI is useful for studying and fun, without feeling unsafe
- A new friend can join in under 2 minutes

---

## 10. User Stories

- As a student, I want to message a friend directly so we can talk privately.
- As a student, I want to see unread messages so I know what I missed.
- As a student, I want to send a photo so I can share notes or memes.
- As a student, I want to ask the AI to explain a topic so I can study.
- As a student, I want to chat with the AI when I'm bored.
- As a student, I want to invite friends with a link so only people we know join.
- As a student, I want to clearly see when I'm talking to the AI, not a real person.
