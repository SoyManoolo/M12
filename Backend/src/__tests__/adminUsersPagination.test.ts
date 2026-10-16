import type { Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/user';
import { UserService } from '../services/user';
import { User } from '../models';
import { Op } from 'sequelize';

describe('GET /users/admin pagination contract', () => {
    const cursor = '123e4567-e89b-42d3-a456-426614174000';
    const page = { users: [{ user_id: cursor }], hasNextPage: true, nextCursor: cursor };
    const getAdminUsers = jest.fn();
    const controller = new UserController({ getAdminUsers } as unknown as UserService);
    let response: Response;
    let next: NextFunction;

    beforeEach(() => {
        getAdminUsers.mockReset().mockResolvedValue(page);
        response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
        next = jest.fn();
    });

    it('keeps the initial page and its continuation cursor', async () => {
        await controller.getAdminUsers({ query: {} } as Request, response, next);
        expect(getAdminUsers).toHaveBeenCalledWith(100, undefined);
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({ success: true, status: 200, data: page });
        expect(next).not.toHaveBeenCalled();
    });

    it('forwards a valid cursor to the service', async () => {
        await controller.getAdminUsers({ query: { cursor } } as unknown as Request, response, next);
        expect(getAdminUsers).toHaveBeenCalledWith(100, cursor);
    });

    it.each([[''], ['invalid'], [['one', 'two']]])('rejects an invalid cursor: %p', async (value) => {
        await controller.getAdminUsers({ query: { cursor: value } } as unknown as Request, response, next);
        expect(getAdminUsers).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400, type: 'InvalidCursor' }));
    });
});

describe('admin users continuation after a soft deletion', () => {
    afterEach(() => jest.restoreAllMocks());

    it('uses the deleted page boundary to fetch the next user without repeating it', async () => {
        const cursor = '123e4567-e89b-42d3-a456-426614174000';
        const createdAt = new Date('2026-01-02T00:00:00.000Z');
        const boundary = { getDataValue: jest.fn().mockReturnValue(createdAt) } as unknown as User;
        const olderUser = { dataValues: { user_id: '123e4567-e89b-42d3-a456-426614174001' } } as unknown as User;
        jest.spyOn(User, 'findByPk').mockResolvedValue(boundary);
        const findAll = jest.spyOn(User, 'findAll').mockResolvedValue([olderUser]);

        const page = await new UserService().getAdminUsers(100, cursor);

        expect(User.findByPk).toHaveBeenCalledWith(cursor, { paranoid: false });
        expect(findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                [Op.or]: [
                    { created_at: { [Op.lt]: createdAt } },
                    { created_at: createdAt, user_id: { [Op.lt]: cursor } }
                ]
            }
        }));
        expect(page.users).toEqual([olderUser]);
        expect(page.nextCursor).toBeNull();
    });
});
