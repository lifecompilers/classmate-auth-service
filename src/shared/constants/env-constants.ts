export const JWT_ACCESS_TOKEN_EXPIRY_SECONDS = Number(process.env.JWT_ACCESS_TOKEN_EXPIRY_SECONDS);
export const JWT_REFRESH_TOKEN_EXPIRY_SECONDS = Number(process.env.JWT_REFRESH_TOKEN_EXPIRY_SECONDS);
export const JWT_AUTHORIZATION_TOKEN_EXPIRY_SECONDS = Number(process.env.JWT_AUTHORIZATION_TOKEN_EXPIRY_SECONDS);
export const JWT_PASSWORD_RESET_TOKEN_EXPIRY_SECONDS = Number(process.env.JWT_PASSWORD_RESET_TOKEN_EXPIRY_SECONDS || 3600);
export const JWT_ISSUER = process.env.JWT_ISSUER;
export const JWT_SECRET_FOR_ACCESS_TOKEN = process.env.JWT_SECRET_FOR_ACCESS_TOKEN;
export const JWT_SECRET_FOR_REFRESH_TOKEN = process.env.JWT_SECRET_FOR_REFRESH_TOKEN;
export const JWT_SECRET_FOR_AUTHORIZATION_TOKEN = process.env.JWT_SECRET_FOR_AUTHORIZATION_TOKEN;
export const JWT_SECRET_FOR_PASSWORD_RESET_TOKEN = process.env.JWT_SECRET_FOR_PASSWORD_RESET_TOKEN || JWT_SECRET_FOR_AUTHORIZATION_TOKEN;
export const BASE_URL = process.env.BASE_URL || 'https://kuulie-auth-service-dev.herokuapp.com'
export const CLIENT_PORTAL_API_URL = process.env.CLIENT_PORTAL_API_URL || 'http://localhost:5000'

export const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.ethereal.email'
export const EMAIL_USER_NAME = process.env.EMAIL_USER_NAME || 'kian.turner46@ethereal.email'
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'SHyVut55UfGUttwZFz'
export const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'password'