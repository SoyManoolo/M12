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

describe('admin users page boundaries', () => {
    afterEach(() => jest.restoreAllMocks());

    it('exposes the 101st user on the next page with a stable boundary', async () => {
        const createdAt = new Date('2026-01-02T00:00:00.000Z');
        const ids = Array.from({ length: 101 }, (_, index) =>
            `123e4567-e89b-42d3-a456-${String(101 - index).padStart(12, '0')}`);
        const users = ids.map(user_id => ({ dataValues: { user_id } } as unknown as User));
        const boundary = { getDataValue: jest.fn().mockReturnValue(createdAt) } as unknown as User;
        jest.spyOn(User, 'findByPk').mockResolvedValue(boundary);
        const findAll = jest.spyOn(User, 'findAll')
            .mockResolvedValueOnce(users)
            .mockResolvedValueOnce([users[100]]);

        const service = new UserService();
        const first = await service.getAdminUsers();
        const second = await service.getAdminUsers(100, first.nextCursor!);

        expect(first.users).toHaveLength(100);
        expect(first.hasNextPage).toBe(true);
        expect(first.nextCursor).toBe(ids[99]);
        expect(second.users).toEqual([users[100]]);
        expect(second.hasNextPage).toBe(false);
        expect(second.nextCursor).toBeNull();
        expect(new Set([...first.users, ...second.users].map(user => user.dataValues.user_id)).size).toBe(101);
        expect(User.findByPk).toHaveBeenCalledWith(ids[99], { paranoid: false });
        expect(findAll).toHaveBeenNthCalledWith(1, expect.objectContaining({
            limit: 101,
            order: [['created_at', 'DESC'], ['user_id', 'DESC']]
        }));
        expect(findAll).toHaveBeenNthCalledWith(2, expect.objectContaining({
            where: {
                [Op.or]: [
                    { created_at: { [Op.lt]: createdAt } },
                    { created_at: createdAt, user_id: { [Op.lt]: ids[99] } }
                ]
            }
        }));
    });

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
