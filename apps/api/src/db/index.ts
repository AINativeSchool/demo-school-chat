import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type {
  AiPersonality,
  Conversation,
  Friendship,
  InviteCode,
  Message,
  PublicUser,
  User,
} from '@school-chat/shared';

const DEFAULT_INVITE_CODE = 'SCHOOL01';

let db: Database.Database | null = null;

/** Opens (or reopens) the SQLite database and runs migrations. */
export function initDb(databasePath: string): Database.Database {
  if (db) return db;

  if (databasePath !== ':memory:') {
    const directory = path.dirname(databasePath);
    if (directory && directory !== '.') {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  seedDefaults(db);
  return db;
}

/** Returns the active database connection. */
export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

/** Closes the database - useful in tests. */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/** Resets the in-memory handle without closing - for tests that re-init. */
export function resetDbHandle(): void {
  db = null;
}

/** Creates tables if they do not exist yet. */
function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invite_codes (
      code TEXT PRIMARY KEY,
      created_by TEXT NOT NULL,
      max_uses INTEGER NOT NULL,
      use_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL,
      addressee_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_a_id TEXT NOT NULL,
      user_b_id TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_a_id, user_b_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT,
      image_data_url TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS read_state (
      user_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      last_read_at TEXT NOT NULL,
      PRIMARY KEY (user_id, conversation_id)
    );

    CREATE TABLE IF NOT EXISTS ai_personalities (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      opening_message TEXT NOT NULL DEFAULT '',
      expertise_labels TEXT NOT NULL DEFAULT '[]',
      accent_color TEXT,
      icon TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(requester_id, addressee_id);
  `);

  migratePersonalityColumns(database);
}

const SAFETY_SUFFIX =
  ' Always keep responses age-appropriate for teens. Refuse harmful or explicit requests.';

const COACHING_STYLE =
  ' Be a proactive coach: welcome the student, suggest 2–3 concrete ways to begin, ask a guiding question, and offer next steps. Do not wait passively or reply with only "How can I help?" - always give suggestions and direction.';

/** Slugs retired when switching to named AI Twin teachers. */
const RETIRED_PERSONALITY_SLUGS = ['science', 'writing', 'language'] as const;

/** Default teacher AI Twins seeded on first run - each mirrors a real Sir's style. */
const DEFAULT_PERSONALITIES = [
  {
    slug: 'general',
    name: 'Pradeep Sir',
    expertiseLabels: ['AI', 'Startups'],
    systemPrompt:
      'You are an AI Twin of Pradeep Sir, a teacher known for making artificial intelligence accessible to students aged 14–18. Explain AI concepts clearly (ML basics, prompts, ethics, study use cases), use relatable examples, and encourage critical thinking about when and how to use AI tools. Speak warmly in his coaching style, but always clarify you are an AI Twin - not the real teacher in person. Say when unsure.',
    openingMessage:
      "Namaste! I'm Pradeep Sir's AI Twin - built to teach AI the way he does, but I'm an AI assistant, not the real Sir in person.\n\nWhen Sir is busy or asleep, chatting with me here is a good way to clear your doubts faster - I'm available anytime.\n\nI love breaking down **AI** so it actually makes sense. Pick a starting point:\n\n• What is AI, and how do chatbots like me really work?\n• How to use AI tools *well* for homework (without cheating)\n• Explore a topic - neural networks, prompts, AI in daily life\n\nWhat should we dive into first?",
    accentColor: '#ff00aa',
    icon: 'sparkles',
    isDefault: true,
    sortOrder: 0,
  },
  {
    slug: 'math',
    name: 'Praveen Sir',
    expertiseLabels: ['Math', 'Puzzles'],
    systemPrompt:
      'You are an AI Twin of Praveen Sir, a teacher known for patient, step-by-step math teaching for students aged 14–18. Break problems into clear steps, show your work, use simple examples, and build confidence with practice. Speak encouragingly in his coaching style, but always clarify you are an AI Twin - not the real teacher in person. Say when unsure.',
    openingMessage:
      "Hey! I'm Praveen Sir's AI Twin - I teach math the way he does, but remember, I'm an AI assistant, not Sir himself.\n\nWhen Sir is busy or asleep, chatting with me here is a good way to clear your doubts faster - I'm available anytime.\n\nNumbers are my thing - **algebra, geometry, word problems**, you name it. Choose where to begin:\n\n• Paste a problem you're stuck on - we'll solve it step by step\n• Review a topic that's fuzzy (fractions, quadratics, proofs…)\n• Quick practice set at your level\n\nWhat's on your math mind today?",
    accentColor: '#39ff14',
    icon: 'calculator',
    isDefault: false,
    sortOrder: 1,
  },
  {
    slug: 'coding',
    name: 'Surya Sir',
    expertiseLabels: ['Coding', 'Software'],
    systemPrompt:
      'You are an AI Twin of Surya Sir, a teacher known for hands-on coding instruction for students aged 14–18. Teach concepts clearly, guide debugging step by step, use small runnable examples, and encourage good habits (readable names, testing ideas). Prefer explaining over dumping full solutions. Speak in his coaching style, but always clarify you are an AI Twin - not the real teacher in person. Say when unsure.',
    openingMessage:
      "Hello! I'm Surya Sir's AI Twin - I coach code like he does, but I'm an AI assistant, not the real Sir in the classroom.\n\nWhen Sir is busy or asleep, chatting with me here is a good way to clear your doubts faster - I'm available anytime.\n\nWhether you're starting out or fixing a bug, I've got you. Pick a lane:\n\n• Learn a concept (variables, loops, functions, arrays…)\n• Debug code that won't behave (paste your snippet)\n• Plan a mini project or coding exercise\n\nWhat language or topic are you working on?",
    accentColor: '#7df9ff',
    icon: 'code',
    isDefault: false,
    sortOrder: 2,
  },
  {
    slug: 'thinking',
    name: 'Mayank Sir',
    expertiseLabels: ['Decision Making', 'Judgement'],
    systemPrompt:
      'You are an AI Twin of Mayank Sir, a teacher known for developing judgment, decision-making, and critical thinking in students aged 14–18. Help students weigh options, spot assumptions, use simple frameworks for decisions, and think through dilemmas clearly. Use Socratic questions and real school-life scenarios. Speak thoughtfully in his coaching style, but always clarify you are an AI Twin - not the real teacher in person. Say when unsure.',
    openingMessage:
      "Hi! I'm Mayank Sir's AI Twin - trained on how he sharpens your thinking, but I'm an AI assistant, not Mayank Sir himself.\n\nWhen Sir is busy or asleep, chatting with me here is a good way to clear your doubts faster - I'm available anytime.\n\nGood decisions start with **clear thinking**. Where shall we begin?\n\n• Work through a real dilemma (study choices, group work, priorities…)\n• Learn a thinking tool (pros/cons, second-order effects, bias checks)\n• Practice reasoning on a scenario or debate question\n\nWhat's the decision or puzzle on your mind?",
    accentColor: '#ffd700',
    icon: 'lightbulb',
    isDefault: false,
    sortOrder: 3,
  },
] as const;

/** Joins expertise labels for the legacy description column. */
function expertiseDescription(labels: readonly string[]): string {
  return labels.join(', ');
}

/** Parses stored expertise labels JSON with a description fallback. */
function parseExpertiseLabels(row: PersonalityRow): string[] {
  if (row.expertise_labels) {
    try {
      const parsed = JSON.parse(row.expertise_labels) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
          .map((entry) => entry.trim());
      }
    } catch {
      // fall through to description
    }
  }

  if (!row.description) return [];

  return row.description
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Seeds the default invite code when the table is empty. */
function seedDefaults(database: Database.Database): void {
  const row = database.prepare('SELECT COUNT(*) AS count FROM invite_codes').get() as { count: number };
  if (row.count === 0) {
    database
      .prepare(
        `INSERT INTO invite_codes (code, created_by, max_uses, use_count, expires_at)
         VALUES (?, ?, ?, ?, NULL)`,
      )
      .run(DEFAULT_INVITE_CODE, 'system', 100, 0);
  }

  seedPersonalities(database);
  backfillPersonalityContent(database);
}

/** Adds new personality columns for existing databases. */
function migratePersonalityColumns(database: Database.Database): void {
  const columns = database.prepare('PRAGMA table_info(ai_personalities)').all() as Array<{
    name: string;
  }>;
  const names = new Set(columns.map((column) => column.name));

  if (!names.has('opening_message')) {
    database.exec(`ALTER TABLE ai_personalities ADD COLUMN opening_message TEXT NOT NULL DEFAULT ''`);
  }

  if (!names.has('expertise_labels')) {
    database.exec(`ALTER TABLE ai_personalities ADD COLUMN expertise_labels TEXT NOT NULL DEFAULT '[]'`);
  }
}

/** Seeds default teacher personalities when the table is empty. */
function seedPersonalities(database: Database.Database): void {
  const row = database.prepare('SELECT COUNT(*) AS count FROM ai_personalities').get() as {
    count: number;
  };
  if (row.count > 0) return;

  const now = new Date().toISOString();
  const insert = database.prepare(
    `INSERT INTO ai_personalities
     (id, slug, name, description, system_prompt, opening_message, expertise_labels, accent_color, icon, is_default, enabled, sort_order, created_at, updated_at)
     VALUES (@id, @slug, @name, @description, @systemPrompt, @openingMessage, @expertiseLabels, @accentColor, @icon, @isDefault, 1, @sortOrder, @createdAt, @updatedAt)`,
  );

  DEFAULT_PERSONALITIES.forEach((entry) => {
    insert.run({
      id: generateId(),
      slug: entry.slug,
      name: entry.name,
      description: expertiseDescription(entry.expertiseLabels),
      systemPrompt: `${entry.systemPrompt}${COACHING_STYLE}${SAFETY_SUFFIX}`,
      openingMessage: entry.openingMessage,
      expertiseLabels: JSON.stringify(entry.expertiseLabels),
      accentColor: entry.accentColor,
      icon: entry.icon,
      isDefault: entry.isDefault ? 1 : 0,
      sortOrder: entry.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
  });
}

/** Keeps seeded AI Twin content in sync and hides retired personalities. */
function backfillPersonalityContent(database: Database.Database): void {
  const update = database.prepare(
    `UPDATE ai_personalities
     SET name = @name,
         description = @description,
         opening_message = @openingMessage,
         expertise_labels = @expertiseLabels,
         system_prompt = @systemPrompt,
         accent_color = @accentColor,
         icon = @icon,
         is_default = @isDefault,
         sort_order = @sortOrder,
         enabled = 1,
         updated_at = @updatedAt
     WHERE slug = @slug`,
  );

  const findSlug = database.prepare('SELECT 1 AS found FROM ai_personalities WHERE slug = ?');
  const insert = database.prepare(
    `INSERT INTO ai_personalities
     (id, slug, name, description, system_prompt, opening_message, expertise_labels, accent_color, icon, is_default, enabled, sort_order, created_at, updated_at)
     VALUES (@id, @slug, @name, @description, @systemPrompt, @openingMessage, @expertiseLabels, @accentColor, @icon, @isDefault, 1, @sortOrder, @createdAt, @updatedAt)`,
  );

  const disable = database.prepare(
    'UPDATE ai_personalities SET enabled = 0, updated_at = ? WHERE slug = ?',
  );

  const now = new Date().toISOString();
  DEFAULT_PERSONALITIES.forEach((entry) => {
    const payload = {
      slug: entry.slug,
      name: entry.name,
      description: expertiseDescription(entry.expertiseLabels),
      openingMessage: entry.openingMessage,
      expertiseLabels: JSON.stringify(entry.expertiseLabels),
      systemPrompt: `${entry.systemPrompt}${COACHING_STYLE}${SAFETY_SUFFIX}`,
      accentColor: entry.accentColor,
      icon: entry.icon,
      isDefault: entry.isDefault ? 1 : 0,
      sortOrder: entry.sortOrder,
      updatedAt: now,
    };

    if (findSlug.get(entry.slug)) {
      update.run(payload);
    } else {
      insert.run({
        id: generateId(),
        ...payload,
        createdAt: now,
      });
    }
  });

  RETIRED_PERSONALITY_SLUGS.forEach((slug) => disable.run(now, slug));
}

/** Generates a UUID for new records. */
export function generateId(): string {
  return crypto.randomUUID();
}

interface UserRow {
  id: string;
  password_hash: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

/** Maps a DB row to the shared User type. */
function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    username: row.username,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
  };
}

/** Strips password hash before returning user data to clients. */
export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

/** Finds a user by username. */
export function findUserByUsername(username: string): User | undefined {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE lower(username) = lower(?)')
    .get(normalizeUsername(username)) as UserRow | undefined;
  return row ? rowToUser(row) : undefined;
}

/** Finds a user by id. */
export function findUserById(id: string): User | undefined {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row ? rowToUser(row) : undefined;
}

/** Inserts or updates a user record. */
export function saveUser(user: User): void {
  getDb()
    .prepare(
      `INSERT INTO users (id, password_hash, display_name, username, avatar_url, created_at)
       VALUES (@id, @passwordHash, @displayName, @username, @avatarUrl, @createdAt)
       ON CONFLICT(id) DO UPDATE SET
         display_name = excluded.display_name,
         avatar_url = excluded.avatar_url`,
    )
    .run({
      id: user.id,
      passwordHash: user.passwordHash,
      displayName: user.displayName,
      username: user.username,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt,
    });
}

/** Normalizes a username for storage and lookup. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, '');
}

/** Validates username format; returns an error message or null when valid. */
export function validateUsername(raw: string): string | null {
  const username = normalizeUsername(raw);
  if (username.length < 3) {
    return 'Username must be at least 3 characters.';
  }
  if (username.length > 20) {
    return 'Username must be at most 20 characters.';
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores.';
  }
  return null;
}

interface InviteRow {
  code: string;
  created_by: string;
  max_uses: number;
  use_count: number;
  expires_at: string | null;
}

/** Maps an invite row to the shared InviteCode type. */
function rowToInvite(row: InviteRow): InviteCode {
  return {
    code: row.code,
    createdBy: row.created_by,
    maxUses: row.max_uses,
    useCount: row.use_count,
    expiresAt: row.expires_at ?? undefined,
  };
}

/** Returns all invite codes. */
export function getInviteCodes(): InviteCode[] {
  const rows = getDb().prepare('SELECT * FROM invite_codes').all() as InviteRow[];
  return rows.map(rowToInvite);
}

/** Saves the full invite code list (used after incrementing use count). */
export function saveInviteCode(invite: InviteCode): void {
  getDb()
    .prepare(
      `INSERT INTO invite_codes (code, created_by, max_uses, use_count, expires_at)
       VALUES (@code, @createdBy, @maxUses, @useCount, @expiresAt)
       ON CONFLICT(code) DO UPDATE SET use_count = excluded.use_count`,
    )
    .run({
      code: invite.code,
      createdBy: invite.createdBy,
      maxUses: invite.maxUses,
      useCount: invite.useCount,
      expiresAt: invite.expiresAt ?? null,
    });
}

/** Finds a redeemable invite code. */
export function findRedeemableInvite(normalizedCode: string): InviteCode | undefined {
  return getInviteCodes().find((entry) => {
    if (entry.code !== normalizedCode) return false;
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) return false;
    return entry.useCount < entry.maxUses;
  });
}

/** Generates a random 8-character invite code. */
export function randomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
}

/** Maps a friendship row to the shared Friendship type. */
function rowToFriendship(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status as Friendship['status'],
    createdAt: row.created_at,
  };
}

/** Returns all friendships. */
export function getFriendships(): Friendship[] {
  const rows = getDb().prepare('SELECT * FROM friendships').all() as FriendshipRow[];
  return rows.map(rowToFriendship);
}

/** Replaces the friendships table contents. */
export function saveFriendships(friendships: Friendship[]): void {
  const database = getDb();
  const tx = database.transaction((items: Friendship[]) => {
    database.prepare('DELETE FROM friendships').run();
    const insert = database.prepare(
      `INSERT INTO friendships (id, requester_id, addressee_id, status, created_at)
       VALUES (@id, @requesterId, @addresseeId, @status, @createdAt)`,
    );
    items.forEach((item) => insert.run(item));
  });
  tx(friendships);
}

/** Upserts a single friendship row. */
export function upsertFriendship(friendship: Friendship): void {
  getDb()
    .prepare(
      `INSERT INTO friendships (id, requester_id, addressee_id, status, created_at)
       VALUES (@id, @requesterId, @addresseeId, @status, @createdAt)
       ON CONFLICT(id) DO UPDATE SET status = excluded.status`,
    )
    .run(friendship);
}

/** Deletes a friendship by id. */
export function deleteFriendship(id: string): void {
  getDb().prepare('DELETE FROM friendships WHERE id = ?').run(id);
}

/** Deletes any friendship edge between two users. */
export function deleteFriendshipBetween(userA: string, userB: string): void {
  getDb()
    .prepare(
      `DELETE FROM friendships
       WHERE (requester_id = ? AND addressee_id = ?)
          OR (requester_id = ? AND addressee_id = ?)`,
    )
    .run(userA, userB, userB, userA);
}

interface ConversationRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  updated_at: string;
}

/** Maps a conversation row to the shared Conversation type. */
function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    updatedAt: row.updated_at,
  };
}

/** Returns all conversations. */
export function getConversations(): Conversation[] {
  const rows = getDb().prepare('SELECT * FROM conversations').all() as ConversationRow[];
  return rows.map(rowToConversation);
}

/** Saves or updates a conversation. */
export function saveConversation(conversation: Conversation): void {
  getDb()
    .prepare(
      `INSERT INTO conversations (id, user_a_id, user_b_id, updated_at)
       VALUES (@id, @userAId, @userBId, @updatedAt)
       ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
    )
    .run(conversation);
}

/** Finds a conversation by id. */
export function findConversationById(id: string): Conversation | undefined {
  const row = getDb().prepare('SELECT * FROM conversations WHERE id = ?').get(id) as
    | ConversationRow
    | undefined;
  return row ? rowToConversation(row) : undefined;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_data_url: string | null;
  status: string;
  created_at: string;
}

/** Maps a message row to the shared Message type. */
function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content ?? undefined,
    imageDataUrl: row.image_data_url ?? undefined,
    status: row.status as Message['status'],
    createdAt: row.created_at,
  };
}

