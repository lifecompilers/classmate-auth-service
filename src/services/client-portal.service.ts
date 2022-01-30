import axios from "axios";
import { CLIENT_PORTAL_API_URL } from "../shared/constants/env-constants";

export class ClientPortalService {
    public async getUsersByClientIdAuthUserIds(accessToken: string, clientId: string, authUserIds: string[]) {
        try {
            return await axios.get(`${CLIENT_PORTAL_API_URL}/user/v1/by-client-auth-userids`, {
                headers: {
                    'content-type': 'application/json',
                    'client-id': clientId,
                    'auth-user-ids': authUserIds.join(','),
                    'authorization': `Bearer ${accessToken}`
                }
            })
        } catch (error) {
            console.log(error);
        }
    }
    public async createUserInClientDatabase(accessToken: string, clientId: string, authUserId: string, firstName: string, lastName: string, licenseType: string) {
        return await axios.post(`${CLIENT_PORTAL_API_URL}/user/v1/from-admin-portal`,
            {
                'auth_user_id': authUserId,
                'first_name': firstName,
                'last_name': lastName,
                'license_type': licenseType
            }, {
            headers: {
                'content-type': 'application/json',
                'client-id': clientId,
                'authorization': `Bearer ${accessToken}`
            },
        })
    }
    public async updateUserInClientDatabase(accessToken: string, clientId: string, authUserId: string, firstName: string, lastName: string, licenseType: string) {
        return await axios.put(`${CLIENT_PORTAL_API_URL}/user/v1/from-admin-portal/${authUserId}`,
            {
                'first_name': firstName,
                'last_name': lastName,
                'license_type': licenseType
            }, {
            headers: {
                'content-type': 'application/json',
                'client-id': clientId,
                'authorization': `Bearer ${accessToken}`
            },
        })
    }
}