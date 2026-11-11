import { afterEach, describe, expect, it, vi } from 'vitest';
import { chatApi } from './chat/api';
import { getChatService } from './chat.service';
import { friendshipService } from './friendship.service';
import { postService } from './post.service';
import { COOKIE_SESSION, fetchWithSession } from './session';

const { io, socket, listeners } = vi.hoisted(() => {
  const listeners = new Map<string, () => void>();
  const socket = {
    connected: false,
    auth: {},
    on: vi.fn((name: string, handler: () => void) => listeners.set(name, handler)),
    removeAllListeners: vi.fn(() => listeners.clear()),
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
  };
  return { io: vi.fn(() => socket), socket, listeners };
});

vi.mock('./chat/client', () => ({ loadSocketClient: async () => ({ io }) }));

afterEach(() => vi.unstubAllGlobals());

describe('browser cookie session', () => {
  it('includes credentials for friendship, post mutations, and chat without a fictitious Bearer token', async () => {
    const request = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ success: true, data: {} }));
    vi.stubGlobal('fetch', request);

    await friendshipService.sendFriendRequest(COOKIE_SESSION, 'friend');
    await postService.updatePost(COOKIE_SESSION, 'post', 'Updated');
    await chatApi.getActiveChats(COOKIE_SESSION);
    await chatApi.createMessage('friend', 'Hello', COOKIE_SESSION);

    expect(request).toHaveBeenCalledTimes(4);
    for (const [, options] of request.mock.calls) {
      expect(options?.credentials).toBe('include');
      expect(new Headers(options?.headers).has('Authorization')).toBe(false);
    }
    expect(request.mock.calls.map(([, options]) => options?.method)).toEqual(['POST', 'PATCH', undefined, 'POST']);
  });

  it('still accepts a caller supplying a Bearer token', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({}));
    vi.stubGlobal('fetch', request);

    await fetchWithSession('https://api.example.test', 'old-client-token');

    expect(new Headers(request.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer old-client-token');
  });

  it('starts the chat socket using the identity restored by the session', async () => {
    await getChatService().connect(COOKIE_SESSION, 'current-account');
    expect(io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ withCredentials: true }));
    expect(socket.connect).toHaveBeenCalledOnce();
    expect(socket.auth).toEqual({});

    listeners.get('connect')?.();

    expect(socket.emit).toHaveBeenCalledWith('join-user', { userId: 'current-account', token: undefined });
    getChatService().disconnect();
  });
});
