import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export interface OAuthClientData {
    id?: any;
    clientId: string;
    clientName: string;
    clientSecret: string;
    redirectUris?: string[];
    grants: string[];
    dbConnectionString: string;
    domain: string;
    isActive?: boolean;
    subscription?: any;
    natureOfBusiness?: string;
    companyType?: string;
    noOfShipments?: string;
    majorModeOfShipment?: string;
    cargoYouMoveMajorly?: string;
    logo?: string;
}

export interface OAuthClientModel extends mongoose.Model<OAuthClientDocument> {
}

export interface OAuthClientDocument extends mongoose.Document, OAuthClientData {
}

export const oAuthClientSchema = new Schema({
    clientId: { type: String, required: true },
    clientName: { type: String, required: true },
    clientSecret: { type: String, required: true },
    redirectUris: { type: Array },
    grants: [String],
    dbConnectionString: { type: String, required: true },
    domain: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    subscription: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlans' },
    natureOfBusiness: { type: String },
    companyType: { type: String },
    noOfShipments: { type: String },
    majorModeOfShipment: { type: String },
    cargoYouMoveMajorly: { type: String },
    logo: { type: String },
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

export const OAuthClient = mongoose.model<OAuthClientDocument, OAuthClientModel>('OAuthClients', oAuthClientSchema);
