import type { Friendship, PendingRequests, User } from '@school-chat/shared';
import {
  deleteFriendship,
  deleteFriendshipBetween,
  findUserById,
  findUserByUsername,
  generateId,
  getFriendships,
  toPublicUser,
  upsertFriendship,
} from '../db/index.js';

export class FriendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendError';
  }
}

/** Resolves a user record for a friendship edge. */
function resolveUser(userId: string): User | undefined {
  return findUserById(userId);
}

/** Server-side friend request and block management. */
export const friendService = {
  sendRequest(currentUserId: string, username: string): Friendship {
    const target = findUserByUsername(username.trim());
    if (!target) throw new FriendError('User not found.');
    if (target.id === currentUserId) throw new FriendError('You cannot add yourself.');

    const friendships = getFriendships();
    const existing = friendships.find(
      (f) =>
        (f.requesterId === currentUserId && f.addresseeId === target.id) ||
        (f.requesterId === target.id && f.addresseeId === currentUserId),
    );

    if (existing?.status === 'accepted') {
      throw new FriendError('Already friends with this user.');
    }
    if (existing?.status === 'blocked') {
      throw new FriendError('Cannot send request to this user.');
    }
    if (existing?.status === 'pending') {
      throw new FriendError('Friend request already pending.');
    }

    const friendship: Friendship = {
      id: generateId(),
      requesterId: currentUserId,
      addresseeId: target.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    upsertFriendship(friendship);
    return friendship;
  },

  getFriends(currentUserId: string): Array<Friendship & { user: ReturnType<typeof toPublicUser> }> {
    return getFriendships()
      .filter(
        (f) =>
          f.status === 'accepted' &&
          (f.requesterId === currentUserId || f.addresseeId === currentUserId),
      )
      .map((f) => {
        const otherId = f.requesterId === currentUserId ? f.addresseeId : f.requesterId;
        const user = resolveUser(otherId)!;
        return { ...f, user: toPublicUser(user) };
      });
  },

  getPendingRequests(currentUserId: string): PendingRequests {
    const friendships = getFriendships().filter((f) => f.status === 'pending');

    const incoming = friendships
      .filter((f) => f.addresseeId === currentUserId)
      .map((f) => ({ ...f, user: toPublicUser(resolveUser(f.requesterId)!) }));

    const outgoing = friendships
      .filter((f) => f.requesterId === currentUserId)
      .map((f) => ({ ...f, user: toPublicUser(resolveUser(f.addresseeId)!) }));

    return { incoming, outgoing };
  },

  acceptRequest(currentUserId: string, friendshipId: string): void {
    const friendships = getFriendships();
    const friendship = friendships.find((f) => f.id === friendshipId);
    if (!friendship) throw new FriendError('Request not found.');
    if (friendship.addresseeId !== currentUserId) throw new FriendError('Not authorized.');

    upsertFriendship({ ...friendship, status: 'accepted' });
  },

  declineRequest(friendshipId: string): void {
    deleteFriendship(friendshipId);
  },

  unfriend(currentUserId: string, userId: string): void {
    deleteFriendshipBetween(currentUserId, userId);
  },

  blockUser(currentUserId: string, userId: string): void {
    deleteFriendshipBetween(currentUserId, userId);
    upsertFriendship({
      id: generateId(),
      requesterId: currentUserId,
      addresseeId: userId,
      status: 'blocked',
      createdAt: new Date().toISOString(),
    });
  },

  isBlocked(currentUserId: string, userId: string): boolean {
    return getFriendships().some(
      (f) =>
        f.status === 'blocked' &&
        ((f.requesterId === currentUserId && f.addresseeId === userId) ||
          (f.requesterId === userId && f.addresseeId === currentUserId)),
    );
  },

  areFriends(currentUserId: string, userId: string): boolean {
    return getFriendships().some(
      (f) =>
        f.status === 'accepted' &&
        ((f.requesterId === currentUserId && f.addresseeId === userId) ||
          (f.requesterId === userId && f.addresseeId === currentUserId)),
    );
  },
};
