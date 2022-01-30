import fs from 'fs';

require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

export const SUBSCRIPTIONS = {
    NONE: 'NONE',
    BASIC: 'BASIC',
    PRO: 'PRO'
}
export const ALL_SUBSCRIPTION_PLANS = [SUBSCRIPTIONS.NONE, SUBSCRIPTIONS.BASIC, SUBSCRIPTIONS.PRO];

export const OAUTH_GRANTS = {
    PASSWORD: 'password',
    REFRESH_TOKEN: 'refresh_token',
    AUTHORIZATION_CODE: 'authorization_code'
}
export const ALLOWED_OAUTH_GRANTS = [
    OAUTH_GRANTS.PASSWORD,
    OAUTH_GRANTS.REFRESH_TOKEN,
    OAUTH_GRANTS.AUTHORIZATION_CODE
]
export const ROLES = {
    SUPERADMIN: 'SUPERADMIN',
    ADMIN: 'ADMIN',
    USER: 'USER'
}
export const EMAIL_TEMPLATES = {
    RESET_PASSWORD: require('../email-templates/reset-password.html'),
    NEW_USER_ACCOUNT: require('../email-templates/new-user-account.html'),
}