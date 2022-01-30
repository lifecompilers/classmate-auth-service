import { NextFunction, Response } from 'express'
import JWT from 'jsonwebtoken';
import { RequestExtended } from '../interfaces/express-extended.interface';
import { ClientPortalService } from '../services/client-portal.service';
import { EmailService } from '../services/email.service';
import { UserService } from '../services/user.service';
import { EMAIL_TEMPLATES, OAUTH_GRANTS, ROLES } from '../shared/constants/app-constants';
import { BASE_URL, JWT_ISSUER, JWT_PASSWORD_RESET_TOKEN_EXPIRY_SECONDS, JWT_SECRET_FOR_PASSWORD_RESET_TOKEN } from '../shared/constants/env-constants';
import { BadRequestError } from '../shared/errors/bad-request-error';
import { NotAuthorizedError } from '../shared/errors/not-authorized-error';
const es6Renderer = require('express-es6-template-engine');

export class AuthController {
    public async tokenSignIn(request: RequestExtended, response: Response, next: NextFunction) {
        try {
            request.body.grant_type = OAUTH_GRANTS.PASSWORD;
            const responseData = await request.app.oauth?.token()(request, response, next);
            response.status(200).json(responseData);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async tokenRefresh(request: RequestExtended, response: Response, next: NextFunction) {
        try {
            request.body.grant_type = OAUTH_GRANTS.REFRESH_TOKEN;
            const responseData = await request.app.oauth?.token()(request, response, next);
            response.status(200).json(responseData);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async authorizationCodeSignIn(request: RequestExtended, response: Response, next: NextFunction) {
        try {
            request.body.grant_type = OAUTH_GRANTS.AUTHORIZATION_CODE;
            const responseData = await request.app.oauth?.token()(request, response, next);
            response.status(200).json(responseData);
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async currentUser(request: RequestExtended, response: Response, next: NextFunction) {
        try {
            const decodedToken: any = await request.app.oauth?.authenticate()(request, response, () => { });
            if (!decodedToken || !decodedToken.user.id) {
                throw new NotAuthorizedError();
            }
            const userService: UserService = new UserService();
            const authUserData: any = (await userService.getUserByIdNoErrorHandling(decodedToken.user.id))?.toJSON();
            if (!authUserData) {
                throw new NotAuthorizedError();
            }
            let clientUserData: any = {};
            if (decodedToken.user.role !== ROLES.SUPERADMIN) {
                const clientPortalService: ClientPortalService = new ClientPortalService();
                const clientPortalServiceResponse: any = await clientPortalService.getUsersByClientIdAuthUserIds(decodedToken.accessToken, decodedToken.user.client.id, [decodedToken.user.id]);
                const userDataFromClientPortalService: any[] = clientPortalServiceResponse?.data?.data || [];
                const { first_name, last_name } = userDataFromClientPortalService.length === 1 ? userDataFromClientPortalService[0] : { first_name: null, last_name: null };
                clientUserData = {
                    firstName: first_name,
                    lastName: last_name
                }
            }
            response.status(200).json({
                ...authUserData, ...clientUserData, client: {
                    id: authUserData.client.id,
                    clientName: authUserData.client.clientName,
                    domain: authUserData.client.domain,
                    isActive: authUserData.client.isActive
                }
            });
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async changePassword(request: RequestExtended, response: Response, next: NextFunction) {
        try {
            const currentLoggedInUserInfo: any = await request.app.oauth?.authenticate()(request, response, () => { });

            const { currentPassword, password, repassword } = request.body;

            if (password !== repassword) {
                throw new BadRequestError("Password and repassword should be same.");
            }
            const userId = currentLoggedInUserInfo.user.id;

            const userService: UserService = new UserService();
            await userService.changePassword(userId, currentPassword, password);
            response.status(200).send();
        } catch (ex) {
            console.log(ex);
            next(ex);
        }
    }
    public async resetPassword(request: RequestExtended, response: Response, next: NextFunction) {
        try {
            const { emailId } = request.body;
            const userService: UserService = new UserService();
            const emailService: EmailService = new EmailService();
            const user = await userService.getUserByEmailId(emailId, true);
            if (!user) {
                response.render('reset-password', {
                    locals: {
                        errorMessage: `We do not have any user with email address ${emailId}.`,
                        successMessage: ''
                    }
                });
            } else {

                const secret: JWT.Secret = String(JWT_SECRET_FOR_PASSWORD_RESET_TOKEN);
                const options: JWT.SignOptions = {
                    algorithm: 'HS256',
                    expiresIn: JWT_PASSWORD_RESET_TOKEN_EXPIRY_SECONDS,
                    issuer: JWT_ISSUER,
                    audience: BASE_URL
                }
                const token = JWT.sign({ userId: user._id }, secret, options);
                const passwordResetLink = `${BASE_URL}/reset-password/${token}`;
                const precompiled = es6Renderer(EMAIL_TEMPLATES.RESET_PASSWORD, 'userName, linkExpiryTime, passwordResetLink');
                const mailBody = precompiled(`${user.firstName} ${user.lastName}`, '1 hour', passwordResetLink);

                const isMailedSent = await emailService.sendMail(emailId, "Kuulie | Password Reset", mailBody, "");
                if (isMailedSent) {
                    response.render('reset-password', {
                        locals: {
                            successMessage: 'Check your email inbox and open the link we sent to continue.',
                            errorMessage: ''
                        }
                    });
                } else {
                    response.render('reset-password', {
                        locals: {
                            errorMessage: 'Error while mailing password reset link, try again later.',
                            successMessage: ''
                        }
                    });
                }
            }
        } catch (ex) {
            console.log(ex);
            response.render('reset-password', {
                locals: {
                    errorMessage: 'Error while mailing password reset link, try again later.',
                    successMessage: ''
                }
            });
        }
    }
    public async renderResetPasswordLink(request: RequestExtended, response: Response, next: NextFunction) {
        try {
            const { code } = request.params;
            if (!code) {
                response.render('reset-password-do', {
                    locals: {
                        passwordResetSuccessMessage: '',
                        linkErrorMessage: 'Invalid password reset link.',
                        errorMessage: '',
                        successMessage: '',
                        formAction: ''
                    }
                });
            } else {
                const secret: JWT.Secret = String(JWT_SECRET_FOR_PASSWORD_RESET_TOKEN);
                const options: JWT.VerifyOptions = {
                    algorithms: ['HS256'],
                    issuer: JWT_ISSUER,
                    audience: BASE_URL
                }
                JWT.verify(code, secret, options, function (err: any, decoded: any) {
                    if (err || !decoded || !decoded.userId) {
                        console.log('Reset Password - Verify Code - ', err);
                        const linkErrorMessage = err?.message === 'jwt expired' ? 'Password reset link has been expired.' : 'Invalid password reset link.';
                        response.render('reset-password-do', {
                            locals: {
                                passwordResetSuccessMessage: '',
                                linkErrorMessage,
                                errorMessage: '',
                                successMessage: '',
                                formAction: ''
                            }
                        });
                    } else {
                        response.render('reset-password-do', {
                            locals: {
                                passwordResetSuccessMessage: '',
                                linkErrorMessage: '',
                                errorMessage: '',
                                successMessage: '',
                                formAction: `/reset-password/${code}`,
                            }
                        });
                    }
                });
            }
        } catch (ex) {
            console.log(ex);
            response.render('reset-password-do', {
                locals: {
                    passwordResetSuccessMessage: '',
                    linkErrorMessage: 'Error while opening password reset link, try again later.',
                    errorMessage: '',
                    successMessage: '',
                    formAction: ''
                }
            });
        }
    }

    public async performResetPassword(request: RequestExtended, response: Response, next: NextFunction) {
        const { password, repassword } = request.body;
        const { code } = request.params;
        try {
            if (password !== repassword) {
                response.render('reset-password-do', {
                    locals: {
                        passwordResetSuccessMessage: '',
                        linkErrorMessage: '',
                        errorMessage: 'Both passwords are not matching, try again.',
                        successMessage: '',
                        formAction: `/reset-password/${code}`,
                    }
                });
            } else {
                const secret: JWT.Secret = String(JWT_SECRET_FOR_PASSWORD_RESET_TOKEN);
                const options: JWT.VerifyOptions = {
                    algorithms: ['HS256'],
                    issuer: JWT_ISSUER,
                    audience: BASE_URL
                }
                JWT.verify(code, secret, options, async function (err: any, decoded: any) {
                    if (err || !decoded || !decoded.userId) {
                        console.log('PerformResetPassword - ', err);
                        const linkErrorMessage = err?.message === 'jwt expired' ? 'Password reset link has been expired.' : 'Invalid password reset link.';
                        response.render('reset-password-do', {
                            locals: {
                                passwordResetSuccessMessage: '',
                                linkErrorMessage,
                                errorMessage: '',
                                successMessage: '',
                                formAction: ''
                            }
                        });
                    } else {
                        const userService: UserService = new UserService();
                        const user = await userService.updatePasswordByUserId(decoded.userId, password);
                        if (user) {
                            response.render('reset-password-do', {
                                locals: {
                                    passwordResetSuccessMessage: 'Your password has been changed successfully.',
                                    linkErrorMessage: '',
                                    errorMessage: '',
                                    successMessage: '',
                                    formAction: ``,
                                }
                            });
                        } else {
                            response.render('reset-password-do', {
                                locals: {
                                    passwordResetSuccessMessage: '',
                                    linkErrorMessage: '',
                                    errorMessage: 'Error while changing password, try again later.',
                                    successMessage: '',
                                    formAction: `/reset-password/${code}`,
                                }
                            });
                        }
                    }
                });
            }
        } catch (ex) {
            console.log(ex);
            response.render('reset-password-do', {
                locals: {
                    passwordResetSuccessMessage: '',
                    linkErrorMessage: '',
                    errorMessage: 'Error while changing password, try again later.',
                    successMessage: '',
                    formAction: `/reset-password/${code}`,
                }
            });
        }
    }

    public async renderNewUserAccountLink(request: RequestExtended, response: Response, next: NextFunction) {
        try {
            const { code } = request.params;
            if (!code) {
                response.render('new-user-account-do', {
                    locals: {
                        newUserAccountSuccessMessage: '',
                        linkErrorMessage: 'Invalid new user account setup link.',
                        errorMessage: '',
                        successMessage: '',
                        formAction: ''
                    }
                });
            } else {
                const secret: JWT.Secret = String(JWT_SECRET_FOR_PASSWORD_RESET_TOKEN);
                const options: JWT.VerifyOptions = {
                    algorithms: ['HS256'],
                    issuer: JWT_ISSUER,
                    audience: BASE_URL
                }
                JWT.verify(code, secret, options, function (err: any, decoded: any) {
                    if (err || !decoded || !decoded.userId) {
                        const linkErrorMessage = err?.message === 'jwt expired' ? 'New user account setup link has been expired.' : 'Invalid new user account setup link.';
                        response.render('new-user-account-do', {
                            locals: {
                                newUserAccountSuccessMessage: '',
                                linkErrorMessage,
                                errorMessage: '',
                                successMessage: '',
                                formAction: ''
                            }
                        });
                    } else {
                        response.render('new-user-account-do', {
                            locals: {
                                newUserAccountSuccessMessage: '',
                                linkErrorMessage: '',
                                errorMessage: '',
                                successMessage: '',
                                formAction: `/new-user-account/${code}`,
                            }
                        });
                    }
                });
            }
        } catch (ex) {
            console.log(ex);
            response.render('new-user-account-do', {
                locals: {
                    newUserAccountSuccessMessage: '',
                    linkErrorMessage: 'Error while opening new user account setup link, try again later.',
                    errorMessage: '',
                    successMessage: '',
                    formAction: ''
                }
            });
        }
    }

    public async performNewUserAccountSetup(request: RequestExtended, response: Response, next: NextFunction) {
        const { password, repassword } = request.body;
        const { code } = request.params;
        try {
            if (password !== repassword) {
                response.render('new-user-account-do', {
                    locals: {
                        newUserAccountSuccessMessage: '',
                        linkErrorMessage: '',
                        errorMessage: 'Both passwords are not matching, try again.',
                        successMessage: '',
                        formAction: `/new-user-account/${code}`,
                    }
                });
            } else {
                const secret: JWT.Secret = String(JWT_SECRET_FOR_PASSWORD_RESET_TOKEN);
                const options: JWT.VerifyOptions = {
                    algorithms: ['HS256'],
                    issuer: JWT_ISSUER,
                    audience: BASE_URL
                }
                JWT.verify(code, secret, options, async function (err: any, decoded: any) {
                    if (err || !decoded || !decoded.userId) {
                        const linkErrorMessage = err?.message === 'jwt expired' ? 'New user account setup link has been expired.' : 'Invalid new user account setup link.';
                        response.render('new-user-account-do', {
                            locals: {
                                newUserAccountSuccessMessage: '',
                                linkErrorMessage,
                                errorMessage: '',
                                successMessage: '',
                                formAction: ''
                            }
                        });
                    } else {
                        const userService: UserService = new UserService();
                        const user = await userService.updatePasswordByUserId(decoded.userId, password);
                        if (user) {
                            response.render('new-user-account-do', {
                                locals: {
                                    newUserAccountSuccessMessage: 'Your password has been set successfully.',
                                    linkErrorMessage: '',
                                    errorMessage: '',
                                    successMessage: '',
                                    formAction: ``,
                                }
                            });
                        } else {
                            response.render('new-user-account-do', {
                                locals: {
                                    newUserAccountSuccessMessage: '',
                                    linkErrorMessage: '',
                                    errorMessage: 'Error while setting your password, try again later.',
                                    successMessage: '',
                                    formAction: `/new-user-account/${code}`,
                                }
                            });
                        }
                    }
                });
            }
        } catch (ex) {
            console.log(ex);
            response.render('new-user-account-do', {
                locals: {
                    newUserAccountSuccessMessage: '',
                    linkErrorMessage: '',
                    errorMessage: 'Error while setting your password, try again later.',
                    successMessage: '',
                    formAction: `/new-user-account/${code}`,
                }
            });
        }
    }
}