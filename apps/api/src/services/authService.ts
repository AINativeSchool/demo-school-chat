import bcrypt from 'bcryptjs';
import type { AuthResponse, InviteCode, PublicUser, User } from '@school-chat/shared';
import {
  findRedeemableInvite,
  findUserById,
  findUserByUsername,
  generateId,
  getInviteCodes,
  normalizeUsername,
  randomInviteCode,
  saveInviteCode,
  saveUser,
  toPublicUser,
  validateUsername,
} from '../db/index.js';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Server-side invite-only registration and profile management. */
export const authService = {
  async register(
    inviteCode: string,
    username: string,
    password: string,
    displayName: string,
  ): Promise<{ user: User }> {
    const normalizedCode = inviteCode.trim().toUpperCase();
    const invite = findRedeemableInvite(normalizedCode);

    if (!invite) {
      const knownCode = getInviteCodes().some((entry) => entry.code === normalizedCode);
      if (knownCode) {
        throw new AuthError('Invite code has expired or reached its use limit.');
      }
      throw new AuthError('Invalid invite code.');
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      throw new AuthError(usernameError);
    }

    const normalizedUsername = normalizeUsername(username);
    if (findUserByUsername(normalizedUsername)) {
      throw new AuthError('This username is already taken.');
    }
    if (password.length < 6) {
      throw new AuthError('Password must be at least 6 characters.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: generateId(),
      passwordHash,
      displayName: displayName.trim(),
      username: normalizedUsername,
      createdAt: new Date().toISOString(),
    };

    saveUser(user);
    saveInviteCode({ ...invite, useCount: invite.useCount + 1 });

    return { user };
  },

  async login(username: string, password: string): Promise<{ user: User }> {
    const user = findUserByUsername(username);
    if (!user) {
      throw new AuthError('Invalid username or password.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AuthError('Invalid username or password.');
    }

    return { user };
  },

  getMe(userId: string): PublicUser {
    const user = findUserById(userId);
    if (!user) throw new AuthError('User not found.');
    return toPublicUser(user);
  },

  updateProfile(
    userId: string,
    updates: { displayName?: string; avatarUrl?: string },
  ): PublicUser {
    const user = findUserById(userId);
    if (!user) throw new AuthError('User not found.');

    const updated: User = {
      ...user,
      displayName: updates.displayName?.trim() ?? user.displayName,
      avatarUrl: updates.avatarUrl ?? user.avatarUrl,
    };

    saveUser(updated);
    return toPublicUser(updated);
  },

  listMyInviteCodes(userId: string): InviteCode[] {
    return getInviteCodes().filter(
      (entry) =>
        entry.createdBy === userId &&
        entry.useCount < entry.maxUses &&
        !(entry.expiresAt && new Date(entry.expiresAt) < new Date()),
    );
  },

  generateInviteCode(userId: string): string {
    const codes = getInviteCodes();
    let code = randomInviteCode();
    while (codes.some((entry) => entry.code === code)) {
      code = randomInviteCode();
    }

    saveInviteCode({
      code,
      createdBy: userId,
      maxUses: 10,
      useCount: 0,
    });

    return code;
  },
};

/** Builds the auth response payload with JWT token. */
export function buildAuthResponse(
  user: User,
  signToken: (payload: { userId: string; username: string }) => string,
): AuthResponse {
  return {
    token: signToken({ userId: user.id, username: user.username }),
    user: toPublicUser(user),
  };
}
