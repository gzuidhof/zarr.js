import { ValidStoreType, AsyncStore } from './types';
import { IS_NODE, resolveUrl } from '../util';
import { KeyError, HTTPError } from '../errors';

enum HTTPMethod {
  HEAD = 'HEAD',
  GET = 'GET',
  PUT = 'PUT',
}

const DEFAULT_METHODS = [HTTPMethod.HEAD, HTTPMethod.GET, HTTPMethod.PUT];

interface HTTPStoreOptions {
    fetchOptions?: RequestInit;
    supportedMethods?: HTTPMethod[];
}

export class HTTPStore<UrlRoot extends string | URL=string> implements AsyncStore<ArrayBuffer, RequestInit> {
    listDir?: undefined;
    rmDir?: undefined;
    getSize?: undefined;
    rename?: undefined;

    public url: UrlRoot;
    public fetchOptions: RequestInit;
    private supportedMethods: Set<HTTPMethod>;

    constructor(url: UrlRoot, options: HTTPStoreOptions = {}) {
        this.url = url;
        const { fetchOptions = {}, supportedMethods = DEFAULT_METHODS } = options;
        this.fetchOptions = fetchOptions;
        this.supportedMethods = new Set(supportedMethods);
    }

    keys(): Promise<string[]> {
        throw new Error('Method not implemented.');
    }

    async getItem(item: string, opts?: RequestInit) {
        const url = resolveUrl(this.url, item);
        const value = await fetch(url, { ...this.fetchOptions, ...opts });

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
        if (!this.supportedMethods.has(HTTPMethod.PUT)) {
          throw new Error('HTTP PUT no a supported method for store.');
        }
        const url = resolveUrl(this.url, item);
        if (typeof value === 'string') {
            value = new TextEncoder().encode(value).buffer;
        }
        const set = await fetch(url, { ...this.fetchOptions, method: HTTPMethod.PUT, body: value });
        return set.status.toString()[0] === '2';
    }

    deleteItem(_item: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    async containsItem(item: string): Promise<boolean> {
        const url = resolveUrl(this.url, item);
        // Just check headers if HEAD method supported
        const method = this.supportedMethods.has(HTTPMethod.HEAD) ? HTTPMethod.HEAD : HTTPMethod.GET;
        const value = await fetch(url, { ...this.fetchOptions, method });
        return value.status === 200;
    }
}