/** Returns messages for a conversation, optionally since a timestamp. */
export function getMessages(conversationId: string, since?: string): Message[] {
  const rows = since
    ? (getDb()
        .prepare(
          'SELECT * FROM messages WHERE conversation_id = ? AND created_at > ? ORDER BY created_at ASC',
        )
        .all(conversationId, since) as MessageRow[])
    : (getDb()
        .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
        .all(conversationId) as MessageRow[]);
  return rows.map(rowToMessage);
}

/** Appends a message to a conversation. */
export function appendMessage(message: Message): void {
  getDb()
    .prepare(
      `INSERT INTO messages (id, conversation_id, sender_id, content, image_data_url, status, created_at)
       VALUES (@id, @conversationId, @senderId, @content, @imageDataUrl, @status, @createdAt)`,
    )
    .run({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content ?? null,
      imageDataUrl: message.imageDataUrl ?? null,
      status: message.status,
      createdAt: message.createdAt,
    });
}

/** Returns the last-read timestamp for a user in a conversation. */
export function getLastReadAt(userId: string, conversationId: string): string | undefined {
  const row = getDb()
    .prepare('SELECT last_read_at FROM read_state WHERE user_id = ? AND conversation_id = ?')
    .get(userId, conversationId) as { last_read_at: string } | undefined;
  return row?.last_read_at;
}

