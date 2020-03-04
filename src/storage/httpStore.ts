import { ValidStoreType, AsyncStore } from './types';
import { IS_NODE, joinUrlParts } from '../util';
import { KeyError, HTTPError } from '../errors';

export class HTTPStore implements AsyncStore<ArrayBuffer> {
    listDir?: undefined;
    rmDir?: undefined;
    getSize?: undefined;
    rename?: undefined;

    public url: string;

    constructor(url: string) {
        this.url = url;
    }

    keys(): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    async getItem(item: string) {
        const url = joinUrlParts(this.url, item);
        const value = await fetch(url);

        if (value.status === 404) {
            // Item is not found
            throw new KeyError(item);
        } else if (value.status !== 200) {
            throw new HTTPError(String(value.status));
        }

        // only decode if 200
        if (IS_NODE) {
            return Buffer.from(await value.arrayBuffer());
        } else {
            return value.arrayBuffer(); // Browser
        }
    }

    async setItem(item: string, value: ValidStoreType): Promise<boolean> {
        const url = joinUrlParts(this.url, item);
        if (typeof value === 'string') {
            value = new TextEncoder().encode(value).buffer;
        }
        const set = await fetch(url, { method: 'PUT', body: value});
        return set.status.toString()[0] === '2';
    }

    deleteItem(_item: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    async containsItem(item: string): Promise<boolean> {
        const url = joinUrlParts(this.url, item);
        const value = await fetch(url);

        return value.status === 200;
    }
}
