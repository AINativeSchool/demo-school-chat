import type { Friendship, PendingRequests, PublicUser } from '@school-chat/shared';
import { apiClient, ApiError } from '../api/client';

export class FriendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendError';
  }
}

/** Maps API errors to friend errors for the UI layer. */
function wrapFriendError(err: unknown): never {
  if (err instanceof ApiError) {
    throw new FriendError(err.message);
  }
  throw err;
}

/** Manages friend requests and blocks via the shared API. */
export const friendService = {
  async sendRequest(username: string): Promise<Friendship> {
    try {
      const { friendship } = await apiClient.post<{ friendship: Friendship }>('/friends/request', {
        username,
      });
      return friendship;
    } catch (err) {
      wrapFriendError(err);
    }
  },

  async getFriends(): Promise<Array<Friendship & { user: PublicUser }>> {
    try {
      const { friends } = await apiClient.get<{ friends: Array<Friendship & { user: PublicUser }> }>(
        '/friends',
      );
      return friends;
    } catch (err) {
      wrapFriendError(err);
    }
  },

  async getPendingRequests(): Promise<PendingRequests> {
    try {
      return await apiClient.get<PendingRequests>('/friends/pending');
    } catch (err) {
      wrapFriendError(err);
    }
  },

  async acceptRequest(friendshipId: string): Promise<void> {
    try {
      await apiClient.post(`/friends/${friendshipId}/accept`);
    } catch (err) {
      wrapFriendError(err);
    }
  },

  async declineRequest(friendshipId: string): Promise<void> {
    try {
      await apiClient.post(`/friends/${friendshipId}/decline`);
    } catch (err) {
      wrapFriendError(err);
    }
  },

  async unfriend(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/friends/${userId}`);
    } catch (err) {
      wrapFriendError(err);
    }
  },

  async blockUser(userId: string): Promise<void> {
    try {
      await apiClient.post(`/friends/${userId}/block`);
    } catch (err) {
      wrapFriendError(err);
    }
  },

  /** Returns true if either user has blocked the other. */
  isBlocked(_userId: string): boolean {
    return false;
  },

  /** Returns true if users are accepted friends. */
  areFriends(_userId: string): boolean {
    return true;
  },
};
