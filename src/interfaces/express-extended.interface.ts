import { Application, Express, Request } from 'express';
// import OAuthServer from 'oauth2-express';

export interface ExpressExtended extends Express {
    oauth?: any
}

export interface ApplicationExtended extends Application {
    oauth?: any
}

export interface RequestExtended extends Request {
    app: ApplicationExtended
}
