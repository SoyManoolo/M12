import { Request, Response } from 'express';
import { AuthToken } from '../middlewares/validation/authentication/jwt';
import { AppError } from '../middlewares/errors/AppError';

test('unbound authentication middleware rejects missing credentials with the expected error', async () => {
    const middleware = AuthToken.verifyToken;
    const req = { headers: {}, method: 'GET' } as Request;
    const next = jest.fn();

    await expect(middleware(req, {} as Response, next)).rejects.toEqual(new AppError(403, 'FormatJWT'));
    expect(next).not.toHaveBeenCalled();
});
