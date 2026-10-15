import type { Server, Socket } from 'socket.io';
import { videoCallEvents } from '../socket/VideoCallEvents';
import { VideoCallService } from '../services/videoCall';

jest.mock('../models', () => ({}));
jest.mock('../socket/middleware/socketAuth', () => ({ socketAuthMiddleware: jest.fn() }));
jest.mock('../config/logger', () => ({ __esModule: true, default: { error: jest.fn() } }));

type ActiveCall = { users: { id: string; socketId: string }[]; startTime: Date; status: string };
const activeCalls = (VideoCallService as unknown as { activeCalls: Map<string, ActiveCall> }).activeCalls;

function setup(userId = 'alice', socketId = 'socket-alice') {
    const handlers = new Map<string, (data: unknown) => void>();
    const socket = {
        id: socketId,
        data: { user_id: userId, user: { username: 'Alice' } },
        on: jest.fn((event: string, handler: (data: unknown) => void) => { handlers.set(event, handler); }),
        emit: jest.fn()
    };
    const emitToRecipient = jest.fn();
    const io = {
        sockets: { sockets: new Map([['socket-bob', {}]]) },
        to: jest.fn(() => ({ emit: emitToRecipient }))
    };
    videoCallEvents(socket as unknown as Socket, io as unknown as Server);
    return { handler: handlers.get('video:chat-message')!, socket, io, emitToRecipient };
}

beforeEach(() => {
    jest.clearAllMocks();
    activeCalls.clear();
});

describe('video:chat-message', () => {
    const message = { id: 'm1', content: 'Hola', to: 'call-1', sender: 'falso', isOwn: true };

    function setCall(status: string) {
        activeCalls.set('call-1', {
            users: [
                { id: 'alice', socketId: 'socket-alice' },
                { id: 'bob', socketId: 'socket-bob' }
            ],
            startTime: new Date(),
            status
        });
    }

    test.each(['connecting', 'connected'])('delivers once during %s with a trusted sender', status => {
        setCall(status);
        const { handler, socket, io, emitToRecipient } = setup();
        handler(message);
        expect(io.to).toHaveBeenCalledTimes(1);
        expect(io.to).toHaveBeenCalledWith('socket-bob');
        expect(emitToRecipient).toHaveBeenCalledWith('video:chat-message', expect.objectContaining({
            id: 'm1', content: 'Hola', sender: 'Alice', isOwn: false
        }));
        expect(socket.emit).not.toHaveBeenCalled();
    });

    test.each(['connecting', 'connected'])('rejects an outsider during %s', status => {
        setCall(status);
        const { handler, socket, io } = setup('outsider', 'socket-outsider');
        handler(message);
        expect(io.to).not.toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('video:chat-message_result', expect.objectContaining({ success: false }));
    });

    test('rejects a different socket for a participant', () => {
        setCall('connected');
        const { handler, socket, io } = setup('alice', 'socket-impostor');
        handler(message);
        expect(io.to).not.toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('video:chat-message_result', expect.objectContaining({ success: false }));
    });

    test('rejects a missing call and invalid content', () => {
        const { handler, socket, io } = setup();
        activeCalls.clear();
        handler(message);
        handler({ ...message, to: '' });
        handler({ ...message, content: '   ' });
        expect(io.to).not.toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledTimes(3);
        expect(socket.emit).toHaveBeenCalledWith('video:chat-message_result', expect.objectContaining({ success: false }));
    });
});
