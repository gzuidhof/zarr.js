import { MutableMapping, MutableMappingProxy, createProxy, AsyncMutableMapping, AsyncMutableMappingProxy } from './mutableMapping';
import { SyncStore, ValidStoreType, Store } from './storage/types';
import { parseMetadata } from './metadata';
import { ZarrMetadataType, UserAttributes } from './types';
import { PermissionError } from './errors';

/**
 * Class providing access to user attributes on an array or group. Should not be
 * instantiated directly, will be available via the `.attrs` property of an array or
 * group.
 */
export class Attributes<M extends UserAttributes> implements AsyncMutableMapping<any> {
    store: Store;
    key: string;
    readOnly: boolean;
    cache: boolean;
    private cachedValue: M | null;

    constructor(store: Store, key: string, readOnly: boolean, cache = true) {
        this.store = store;
        this.key = key;
        this.readOnly = readOnly;
        this.cache = cache;
        this.cachedValue = null;
    }

    /**
     * Retrieve all attributes as a JSON object.
     */
    public async asObject() {
        if (this.cache && this.cachedValue !== null) {
            return this.cachedValue;
        }
        const o = await this.getNoSync();
        if (this.cache) {
            this.cachedValue = o;
        }
        return o;
    }

    private async getNoSync(): Promise<M> {
        try {
            const data = await this.store.getItem(this.key);
            // TODO fix typing?
            return parseMetadata<M>(JSON.stringify(data));
        } catch (error) {
            return {} as M;
        }
    }

    private async setNoSync(key: string, value: any) {
        const d = await this.getNoSync();
        (d as any)[key] = value;
        await this.putNoSync(d);
        return true;
    }

    private async putNoSync(m: M) {
        await this.store.setItem(this.key, JSON.stringify(m));
        if (this.cache) {
            this.cachedValue = m;
        }
    }

    private async delNoSync(key: string): Promise<boolean> {
        const d = await this.getNoSync();
        delete (d as any)[key];
        await this.putNoSync(d);
        return true;
    }

    /**
     * Overwrite all attributes with the provided object in a single operation
     */
    async put(d: M) {
        if (this.readOnly) {
            throw new PermissionError("attributes are read-only");
        }
        return this.putNoSync(d);
    }

    async setItem(key: string, value: any): Promise<boolean> {
        if (this.readOnly) {
            throw new PermissionError("attributes are read-only");
        }
        return this.setNoSync(key, value);
    }

    async getItem(key: string) {
        return ((await this.asObject()) as any)[key];
    }

    async deleteItem(key: string) {
        if (this.readOnly) {
            throw new PermissionError("attributes are read-only");
        }
        return this.delNoSync(key);
    }

    async containsItem(key: string) {
        return ((await this.asObject()) as any)[key] !== undefined;
    }

    proxy(): AsyncMutableMappingProxy<any> {
        return createProxy(this);
    }
}