import JWT from 'jsonwebtoken';
import {
  JWT_ACCESS_TOKEN_EXPIRY_SECONDS,
  JWT_ISSUER,
  JWT_REFRESH_TOKEN_EXPIRY_SECONDS,
  JWT_SECRET_FOR_ACCESS_TOKEN,
  JWT_SECRET_FOR_REFRESH_TOKEN,
  JWT_SECRET_FOR_AUTHORIZATION_TOKEN,
  JWT_AUTHORIZATION_TOKEN_EXPIRY_SECONDS
} from '../shared/constants/env-constants';
import { OAuthClient } from './oauth-client.model';
import { OAuthUser } from './oauth-user.model';

module.exports.generateAccessToken = function (_client: any, user: any, scope: Function, callback: Function) {
  const payload = {
    scope,
    user: {
      id: user.id,
      role: user.role,
      client: {
        id: user.client._id || user.client.id,
        domain: user.client.domain
      },
    },
  };
  const secret: JWT.Secret = String(JWT_SECRET_FOR_ACCESS_TOKEN);
  const options: JWT.SignOptions = {
    algorithm: 'HS256',
    expiresIn: JWT_ACCESS_TOKEN_EXPIRY_SECONDS,
    issuer: JWT_ISSUER,
    audience: user.client.domain
  }
  const token = JWT.sign(payload, secret, options);
  callback(false, token);
};

module.exports.generateRefreshToken = function (_client: any, user: any, scope: Function, callback: Function) {
  const payload = {
    scope,
    user: {
      id: user.id,
      role: user.role,
      client: {
        id: user.client._id || user.client.id,
        domain: user.client.domain
      }
    },
  };
  const secret: JWT.Secret = String(JWT_SECRET_FOR_REFRESH_TOKEN);
  const options: JWT.SignOptions = {
    algorithm: 'HS256',
    expiresIn: JWT_REFRESH_TOKEN_EXPIRY_SECONDS,
    issuer: JWT_ISSUER,
    audience: user.client.domain
  }
  const token = JWT.sign(payload, secret, options);
  callback(false, token);
};

module.exports.generateAuthorizationCode = function (_client: any, user: any, scope: Function, callback: Function) {
  const payload = {
    scope,
    user: {
      id: user.id,
      role: user.role,
      client: {
        id: user.client._id || user.client.id,
        domain: user.client.domain
      }
    },
  };
  const secret: JWT.Secret = String(JWT_SECRET_FOR_AUTHORIZATION_TOKEN);
  const options: JWT.SignOptions = {
    algorithm: 'HS256',
    expiresIn: JWT_AUTHORIZATION_TOKEN_EXPIRY_SECONDS,
    issuer: JWT_ISSUER,
    audience: user.client.domain
  }
  const token = JWT.sign(payload, secret, options);
  callback(false, token);
};

module.exports.getAccessToken = function (bearerToken: any, callback: Function) {
  const accessTokenSecret: JWT.Secret = String(JWT_SECRET_FOR_ACCESS_TOKEN);
  return JWT.verify(bearerToken, accessTokenSecret, function (err: any, decoded: any) {

    if (err) {
      return callback(err, false);
    }
    const tokenData = {
      accessToken: bearerToken,
      accessTokenExpiresAt: new Date(decoded.exp * 1000),
      scope: decoded.scope,
      user: decoded.user,
      userId: decoded.user.id,
      client: decoded.user.client,
      clientId: decoded.user.client.id
    }
    return callback(false, tokenData);
  });
};

module.exports.getRefreshToken = function (bearerToken: any, callback: Function) {
  const refreshTokenSecret: JWT.Secret = String(JWT_SECRET_FOR_REFRESH_TOKEN);
  return JWT.verify(bearerToken, refreshTokenSecret, function (err: any, decoded: any) {
    if (err) {
      return callback(err, false);
    }
    const tokenData = {
      refreshToken: bearerToken,
      refreshTokenExpiresAt: new Date(decoded.exp * 1000),
      scope: decoded.scope,
      user: decoded.user,
      userId: decoded.user.id,
      client: decoded.user.client,
      clientId: decoded.user.client.id
    }
    return callback(false, tokenData);
  });
};

module.exports.getAuthorizationCode = function (code: any, callback: Function) {
  const refreshTokenSecret: JWT.Secret = String(JWT_SECRET_FOR_AUTHORIZATION_TOKEN);
  return JWT.verify(code, refreshTokenSecret, function (err: any, decoded: any) {
    if (err) {
      return callback(err, false);
    }
    const tokenData = {
      code,
      expiresAt: new Date(decoded.exp * 1000),
      redirectUri: decoded.redirectUri,
      scope: decoded.scope,
      user: decoded.user,
      client: decoded.user.client,
    }
    return callback(false, tokenData);
  });

}

module.exports.revokeToken = function (_token: string) {
  return true;
};

module.exports.getClient = async function (clientId: string, clientSecret: string) {
  const leanedClientDocument = await OAuthClient.findOne({ clientId: clientId }).lean();
  if (!leanedClientDocument) return null;
  return {
    ...leanedClientDocument,
    redirectUris: (leanedClientDocument.redirectUris && leanedClientDocument.redirectUris.length > 0) ? leanedClientDocument.redirectUris : [leanedClientDocument.domain + "/callback"],
    id: leanedClientDocument._id.toString()
  }
};


module.exports.getUser = async function (username: string, password: string) {
  const userDocument = await OAuthUser.findOne({ email: username }).populate("client");
  const isValidUserCredentials = await userDocument?.comparePassword(password);
  if (!userDocument || !isValidUserCredentials) return null;
  const client: any = userDocument.client?.toJSON();
  return {
    ...(userDocument.toJSON()),
    client: {
      ...client,
      redirectUris: (client.redirectUris && client.redirectUris.length > 0) ? client.redirectUris : [client.domain + "/callback"],
    }
  }
};

// TODO: Review below implementations
// required for grant_type=refresh_token
// As we're using JWT there's no need to store the token after it's generated
module.exports.saveRefreshToken = function (refreshToken: any, clientId: any, expires: any, userId: any, callback: Function) {
  return callback(false);
};

// As we're using JWT there's no need to store the token after it's generated
module.exports.saveAccessToken = function (accessToken: any, clientId: any, expires: any, userId: any, callback: Function) {
  return callback(false);
};

module.exports.revokeAuthorizationCode = function (code: any) {
  return true;
};

module.exports.saveAuthorizationCode = function (code: any, client: any, user: any, callback: Function) {
  return callback(false, code);

}

module.exports.saveToken = function (token: any, client: any, user: any) {
  const accessToken = {
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    client: client,
    clientId: client.clientId,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    user: user,
    userId: user.id,
  };
  return accessToken;
};
