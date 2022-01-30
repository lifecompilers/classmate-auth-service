import { NextFunction, Response } from 'express';
import { RequestExtended } from '../../interfaces/express-extended.interface';
import { ForbiddenAccessError } from '../errors/forbidden-access-error';

export default function authorize(...roles: string[]) {
    return [
        (_req: RequestExtended, res: Response, next: NextFunction) => {
            const loggedInUserData = res.locals.oauth.token;
            if (roles.length && !roles.includes(loggedInUserData.user.role)) {
                throw new ForbiddenAccessError();
            }
            next();
        }
    ];
}