import { OAuthClientData } from "../../models/oauth-client.model";
import { OAuthUser } from "../../models/oauth-user.model";
import { getClientDataById } from "../../services/cache.service";
import { InvalidCredentialsError } from "../errors/InvalidCredentialsError";

const authenticateHandler = {
    handle: async function (req: any, _res: any) {
        const { username, password } = req.body;

        const userDocument = await OAuthUser.findOne({ email: username });
        const isValidUserCredentials = await userDocument?.comparePassword(password);

        if (!userDocument || !isValidUserCredentials || !userDocument.client) {
            throw new InvalidCredentialsError("Username or password is incorrect.");
        };
        const client: OAuthClientData = await getClientDataById(userDocument.client.toString());
        if (!client) {
            throw new InvalidCredentialsError("Something went wrong while validating your credentials, try again later.");
        }
        if (!client.subscription) {
            throw new InvalidCredentialsError("Your organization do not have any active subscription.");
        }
        if (!client.isActive) {
            throw new InvalidCredentialsError("Your organization is not active.");
        }
        if (!userDocument.isActive) {
            throw new InvalidCredentialsError("Your account is not active.");
        }
        return {
            ...(userDocument.toJSON()),
            client: {
                ...client,
                redirectUris: (client.redirectUris && client.redirectUris.length > 0) ? client.redirectUris : [client.domain + "/callback"],
                id: client.id.toString()
            }
        }
    }

}

export default authenticateHandler;