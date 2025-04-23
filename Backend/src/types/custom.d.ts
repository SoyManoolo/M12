import { JwtPayload } from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}

export interface UserFilters {
    userId?: string;
    username?: string;
    email?: string;
}

export interface UpdateUserData {
    username?: string;
    email?: string;
    password?: string;
}

export {};