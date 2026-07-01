import { beforeEach, describe, expect, it } from 'vitest';
import { authService, AuthError } from '../services/authService';
import { friendService } from '../services/friendService';
import { chatService, ChatError } from '../services/chatService';
import { storageService } from '../storage/storageService';

describe('school chat flow', () => {
  beforeEach(() => {
    storageService.clearAll();
    storageService.seedDefaults();
  });

  it('registers, adds friend, and sends a message (happy path)', async () => {
    await authService.register('SCHOOL01', 'alice@test.com', 'password1', 'Alice');

    const code = authService.generateInviteCode();
    authService.logout();

    await authService.register(code, 'bob@test.com', 'password2', 'Bob');

    const alice = storageService.findUserByUsername('alice');
    expect(alice).toBeDefined();

    friendService.sendRequest('alice');
    const { outgoing } = friendService.getPendingRequests();
    expect(outgoing).toHaveLength(1);

    authService.logout();
    await authService.login('alice@test.com', 'password1');

    const { incoming } = friendService.getPendingRequests();
    expect(incoming).toHaveLength(1);

    friendService.acceptRequest(incoming[0].id);
    const friends = friendService.getFriends();
    expect(friends).toHaveLength(1);

    const conv = chatService.getOrCreateConversation(friends[0].user.id);
    const message = chatService.sendMessage(conv.id, { content: 'Hey Alice!' });

    expect(message.content).toBe('Hey Alice!');
    expect(chatService.getMessages(conv.id)).toHaveLength(1);
  });

  it('rejects registration with an invalid invite code', async () => {
    await expect(
      authService.register('BADCODE', 'test@test.com', 'password1', 'Test'),
    ).rejects.toThrow(AuthError);
  });

  it('blocks a user from sending messages', async () => {
    await authService.register('SCHOOL01', 'alice@test.com', 'password1', 'Alice');
    const code = authService.generateInviteCode();
    authService.logout();

    await authService.register(code, 'bob@test.com', 'password2', 'Bob');
    friendService.sendRequest('alice');

    authService.logout();
    await authService.login('alice@test.com', 'password1');
    const { incoming } = friendService.getPendingRequests();
    friendService.acceptRequest(incoming[0].id);

    const bob = storageService.findUserByUsername('bob')!;
    const conv = chatService.getOrCreateConversation(bob.id);
    friendService.blockUser(bob.id);

    expect(() => chatService.sendMessage(conv.id, { content: 'Hello' })).toThrow(ChatError);
  });
});
