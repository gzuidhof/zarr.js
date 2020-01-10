import { SyncStore, ValidStoreType, AsyncStore } from './types';
import { createProxy, MutableMappingProxy } from '../mutableMapping';
import { KeyError } from '../errors';

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
        const url = new URL(item, this.url).href;
        const value = await fetch(url);
        if (typeof window === 'undefined') {
            // Node
            return Buffer.from(await value.arrayBuffer());
        }
        return value.arrayBuffer(); // Browser
    }

    async setItem(item: string, value: ValidStoreType): Promise<boolean> {
        if (typeof value === 'string') {
            value = new TextEncoder().encode(value).buffer;
        }
        const set = await fetch(item, { method: 'PUT' });
        return set.status.toString()[0] === '2';
    }
    deleteItem(item: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    async containsItem(item: string): Promise<boolean> {
        const url = new URL(item, this.url).href;
        const value = await fetch(url);

        return value.status === 200;
    }
}