/** Updates read state for a user in a conversation. */
export function setReadState(userId: string, conversationId: string, lastReadAt: string): void {
  getDb()
    .prepare(
      `INSERT INTO read_state (user_id, conversation_id, last_read_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, conversation_id) DO UPDATE SET last_read_at = excluded.last_read_at`,
    )
    .run(userId, conversationId, lastReadAt);
}

/** Sorts two user ids for stable conversation pair keys. */
export function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

interface PersonalityRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  system_prompt: string;
  opening_message: string;
  expertise_labels: string;
  accent_color: string | null;
  icon: string | null;
  is_default: number;
  enabled: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Maps a personality row to the public API shape (no system prompt). */
export function rowToPublicPersonality(row: PersonalityRow): AiPersonality {
  const expertiseLabels = parseExpertiseLabels(row);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: expertiseDescription(expertiseLabels),
    expertiseLabels,
    openingMessage: row.opening_message || undefined,
    accentColor: row.accent_color ?? undefined,
    icon: row.icon ?? undefined,
    isDefault: row.is_default === 1,
    sortOrder: row.sort_order,
  };
}

/** Returns enabled teacher personalities for the public list endpoint. */
export function listEnabledPersonalities(): AiPersonality[] {
  const rows = getDb()
    .prepare(
      'SELECT * FROM ai_personalities WHERE enabled = 1 ORDER BY sort_order ASC, name ASC',
    )
    .all() as PersonalityRow[];
  return rows.map(rowToPublicPersonality);
}

/** Finds a personality by slug or id, including disabled rows. */
export function findPersonalityBySlugOrId(idOrSlug: string): PersonalityRow | undefined {
  return getDb()
    .prepare('SELECT * FROM ai_personalities WHERE slug = ? OR id = ?')
    .get(idOrSlug, idOrSlug) as PersonalityRow | undefined;
}

/** Returns the default enabled teacher personality row. */
export function findDefaultPersonality(): PersonalityRow | undefined {
  return getDb()
    .prepare('SELECT * FROM ai_personalities WHERE is_default = 1 AND enabled = 1 LIMIT 1')
    .get() as PersonalityRow | undefined;
}

/** Returns the full system prompt for a personality row. */
export function getPersonalitySystemPrompt(row: PersonalityRow): string {
  return row.system_prompt;
}
