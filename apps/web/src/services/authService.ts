import bcrypt from 'bcryptjs';
import type { InviteCode, Session, User } from '@school-chat/shared';
import { storageService } from '../storage/storageService';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Derive a URL-safe username from display name. */
function toUsername(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);
  return base || 'user';
}

/** Ensure username is unique by appending a suffix if needed. */
function uniqueUsername(displayName: string): string {
  let username = toUsername(displayName);
  let suffix = 1;
  while (storageService.findUserByUsername(username)) {
    username = `${toUsername(displayName)}${suffix}`;
    suffix += 1;
  }
  return username;
}

/** Generate a random 8-character invite code. */
function randomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Pick the first invite entry that can still be redeemed. */
function findRedeemableInvite(codes: InviteCode[], normalizedCode: string): InviteCode | undefined {
  return codes.find((entry) => {
    if (entry.code !== normalizedCode) return false;
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) return false;
    return entry.useCount < entry.maxUses;
  });
}

/** Build a helpful error when a generated code is missing from this browser. */
function inviteNotFoundMessage(normalizedCode: string): string {
  if (normalizedCode === 'SCHOOL01') {
    return 'Invalid invite code.';
  }

  return (
    'Invite code not found in this browser. Generated codes are stored locally — ' +
    'log out on the device that created the code, then register here with that code. ' +
    'Codes shared to another phone or an incognito window will not work in v1.'
  );
}

/** Handles local invite-only registration and session management. */
export const authService = {
  async register(
    inviteCode: string,
    email: string,
    password: string,
    displayName: string,
  ): Promise<User> {
    const normalizedCode = inviteCode.trim().toUpperCase();
    const codes = storageService.getInviteCodes();
    const invite = findRedeemableInvite(codes, normalizedCode);

    if (!invite) {
      const knownCode = codes.some((entry) => entry.code === normalizedCode);
      if (knownCode) {
        throw new AuthError('Invite code has expired or reached its use limit.');
      }
      throw new AuthError(inviteNotFoundMessage(normalizedCode));
    }
    if (storageService.findUserByEmail(email)) {
      throw new AuthError('An account with this email already exists.');
    }
    if (password.length < 6) {
      throw new AuthError('Password must be at least 6 characters.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: storageService.generateId(),
      email: email.trim().toLowerCase(),
      passwordHash,
      displayName: displayName.trim(),
      username: uniqueUsername(displayName),
      createdAt: new Date().toISOString(),
    };

    storageService.saveUser(user);
    invite.useCount += 1;
    storageService.saveInviteCodes(codes);

    const session: Session = {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
    };
    storageService.setSession(session);

    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const user = storageService.findUserByEmail(email);
    if (!user) {
      throw new AuthError('Invalid email or password.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AuthError('Invalid email or password.');
    }

    storageService.setSession({
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    return user;
  },

  logout(): void {
    storageService.setSession(null);
  },

  getSession(): Session | null {
    return storageService.getSession();
  },

  getCurrentUser(): User | null {
    const session = storageService.getSession();
    if (!session) return null;
    return storageService.getUsers().find((u) => u.id === session.userId) ?? null;
  },

  updateProfile(updates: { displayName?: string; avatarUrl?: string }): User {
    const user = this.getCurrentUser();
    if (!user) throw new AuthError('Not logged in.');

    const updated: User = {
      ...user,
      displayName: updates.displayName?.trim() ?? user.displayName,
      avatarUrl: updates.avatarUrl ?? user.avatarUrl,
    };

    storageService.saveUser(updated);

    const session = storageService.getSession();
    if (session) {
      storageService.setSession({ ...session, displayName: updated.displayName });
    }

    return updated;
  },

  /** List invite codes created by the current user that still have uses left. */
  listMyInviteCodes(): InviteCode[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    return storageService
      .getInviteCodes()
      .filter(
        (entry) =>
          entry.createdBy === user.id &&
          entry.useCount < entry.maxUses &&
          !(entry.expiresAt && new Date(entry.expiresAt) < new Date()),
      );
  },

  generateInviteCode(): string {
    const user = this.getCurrentUser();
    if (!user) throw new AuthError('Not logged in.');

    const codes = storageService.getInviteCodes();
    let code = randomInviteCode();
    while (codes.some((entry) => entry.code === code)) {
      code = randomInviteCode();
    }

    codes.push({
      code,
      createdBy: user.id,
      maxUses: 10,
      useCount: 0,
    });
    storageService.saveInviteCodes(codes);
    return code;
  },
};
