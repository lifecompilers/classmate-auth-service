import { OAuthClient, OAuthClientData, OAuthClientDocument } from '../models/oauth-client.model';
import { NotFoundError } from '../shared/errors/not-found-error';
import { getActiveSubscription, getToday, isDateWithinInterval } from '../shared/functions/app-utils';
import { ClientSubscriptionService } from './client-subscription.service';
import { ClientSubscription } from '../models/client-subscriptions.model';

const getClientWithActiveSubscription = async (client: OAuthClientDocument) => {
    const activeSubscription = client.subscription;
    if (!activeSubscription || !activeSubscription.startDate || !activeSubscription.endDate || !isDateWithinInterval(getToday(), activeSubscription.startDate, activeSubscription.endDate)) {
        const clientSubscriptionService: ClientSubscriptionService = new ClientSubscriptionService();
        const clientSubscriptions = await clientSubscriptionService.getClientSubscriptionsByClientId(client.id);
        const activeSubscription = getActiveSubscription(clientSubscriptions);
        const activeSubscriptionDocument = activeSubscription ? new ClientSubscription(activeSubscription) : null;
        client.subscription = activeSubscriptionDocument;
        client = await client.save();
    }
    return client;
}

export class ClientService {
    public async createClient(request: OAuthClientData) {
        const clientData = new OAuthClient(request);
        let client: any = await clientData.save();

        client = await getClientWithActiveSubscription(client);
        return client;
    }
    public async getClientList(skip: number, limit: number) {
        let clientList: any = await OAuthClient.find().sort({ _id: -1 }).skip(skip).limit(limit).populate('subscription');
        const clientListPromiseArray = clientList.map(async (client: OAuthClientDocument) => {
            return await getClientWithActiveSubscription(client);
        });
        clientList = await Promise.all(clientListPromiseArray);
        return clientList;
    }
    public async getAllClientList() {
        let clientList: any = await OAuthClient.find().sort({ _id: -1 }).populate('subscription');
        const clientListPromiseArray = clientList.map(async (client: OAuthClientDocument) => {
            return await getClientWithActiveSubscription(client);
        });
        clientList = await Promise.all(clientListPromiseArray);
        return clientList;
    }
    public async getClientCount() {
        const count = await OAuthClient.countDocuments();
        return count;
    }
    public async getClientById(id: Object) {
        let client: any = await OAuthClient.findById(id).populate('subscription');
        if (!client) throw new NotFoundError();
        client = await getClientWithActiveSubscription(client);
        return client;
    }
    public async deleteClientById(id: Object) {
        const client = await OAuthClient.findByIdAndDelete(id);
        if (!client) throw new NotFoundError();
        return client;
    }
    public async updateClient(id: Object, clientName: string, dbConnectionString: string, domain: string, isActive: boolean, natureOfBusiness: string, companyType: string, noOfShipments: string, majorModeOfShipment: string, cargoYouMoveMajorly: string, logo: string) {
        const client = await OAuthClient.findByIdAndUpdate(id, { clientName, dbConnectionString, domain, isActive, natureOfBusiness, companyType, noOfShipments, majorModeOfShipment, cargoYouMoveMajorly, logo }, { new: true });
        return client;
    }
}