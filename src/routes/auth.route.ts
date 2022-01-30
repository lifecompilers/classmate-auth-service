import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

export class AuthRouter {

    private controller: AuthController = new AuthController();

    public getAllRoutes(): Router {

        const routes = Router();

        routes.route('/token')
            .post(this.controller.tokenSignIn)

        routes.route('/code')
            .post(this.controller.authorizationCodeSignIn)

        routes.route('/refresh')
            .post(this.controller.tokenRefresh)

        routes.route('/currentuser')
            .get(this.controller.currentUser)

        routes.route('/reset-password')
            .post(this.controller.resetPassword)

        routes.route('/change-password')
            .post(this.controller.changePassword)

        return routes;
    }
}