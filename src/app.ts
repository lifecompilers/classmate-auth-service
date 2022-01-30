import express, { json, urlencoded } from 'express';
import { healthCheckRouter } from './routes/health-check.route';
import { ExpressExtended } from './interfaces/express-extended.interface';
import { AUTH_URL, BASE_URL, CLIENTS_URL, MASTERS_URL, USERS_URL } from './shared/constants/url-constants';
import { ClientRouter } from './routes/client.route';
import { UserRouter } from './routes/user.route';
import { AuthRouter } from './routes/auth.route';
import { errorHandler } from './shared/middlewares/error-handler';
import { JWT_ACCESS_TOKEN_EXPIRY_SECONDS, JWT_AUTHORIZATION_TOKEN_EXPIRY_SECONDS, JWT_REFRESH_TOKEN_EXPIRY_SECONDS } from './shared/constants/env-constants';
import authorize from './shared/middlewares/authorize';
import { ALLOWED_OAUTH_GRANTS, ROLES } from './shared/constants/app-constants';
import path from 'path';
import cors from 'cors';
import authenticateHandler from './shared/functions/authenticate-handler';
import { AuthController } from './controllers/auth.controller';
import { MasterRouter } from './routes/master.route';
import { ClientController } from './controllers/client.controller';
import loggingMiddleware from './shared/middlewares/logging-middleware';
const OAuthServer = require('oauth2-express');
const OauthModel = require('./models/oauth.model');
const es6Renderer = require('express-es6-template-engine');

const app: ExpressExtended = express();

app.oauth = new OAuthServer({
  model: OauthModel, // See https://github.com/oauthjs/node-oauth2-server for specification
  accessTokenLifetime: JWT_ACCESS_TOKEN_EXPIRY_SECONDS,   // expiry time in seconds, consistent with JWT setting in model.js
  refreshTokenLifetime: JWT_REFRESH_TOKEN_EXPIRY_SECONDS,
  authorizationCodeLifetime: JWT_AUTHORIZATION_TOKEN_EXPIRY_SECONDS,
  alwaysIssueNewRefreshToken: false,
  requireClientAuthentication: false,
  useErrorHandler: true,
  authWithoutClientCredentials: true,
  allowedGrantTypesWithoutClientCredentials: ALLOWED_OAUTH_GRANTS
});

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(loggingMiddleware);

const authController = new AuthController();
const clientController = new ClientController();

app.use("/api/healthcheck", healthCheckRouter);
app.use(CLIENTS_URL, app.oauth.authenticate(), authorize(ROLES.SUPERADMIN), (new ClientRouter()).getAllRoutes());
app.use(USERS_URL, app.oauth.authenticate(), authorize(ROLES.SUPERADMIN, ROLES.ADMIN), (new UserRouter()).getAllRoutes());

app.use(AUTH_URL, (new AuthRouter()).getAllRoutes());
app.use(MASTERS_URL, (new MasterRouter()).getAllRoutes());

app.use(express.static(path.join(__dirname, 'views')));
app.engine('html', es6Renderer);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.get('/login', function (_req, res) {
  res.render('login', {
    locals: {
      errorMessage: ''
    }
  });
});

app.post("/login", app.oauth.authorize({
  authenticateHandler: authenticateHandler
}));

app.get('/new-user-account/:code', authController.renderNewUserAccountLink);
app.post('/new-user-account/:code', authController.performNewUserAccountSetup);

app.get('/reset-password/:code', authController.renderResetPasswordLink);
app.post('/reset-password/:code', authController.performResetPassword);

app.get('/reset-password', function (_req, res) {
  res.render('reset-password', {
    locals: {
      errorMessage: '',
      successMessage: ''
    }
  });
});
app.post('/reset-password', authController.resetPassword);

app.get(`${BASE_URL}/my/client`, app.oauth.authenticate(), clientController.getClientByLoggedInUser);
app.put(`${BASE_URL}/my/client`, app.oauth.authenticate(), clientController.updateClientByLoggedInUser);

app.get('/', function (_req, res) {
  res.redirect('/login');
});

app.use(errorHandler);

export { app };