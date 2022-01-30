import * as mongoose from 'mongoose';
import { Audit } from '../interfaces/audit.interface';
import { SUBSCRIPTIONS, ALL_SUBSCRIPTION_PLANS } from '../shared/constants/app-constants';
const Schema = mongoose.Schema;

export interface ClientSubscriptionData extends Audit {
    clientId: Object;
    plan?: string;
    isTrial?: boolean;
    startDate?: Date;
    endDate?: Date;
}

export interface ClientSubscriptionModel extends mongoose.Model<ClientSubscriptionDocument> {
}

export interface ClientSubscriptionDocument extends mongoose.Document, ClientSubscriptionData {
}

export const clientSubscriptionSchema = new Schema({
    clientId: { type: Schema.Types.ObjectId, required: true },
    plan: { type: String, required: true, enum: ALL_SUBSCRIPTION_PLANS, default: SUBSCRIPTIONS.NONE },
    isTrial: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    createdOn: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'OAuthUsers', required: true },
    modifiedOn: { type: Date, default: Date.now },
    modifiedBy: { type: Schema.Types.ObjectId, ref: 'OAuthUsers', required: true },
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

export const ClientSubscription = mongoose.model<ClientSubscriptionDocument, ClientSubscriptionModel>('SubscriptionPlans', clientSubscriptionSchema);
