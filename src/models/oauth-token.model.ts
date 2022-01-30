import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

export interface OAuthTokenData {
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    client: Object;
    clientId: string;
    user: Object;
    userId: string;
}

export interface OAuthTokenModel extends mongoose.Model<OAuthTokenDocument> {
}

export interface OAuthTokenDocument extends mongoose.Document, OAuthTokenData {
}

export const oAuthTokenSchema = new Schema({
    accessToken: { type: String },
    accessTokenExpiresAt: { type: Date },
    client: { type: Object },  // `client` and `user` are required in multiple places, for example `getAccessToken()`
    clientId: { type: String },
    refreshToken: { type: String },
    refreshTokenExpiresAt: { type: Date },
    user: { type: Object },
    userId: { type: String }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

export const OAuthToken = mongoose.model<OAuthTokenDocument, OAuthTokenModel>('OAuthTokens', oAuthTokenSchema);
