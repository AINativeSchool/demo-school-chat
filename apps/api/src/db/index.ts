import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type {
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

/** Closes the database — useful in tests. */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/** Resets the in-memory handle without closing — for tests that re-init. */
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

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(requester_id, addressee_id);
  `);
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
