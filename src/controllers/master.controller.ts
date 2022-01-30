import { NextFunction, Request, Response } from 'express';
import { buildClientCache } from '../services/cache.service';

export class MasterController {
    public async prepareClientCache(_request: Request, response: Response, next: NextFunction) {
        try {
            await buildClientCache();
            response.status(200).send();
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
}