import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { validateRequest } from '../shared/middlewares/validate-request';

export class UserRouter {

    private controller: UserController = new UserController();

    public getAllRoutes(): Router {

        const routes = Router();

        routes.route('/')
            .post([
                body('email')
                    .isEmail()
                    .withMessage('Email must be valid'),
                body('client').notEmpty().withMessage('client is required').isMongoId().withMessage("Pass valid client"),
                body('password').notEmpty().withMessage('password is required'),
                body('role').notEmpty().withMessage('role is required'),
            ],
                validateRequest,
                this.controller.createUser.bind(this.controller))
            .get(this.controller.getUserList)

        routes.route('/:id')
            .get(this.controller.getUserById)
            .put(this.controller.updateUser)
            .delete(this.controller.deleteUserById)

        routes.route('/client/:clientId')
            .get(this.controller.getUserList)

        routes.route('/email/initialize')
            .post(this.controller.sendUserAccountInitializationMail.bind(this.controller))

        routes.route('/create/from-clients-portal')
            .post(this.controller.createUserFromClientsPortal)
        
        routes.route('/by-userids/from-client-portal')
            .get(this.controller.getUserListByUserIdsFromClientPortal)

        return routes;
    }
}