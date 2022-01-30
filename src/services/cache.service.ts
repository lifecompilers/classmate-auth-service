import { createClient } from 'redis';
import { OAuthClient } from '../models/oauth-client.model';
import { ClientService } from './client.service';

const client = createClient({
    url: process.env.REDIS_URL,
});

client.on('error', err => {
    console.log('Error ' + err);
});

(async () => {
    await buildClientCache();
})();

export async function buildClientCache() {
    try {
        const clientService: ClientService = new ClientService();
        const allClients = await clientService.getAllClientList();
        allClients.forEach(async (c: any) => {
            c.logo = "";
            await setCache(c._id.toString(), c);
        });
        console.log('Added client cache, Clients: ', allClients.length);
    } catch (error) {
        console.log('Error while caching client.....', error);
    }
}

export async function setCache(key: any, value: any) {
    if (!client.isOpen)
        await client.connect();
    return await client.set(key, JSON.stringify(value));
}

export async function getCache(key: any) {
    if (!client.isOpen)
        await client.connect();
    const jsonString = await client.get(key);
    if (jsonString) {
        return JSON.parse(jsonString);
    }
}

export async function getClientDataById(id: any) {
    let client = await getCache(id);
    if (!client) {
        await buildClientCache();
        client = await getCache(id);
    }
    return client;
}
