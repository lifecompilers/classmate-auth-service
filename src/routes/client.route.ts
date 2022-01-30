import { Router } from 'express';
import { body } from 'express-validator';
import { ClientController } from '../controllers/client.controller';
import { validateRequest } from '../shared/middlewares/validate-request';

export class ClientRouter {

    private controller: ClientController = new ClientController();

    public getAllRoutes(): Router {

        const routes = Router();

        routes.route('/')
            .post([
                body('clientName').notEmpty().withMessage('clientName is required'),
                body('domain').notEmpty().withMessage('domain is required'),
                body('dbConnectionString').notEmpty().withMessage('dbConnectionString is required'),
                body('isActive').notEmpty().withMessage('isActive is required'),
            ],
                validateRequest,
                this.controller.createClient)
            .get(this.controller.getClientList)

        routes.route('/:id')
            .get(this.controller.getClientById)
            .put(this.controller.updateClient)
            .delete(this.controller.deleteClientById)
        
        routes.route('/:clientId/subscriptions')
            .post(this.controller.updateClientSubscription)
            .get(this.controller.getClientSubscriptionsByClientId)

        return routes;
    }
}