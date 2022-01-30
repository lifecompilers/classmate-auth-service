import * as mongoose from 'mongoose';
import { Audit } from '../interfaces/audit.interface';
import { ROLES } from '../shared/constants/app-constants';
import { PasswordService } from '../services/password.service';

const Schema = mongoose.Schema;

export interface OAuthUserData extends Audit {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    client: any;
    role: string;
    isActive: boolean;
}

export interface OAuthUserModel extends mongoose.Model<OAuthUserDocument> {
}

export interface OAuthUserDocument extends mongoose.Document, OAuthUserData {
    comparePassword(password: string): Promise<boolean>;
}

export const oAuthUserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    password: { type: String, required: true },
    client: { type: Schema.Types.ObjectId, ref: 'OAuthClients', required: true },
    role: { type: String, enum: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.USER], default: ROLES.USER },
    isActive: { type: Boolean },
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
            delete ret.password;
        }
    }
});

oAuthUserSchema.pre('save', async function (done) {
    if (this.isModified('password')) {
        const hashed = await PasswordService.toHash(this.get('password'));
        this.set('password', hashed);
    }
    done();
});

oAuthUserSchema.methods.comparePassword = async function (password: string) {
    return await PasswordService.compare(this.get('password'), password)
}

export const OAuthUser = mongoose.model<OAuthUserDocument, OAuthUserModel>('OAuthUsers', oAuthUserSchema);
