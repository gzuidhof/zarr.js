import { ValidStoreType, AsyncStore } from './types';
import { IS_NODE, joinUrlParts } from '../util';
import { KeyError, HTTPError } from '../errors';

enum HTTPMethod {
  HEAD = 'HEAD',
  GET = 'GET',
  PUT = 'PUT',
}

const DEFAULT_METHODS = [HTTPMethod.HEAD, HTTPMethod.GET, HTTPMethod.PUT];

export class HTTPStore implements AsyncStore<ArrayBuffer> {
    listDir?: undefined;
    rmDir?: undefined;
    getSize?: undefined;
    rename?: undefined;

    private _supportedMethods: Map<HTTPMethod, boolean>;
    public url: string;
    public storageOptions: RequestInit;

    constructor(url: string, storageOptions = {}, supportedMethods = DEFAULT_METHODS) {
        this.url = url;
        this.storageOptions = storageOptions;
        const methods = new Map();
        supportedMethods.map(m => methods.set(m, true));
        this._supportedMethods = methods;
    }

    keys(): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    async getItem(item: string) {
        const url = joinUrlParts(this.url, item);
        const value = await fetch(url, this.storageOptions);

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
        if (!(HTTPMethod.PUT in this._supportedMethods)) {
          throw new Error('HTTP PUT for store.');
        }
        const url = joinUrlParts(this.url, item);
        if (typeof value === 'string') {
            value = new TextEncoder().encode(value).buffer;
        }
        const set = await fetch(url, {...this.storageOptions, method: HTTPMethod.PUT, body: value });
        return set.status.toString()[0] === '2';
    }

    deleteItem(_item: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    async containsItem(item: string): Promise<boolean> {
        const url = joinUrlParts(this.url, item);
        // Just check headers if HEAD method supported
        const method = HTTPMethod.HEAD in this._supportedMethods ? HTTPMethod.HEAD : HTTPMethod.GET;
        const value = await fetch(url, { ...this.storageOptions, method });
        return value.status === 200;
    }
}

