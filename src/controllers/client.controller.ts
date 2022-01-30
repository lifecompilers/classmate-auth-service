import { NextFunction, Request, Response } from 'express'
import { OAuthClientData } from '../models/oauth-client.model';
import { buildClientCache } from '../services/cache.service';
import { ClientSubscriptionService } from '../services/client-subscription.service';
import { ClientService } from '../services/client.service'
import { ALLOWED_OAUTH_GRANTS } from '../shared/constants/app-constants';
import { NotAuthorizedError } from '../shared/errors/not-authorized-error';
import { generateRandom32bitHash, getActiveSubscription } from '../shared/functions/app-utils';

export class ClientController {
    public async createClient(request: Request, response: Response, next: NextFunction) {
        try {
            const { clientName, dbConnectionString, domain, isActive, subscriptionPlan, isTrialSubscription, subscriptionStartDate, subscriptionEndDate } = request.body;
            const currentLoggedInUserInfo = response.locals.oauth.token;
            const createClientRequest: OAuthClientData = {
                clientId: generateRandom32bitHash(),
                clientSecret: generateRandom32bitHash(),
                grants: ALLOWED_OAUTH_GRANTS,
                clientName,
                dbConnectionString,
                domain,
                isActive
            }

            const clientService: ClientService = new ClientService();
            let savedClient = await clientService.createClient(createClientRequest);
            if (subscriptionPlan) {
                const clientSubscriptionService: ClientSubscriptionService = new ClientSubscriptionService();
                const savedClientSubscription = await clientSubscriptionService.createClientSubscription({
                    clientId: savedClient.id,
                    plan: subscriptionPlan,
                    isTrial: isTrialSubscription,
                    startDate: subscriptionStartDate,
                    endDate: subscriptionEndDate,
                    createdBy: currentLoggedInUserInfo?.user?.id,
                    modifiedBy: currentLoggedInUserInfo?.user?.id
                });
                await clientSubscriptionService.attachClientSubscriptionToClient(savedClientSubscription, savedClient);
            }
            await buildClientCache();
            response.status(201).json(savedClient);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async updateClient(request: Request, response: Response, next: NextFunction) {
        try {
            const { id } = request.params;
            const { clientName, dbConnectionString, domain, isActive, natureOfBusiness, companyType, noOfShipments, majorModeOfShipment, cargoYouMoveMajorly, logo } = request.body;

            const clientService: ClientService = new ClientService();
            const savedClient = await clientService.updateClient(id, clientName, dbConnectionString, domain, isActive, natureOfBusiness, companyType, noOfShipments, majorModeOfShipment, cargoYouMoveMajorly, logo);
            await buildClientCache();
            response.status(200).json(savedClient);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async updateClientSubscription(request: Request, response: Response, next: NextFunction) {
        try {
            const { clientId } = request.params;
            const { plan, isTrial, startDate, endDate } = request.body;
            const currentLoggedInUserInfo = response.locals.oauth.token;

            const clientService: ClientService = new ClientService();
            const client = await clientService.getClientById(clientId);

            const clientSubscriptionService: ClientSubscriptionService = new ClientSubscriptionService();
            const savedClientSubscription = await clientSubscriptionService.createClientSubscription({
                clientId: client.id,
                plan,
                isTrial,
                startDate,
                endDate,
                createdBy: currentLoggedInUserInfo?.user?.id,
                modifiedBy: currentLoggedInUserInfo?.user?.id
            });
            await buildClientCache();
            response.status(201).json(savedClientSubscription);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async getClientById(request: Request, response: Response, next: NextFunction) {
        try {
            const { id } = request.params;
            const clientService: ClientService = new ClientService();
            const client = await clientService.getClientById(id);
            response.status(200).json(client);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }

    public async updateClientByLoggedInUser(request: Request, response: Response, next: NextFunction) {
        try {
            const currentLoggedInUserInfo = response.locals.oauth.token;
            const clientId = currentLoggedInUserInfo?.user?.client?.id;
            if (!clientId) {
                throw new NotAuthorizedError();
            }
            const { clientName, dbConnectionString, domain, isActive, natureOfBusiness, companyType, noOfShipments, majorModeOfShipment, cargoYouMoveMajorly, logo } = request.body;

            const clientService: ClientService = new ClientService();
            const savedClient = await clientService.updateClient(clientId, clientName, dbConnectionString, domain, isActive, natureOfBusiness, companyType, noOfShipments, majorModeOfShipment, cargoYouMoveMajorly, logo);
            await buildClientCache();
            response.status(200).json(savedClient);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }

    public async getClientByLoggedInUser(_request: Request, response: Response, next: NextFunction) {
        try {
            const currentLoggedInUserInfo = response.locals.oauth.token;
            const clientId = currentLoggedInUserInfo?.user?.client?.id;
            if (!clientId) {
                throw new NotAuthorizedError();
            }
            const clientService: ClientService = new ClientService();
            const client = await clientService.getClientById(clientId);
            if (!client) {
                throw new NotAuthorizedError();
            }
            response.status(200).json({
                clientName: client.clientName,
                domain: client.domain,
                isActive: client.isActive,
                subscription: client.subscription,
                natureOfBusiness: client.natureOfBusiness,
                companyType: client.companyType,
                noOfShipments: client.noOfShipments,
                majorModeOfShipment: client.majorModeOfShipment,
                cargoYouMoveMajorly: client.cargoYouMoveMajorly,
                logo: client.logo
            });
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async getClientList(request: Request, response: Response, next: NextFunction) {
        try {
            const pageNumber = request.query.pageNumber ? Number(request.query.pageNumber) : 0;
            const limit = request.query.pageSize ? Number(request.query.pageSize) : 10;

            const skip = pageNumber * limit;
            const clientService: ClientService = new ClientService();
            const data = await clientService.getClientList(skip, limit);
            const total = await clientService.getClientCount();
            response.status(200).json({
                data,
                total,
                pageNumber,
                pageSize: limit
            });
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }

    public async getClientSubscriptionsByClientId(request: Request, response: Response, next: NextFunction) {
        try {
            const { clientId } = request.params;
            const clientSubscriptionService: ClientSubscriptionService = new ClientSubscriptionService();
            const clientSubscriptions = await clientSubscriptionService.getClientSubscriptionsByClientId(clientId);
            response.status(200).json({
                data: clientSubscriptions
            });
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }

    public async deleteClientById(request: Request, response: Response, next: NextFunction) {
        try {
            const { id } = request.params;
            const clientService: ClientService = new ClientService();
            const client = await clientService.deleteClientById(id);
            await buildClientCache();
            response.status(200).json(client);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
}