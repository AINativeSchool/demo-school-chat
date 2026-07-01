import type { Friendship, PendingRequests, User } from '@school-chat/shared';
import { authService } from './authService';
import { storageService } from '../storage/storageService';

export class FriendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendError';
  }
}

/** Resolves a user record for a friendship edge. */
function resolveUser(userId: string): User | undefined {
  return storageService.getUsers().find((u) => u.id === userId);
}

/** Manages friend requests and blocks in localStorage. */
export const friendService = {
  sendRequest(username: string): Friendship {
    const current = authService.getCurrentUser();
    if (!current) throw new FriendError('Not logged in.');

    const target = storageService.findUserByUsername(username.trim());
    if (!target) throw new FriendError('User not found.');
    if (target.id === current.id) throw new FriendError('You cannot add yourself.');

    const friendships = storageService.getFriendships();
    const existing = friendships.find(
      (f) =>
        (f.requesterId === current.id && f.addresseeId === target.id) ||
        (f.requesterId === target.id && f.addresseeId === current.id),
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
      id: storageService.generateId(),
      requesterId: current.id,
      addresseeId: target.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    friendships.push(friendship);
    storageService.saveFriendships(friendships);
    return friendship;
  },

  getFriends(): Array<Friendship & { user: User }> {
    const current = authService.getCurrentUser();
    if (!current) return [];

    return storageService
      .getFriendships()
      .filter((f) => f.status === 'accepted' && (f.requesterId === current.id || f.addresseeId === current.id))
      .map((f) => {
        const otherId = f.requesterId === current.id ? f.addresseeId : f.requesterId;
        const user = resolveUser(otherId)!;
        return { ...f, user };
      });
  },

  getPendingRequests(): PendingRequests {
    const current = authService.getCurrentUser();
    if (!current) return { incoming: [], outgoing: [] };

    const friendships = storageService.getFriendships().filter((f) => f.status === 'pending');

    const incoming = friendships
      .filter((f) => f.addresseeId === current.id)
      .map((f) => ({ ...f, user: resolveUser(f.requesterId)! }));

    const outgoing = friendships
      .filter((f) => f.requesterId === current.id)
      .map((f) => ({ ...f, user: resolveUser(f.addresseeId)! }));

    return { incoming, outgoing };
  },

  acceptRequest(friendshipId: string): void {
    const current = authService.getCurrentUser();
    if (!current) throw new FriendError('Not logged in.');

    const friendships = storageService.getFriendships();
    const friendship = friendships.find((f) => f.id === friendshipId);
    if (!friendship) throw new FriendError('Request not found.');
    if (friendship.addresseeId !== current.id) throw new FriendError('Not authorized.');

    friendship.status = 'accepted';
    storageService.saveFriendships(friendships);
  },

  declineRequest(friendshipId: string): void {
    const current = authService.getCurrentUser();
    if (!current) throw new FriendError('Not logged in.');

    const friendships = storageService.getFriendships().filter((f) => f.id !== friendshipId);
    storageService.saveFriendships(friendships);
  },

  unfriend(userId: string): void {
    const current = authService.getCurrentUser();
    if (!current) throw new FriendError('Not logged in.');

    const friendships = storageService
      .getFriendships()
      .filter(
        (f) =>
          !(
            f.status === 'accepted' &&
            ((f.requesterId === current.id && f.addresseeId === userId) ||
              (f.requesterId === userId && f.addresseeId === current.id))
          ),
      );
    storageService.saveFriendships(friendships);
  },

  blockUser(userId: string): void {
    const current = authService.getCurrentUser();
    if (!current) throw new FriendError('Not logged in.');

    let friendships = storageService.getFriendships().filter(
      (f) =>
        !(
          (f.requesterId === current.id && f.addresseeId === userId) ||
          (f.requesterId === userId && f.addresseeId === current.id)
        ),
    );

    friendships.push({
      id: storageService.generateId(),
      requesterId: current.id,
      addresseeId: userId,
      status: 'blocked',
      createdAt: new Date().toISOString(),
    });

    storageService.saveFriendships(friendships);
  },

  /** Returns true if either user has blocked the other. */
  isBlocked(userId: string): boolean {
    const current = authService.getCurrentUser();
    if (!current) return true;

    return storageService.getFriendships().some(
      (f) =>
        f.status === 'blocked' &&
        ((f.requesterId === current.id && f.addresseeId === userId) ||
          (f.requesterId === userId && f.addresseeId === current.id)),
    );
  },

  /** Returns true if users are accepted friends. */
  areFriends(userId: string): boolean {
    const current = authService.getCurrentUser();
    if (!current) return false;

    return storageService.getFriendships().some(
      (f) =>
        f.status === 'accepted' &&
        ((f.requesterId === current.id && f.addresseeId === userId) ||
          (f.requesterId === userId && f.addresseeId === current.id)),
    );
  },
};
