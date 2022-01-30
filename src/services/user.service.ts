import mongoose from "mongoose";
import { OAuthUser } from "../models/oauth-user.model";
import { BadRequestError } from "../shared/errors/bad-request-error";
import { NotFoundError } from "../shared/errors/not-found-error";
import { PasswordService } from "./password.service";

export class UserService {
    public async createUser(request: any) {
        const user = new OAuthUser(request);
        return await user.save();
    }
    public async updateUser(id: Object, email: string, firstName: string, lastName: string, client: object, role: string, isActive: boolean, modifiedBy: any) {
        const user = await OAuthUser.findByIdAndUpdate(id, { email, firstName, lastName, client, role, isActive, modifiedBy }, { new: true });
        if (!user) throw new NotFoundError();
        return user;
    }
    public async getUserById(id: Object) {
        const user = await OAuthUser.findById(id);
        if (!user) throw new NotFoundError();
        return user;
    }
    public async getUserByIdNoErrorHandling(id: Object) {
        const user = await OAuthUser.findById(id).populate('client');
        return user;
    }
    public async getUserByEmailId(email: string, customErrorHandling: boolean) {
        const user = await OAuthUser.findOne({ email });
        if (!user && !customErrorHandling) throw new NotFoundError();
        return user;
    }
    public async getUserList(skip: number, limit: number, clientId: any) {
        let filter = {};
        if (clientId) {
            filter = { client: clientId };
        }
        const users = await OAuthUser.find(filter).sort({ _id: -1 }).skip(skip).limit(limit).populate('client');
        return users;
    }
    public async getUserListByUserIds(userIds: string[], clientId: any) {
        let filter: any = { _id: { $in: userIds.map(u => new mongoose.Types.ObjectId(u)) } };
        if (clientId) {
            filter = { ...filter, client: clientId };
        }
        const users = await OAuthUser.find(filter);
        return users;
    }
    public async getUserCount(clientId: any) {
        let filter = {};
        if (clientId) {
            filter = { client: clientId };
        }
        const count = await OAuthUser.countDocuments(filter);
        return count;
    }
    public async getUserCountByRole(clientId: any, role: string) {
        let filter = {};
        if (clientId) {
            filter = { client: clientId, role };
        }
        const count = await OAuthUser.countDocuments(filter);
        return count;
    }
    public async deleteUserById(id: Object) {
        const user = await OAuthUser.findByIdAndDelete(id);
        if (!user) throw new NotFoundError();
        return user;
    }
    public async updatePasswordByUserId(id: Object, password: string) {
        const passwordHash = await PasswordService.toHash(password);
        const user = await OAuthUser.findByIdAndUpdate(id, { password: passwordHash }, { new: true });
        return user;
    }
    public async changePassword(userId: string, currentPassword: string, password: string) {
        const user = await OAuthUser.findById(userId);
        const isValidUserCredentials = user?.comparePassword(currentPassword);
        if (!user || !isValidUserCredentials) {
            throw new BadRequestError("Incorrect current password.");
        }
        user.password = password;
        return await user.save();
    }
}