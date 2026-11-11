import { allowSocketRequest } from '../socket/allowSocketRequest';
import { ALLOWED_ORIGINS } from '../config/cors';

describe('Socket.IO handshake origin', () => {
    test.each(ALLOWED_ORIGINS)('accepts authorized origin %s with a cookie', origin => {
        expect(allowSocketRequest({ headers: { origin, cookie: 'session=valid-session' } })).toBe(true);
    });

    test.each([
        'https://foreign.example',
        `${ALLOWED_ORIGINS[0]}.foreign.example`,
        'null'
    ])('rejects foreign origin %s even with a session cookie', origin => {
        expect(allowSocketRequest({ headers: {
            origin,
            cookie: 'session=valid-session'
        } })).toBe(false);
    });

    test('rejects a foreign origin without a cookie', () => {
        expect(allowSocketRequest({ headers: { origin: 'https://foreign.example' } })).toBe(false);
    });

    test('rejects a missing origin when cookies are present', () => {
        expect(allowSocketRequest({ headers: { cookie: 'session=valid-session' } })).toBe(false);
    });

    test('allows a client without origin or cookies', () => {
        expect(allowSocketRequest({ headers: {} })).toBe(true);
    });
});
