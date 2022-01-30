import { ClientSubscription, ClientSubscriptionData, ClientSubscriptionDocument } from '../models/client-subscriptions.model';
import { OAuthClientDocument } from '../models/oauth-client.model';

export class ClientSubscriptionService {
    public async createClientSubscription(request: ClientSubscriptionData) {
        const clientSubscription = new ClientSubscription(request);
        return await clientSubscription.save();
    }
    public async attachClientSubscriptionToClient(clientSubscription: ClientSubscriptionDocument, client: OAuthClientDocument) {
        client.subscription = clientSubscription;
        return await client.save();
    }
    public async updateClientSubscription(savedClient: OAuthClientDocument, subscriptionPlan: string, isTrialSubscription: boolean, subscriptionStartDate: Date, subscriptionEndDate: Date) {
        const savedClientSubscription: ClientSubscriptionDocument = savedClient.subscription;
        if (savedClientSubscription.plan !== subscriptionPlan
            || savedClientSubscription.isTrial !== isTrialSubscription
            || savedClientSubscription.startDate !== subscriptionStartDate
            || savedClientSubscription.endDate !== subscriptionEndDate) {
            const clientSubscription = new ClientSubscription({
                clientId: savedClient.id,
                plan: subscriptionPlan,
                isTrial: isTrialSubscription,
                startDate: subscriptionStartDate,
                endDate: subscriptionEndDate
            });
            const newClientSubscription = await clientSubscription.save();
            savedClient.subscription = newClientSubscription;
            return await savedClient.save();
        }
        return savedClient;
    }

    public async getClientSubscriptionsByClientId(clientId: string) {
        const clientSubscriptions = await ClientSubscription.find({ clientId }).sort({ createdOn: -1 });
        return clientSubscriptions;
    }
}