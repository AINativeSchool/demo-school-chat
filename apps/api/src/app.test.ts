import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { closeDb, initDb, resetDbHandle } from './db/index.js';

/** Parses a JSON response body from Fastify inject. */
function jsonBody<T>(payload: string): T {
  return JSON.parse(payload) as T;
}

/** Registers Alice and returns her auth token. */
async function registerAlice(app: Awaited<ReturnType<typeof buildApp>>) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      inviteCode: 'SCHOOL01',
      username: 'alice',
      password: 'password1',
      displayName: 'Alice',
    },
  });

  const body = jsonBody<{ token: string; user: { id: string; username: string } }>(response.body);
  return body;
}

describe('school chat api', () => {
  beforeEach(async () => {
    closeDb();
    resetDbHandle();
    initDb(':memory:');
  });

  it('registers, adds friend, and sends a message (happy path)', async () => {
    const app = await buildApp();
    const alice = await registerAlice(app);

    const inviteResponse = await app.inject({
      method: 'POST',
      url: '/api/invites',
      headers: { authorization: `Bearer ${alice.token}` },
    });
    const invite = jsonBody<{ code: string }>(inviteResponse.body);

    const bobResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        inviteCode: invite.code,
        username: 'bob',
        password: 'password2',
        displayName: 'Bob',
      },
    });
    const bob = jsonBody<{ token: string; user: { id: string } }>(bobResponse.body);

    await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      headers: { authorization: `Bearer ${bob.token}` },
      payload: { username: 'alice' },
    });

    const pendingResponse = await app.inject({
      method: 'GET',
      url: '/api/friends/pending',
      headers: { authorization: `Bearer ${alice.token}` },
    });
    const pending = jsonBody<{ incoming: Array<{ id: string }> }>(pendingResponse.body);

    await app.inject({
      method: 'POST',
      url: `/api/friends/${pending.incoming[0].id}/accept`,
      headers: { authorization: `Bearer ${alice.token}` },
    });

    const conversationResponse = await app.inject({
      method: 'POST',
      url: `/api/conversations/with/${alice.user.id}`,
      headers: { authorization: `Bearer ${bob.token}` },
    });
    const conversation = jsonBody<{ conversation: { id: string } }>(conversationResponse.body);

    const messageResponse = await app.inject({
      method: 'POST',
      url: `/api/conversations/${conversation.conversation.id}/messages`,
      headers: { authorization: `Bearer ${bob.token}` },
      payload: { content: 'Hey Alice!' },
    });
    const message = jsonBody<{ message: { content?: string } }>(messageResponse.body);

    expect(message.message.content).toBe('Hey Alice!');

    const messagesResponse = await app.inject({
      method: 'GET',
      url: `/api/conversations/${conversation.conversation.id}/messages`,
      headers: { authorization: `Bearer ${alice.token}` },
    });
    const messages = jsonBody<{ messages: Array<{ content?: string }> }>(messagesResponse.body);

    expect(messages.messages).toHaveLength(1);
  });

  it('rejects registration with an invalid invite code', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        inviteCode: 'BADCODE',
        username: 'testuser',
        password: 'password1',
        displayName: 'Test',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('blocks a user from sending messages', async () => {
    const app = await buildApp();
    const alice = await registerAlice(app);

    const inviteResponse = await app.inject({
      method: 'POST',
      url: '/api/invites',
      headers: { authorization: `Bearer ${alice.token}` },
    });
    const invite = jsonBody<{ code: string }>(inviteResponse.body);

    const bobResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        inviteCode: invite.code,
        username: 'bob',
        password: 'password2',
        displayName: 'Bob',
      },
    });
    const bob = jsonBody<{ token: string; user: { id: string } }>(bobResponse.body);

    await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      headers: { authorization: `Bearer ${bob.token}` },
      payload: { username: 'alice' },
    });

    const pendingResponse = await app.inject({
      method: 'GET',
      url: '/api/friends/pending',
      headers: { authorization: `Bearer ${alice.token}` },
    });
    const pending = jsonBody<{ incoming: Array<{ id: string }> }>(pendingResponse.body);

    await app.inject({
      method: 'POST',
      url: `/api/friends/${pending.incoming[0].id}/accept`,
      headers: { authorization: `Bearer ${alice.token}` },
    });

    const conversationResponse = await app.inject({
      method: 'POST',
      url: `/api/conversations/with/${bob.user.id}`,
      headers: { authorization: `Bearer ${alice.token}` },
    });
    const conversation = jsonBody<{ conversation: { id: string } }>(conversationResponse.body);

    await app.inject({
      method: 'POST',
      url: `/api/friends/${bob.user.id}/block`,
      headers: { authorization: `Bearer ${alice.token}` },
    });

    const messageResponse = await app.inject({
      method: 'POST',
      url: `/api/conversations/${conversation.conversation.id}/messages`,
      headers: { authorization: `Bearer ${alice.token}` },
      payload: { content: 'Hello' },
    });

    expect(messageResponse.statusCode).toBe(400);
  });
});
