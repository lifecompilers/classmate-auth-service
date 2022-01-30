import { Router } from 'express';
import { MasterController } from '../controllers/master.controller';

export class MasterRouter {

    private controller: MasterController = new MasterController();

    public getAllRoutes(): Router {

        const routes = Router();

        routes.route('/build/cache/clients')
            .get(this.controller.prepareClientCache)

        return routes;
    }
}