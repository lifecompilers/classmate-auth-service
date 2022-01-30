import { NextFunction, Request, Response } from 'express'
import JWT from 'jsonwebtoken';
import { ClientPortalService } from '../services/client-portal.service';
import { EmailService } from '../services/email.service';
import { UserService } from '../services/user.service';
import { EMAIL_TEMPLATES, ROLES } from '../shared/constants/app-constants';
import { BASE_URL, DEFAULT_USER_PASSWORD, JWT_ISSUER, JWT_SECRET_FOR_PASSWORD_RESET_TOKEN } from '../shared/constants/env-constants';
import { BadRequestError } from '../shared/errors/bad-request-error';
import { InternalServerError } from '../shared/errors/InternalServerError';
import { NotAuthorizedError } from '../shared/errors/not-authorized-error';
const es6Renderer = require('express-es6-template-engine');

export class UserController {
    public async createUser(request: Request, response: Response, next: NextFunction) {
        try {
            const { email, firstName, lastName, password, client, role, isActive } = request.body;
            const currentLoggedInUserInfo = response.locals.oauth.token;
            const userService: UserService = new UserService();
            const authResponseData = await userService.createUser({
                email,
                firstName: role === ROLES.SUPERADMIN ? firstName : '',
                lastName: role === ROLES.SUPERADMIN ? lastName : '',
                password,
                client,
                role,
                isActive,
                createdBy: currentLoggedInUserInfo?.user?.id,
                modifiedBy: currentLoggedInUserInfo?.user?.id
            });
            const authUserData = authResponseData.toJSON();
            let clientUserData: any = {};
            if (role !== ROLES.SUPERADMIN) {
                const clientPortalService: ClientPortalService = new ClientPortalService();
                const clientResponseData: any = await clientPortalService.createUserInClientDatabase(currentLoggedInUserInfo.accessToken, client, authUserData.id, firstName, lastName, role);
                clientUserData = clientResponseData.data.data;
                if (!clientUserData || clientUserData.rowCount !== 1) {
                    throw new InternalServerError("Error while creating user.");
                    // TODO: Need more time to implement cross service call failure transaction if needed
                }
            }
            const isMailSent = await this.sendAccountInitializationMail(authUserData.id);
            if (isMailSent) {
                response.status(201).json({
                    ...authUserData,
                    ...clientUserData
                });
            } else {
                throw new InternalServerError("User created but we are having issues while sending account creation e-mail to user.")
            }
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async createUserFromClientsPortal(request: Request, response: Response, next: NextFunction) {
        try {
            const { email, isActive } = request.body;
            const currentLoggedInUserInfo = response.locals.oauth.token;
            const clientId = currentLoggedInUserInfo?.user?.client?.id;

            if (!clientId) {
                throw new NotAuthorizedError();
            }

            const userService: UserService = new UserService();
            const responseData = await userService.createUser({
                email,
                firstName: '',
                lastName: '',
                password: DEFAULT_USER_PASSWORD,
                client: clientId,
                role: ROLES.USER,
                isActive,
                createdBy: currentLoggedInUserInfo?.user?.id,
                modifiedBy: currentLoggedInUserInfo?.user?.id
            });
            response.status(201).json(responseData);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }

    sendAccountInitializationMail = async (userId: string) => {
        const userService: UserService = new UserService();
        const user = await userService.getUserByIdNoErrorHandling(userId);
        if (!user) {
            throw new BadRequestError("We do not have user with given userId.");
        }
        const clientName = user.client.clientName;
        const secret: JWT.Secret = String(JWT_SECRET_FOR_PASSWORD_RESET_TOKEN);
        const options: JWT.SignOptions = {
            algorithm: 'HS256',
            issuer: JWT_ISSUER,
            audience: BASE_URL
        }
        const token = JWT.sign({ userId }, secret, options);
        const newUserAccountLink = `${BASE_URL}/new-user-account/${token}`;
        const precompiled = es6Renderer(EMAIL_TEMPLATES.NEW_USER_ACCOUNT, 'userName, clientName, newUserAccountLink');
        const mailBody = precompiled(`${user.firstName} ${user.lastName}`, clientName, newUserAccountLink);
        const emailService: EmailService = new EmailService();
        const isMailSent = await emailService.sendMail(user.email, "Kuulie | New User Account", mailBody, "");
        return isMailSent;
    }

    public async sendUserAccountInitializationMail(request: Request, response: Response, next: NextFunction) {
        try {
            const { userId } = request.body;
            const isMailSent = await this.sendAccountInitializationMail(userId);
            if (isMailSent) {
                response.status(200).json({
                    success: true,
                    message: "Successfully sent account creation e-mail to user."
                });
            } else {
                throw new InternalServerError("We are having issues while sending account creation e-mail to user.")
            }
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }

    public async updateUser(request: Request, response: Response, next: NextFunction) {
        try {
            const { id } = request.params;
            const { email, firstName, lastName, client, role, isActive } = request.body;
            const currentLoggedInUserInfo = response.locals.oauth.token;

            const userService: UserService = new UserService();
            const authResponseData = await userService.updateUser(
                id,
                email,
                role === ROLES.SUPERADMIN ? firstName : '',
                role === ROLES.SUPERADMIN ? lastName : '',
                client,
                role,
                isActive,
                currentLoggedInUserInfo?.user?.id
            );
            const authUserData = authResponseData.toJSON();

            let clientUserData: any = {};
            if (role !== ROLES.SUPERADMIN) {
                const clientPortalService: ClientPortalService = new ClientPortalService();
                const clientResponseData: any = await clientPortalService.updateUserInClientDatabase(currentLoggedInUserInfo.accessToken, client, authUserData.id, firstName, lastName, role);
                clientUserData = clientResponseData.data.data;
                if (!clientUserData || clientUserData.rowCount !== 1) {
                    throw new InternalServerError("Error while updating user.");
                    // TODO: Need more time to implement cross service call failure transaction if needed
                }
            }
            response.status(200).json({
                ...authUserData,
                ...clientUserData
            });
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async getUserById(request: Request, response: Response, next: NextFunction) {
        try {
            const { id } = request.params;
            const userService: UserService = new UserService();
            const user = await userService.getUserById(id);
            response.status(200).json(user);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async getUserListByUserIdsFromClientPortal(request: Request, response: Response, next: NextFunction) {
        try {
            const loggedInUserInfo = response.locals.oauth.token;
            const commaSeparatedUserIds: any = request.headers['userids'] || "";
            const userIds = commaSeparatedUserIds ? commaSeparatedUserIds.split(",") : [];
            const userService: UserService = new UserService();
            const data: any = await userService.getUserListByUserIds(userIds, loggedInUserInfo.user.client.id);
            const users = data.map((user: any) => {
                return user.toJSON();
            });
            response.status(200).json(users);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async getUserList(request: Request, response: Response, next: NextFunction) {
        try {
            const accessToken = response.locals.oauth.token.accessToken;
            const { clientId } = request.params;
            const pageNumber = request.query.pageNumber ? Number(request.query.pageNumber) : 0;
            const limit = request.query.pageSize ? Number(request.query.pageSize) : 10;

            const skip = pageNumber * limit;
            const userService: UserService = new UserService();
            let data: any = await userService.getUserList(skip, limit, clientId);

            const authUserIds = (data || []).map((u: any) => u._id.toString());

            const clientPortalService: ClientPortalService = new ClientPortalService();
            const clientPortalServiceResponse: any = await clientPortalService.getUsersByClientIdAuthUserIds(accessToken, clientId, authUserIds);
            const userDataFromClientPortalService: any[] = clientPortalServiceResponse?.data?.data || [];
            data = data.map((user: any) => {
                if (user.role === ROLES.SUPERADMIN) {
                    return user.toJSON();
                }
                const userData = userDataFromClientPortalService.find((u: any) => u.auth_user_id === user._id.toString());
                return {
                    ...user.toJSON(),
                    firstName: userData?.first_name || 'Unknown',
                    lastName: userData?.last_name || 'Unknown'
                }
            });

            const total = await userService.getUserCount(clientId);
            const totalUsers = await userService.getUserCountByRole(clientId, ROLES.USER);
            const totalAdmins = await userService.getUserCountByRole(clientId, ROLES.ADMIN);
            response.status(200).json({
                totalUsers,
                totalAdmins,
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
    public async deleteUserById(request: Request, response: Response, next: NextFunction) {
        try {
            const { id } = request.params;
            const userService: UserService = new UserService();
            const user = await userService.deleteUserById(id);
            response.status(200).json(user);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
}