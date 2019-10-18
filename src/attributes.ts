import { MutableMapping, MutableMappingProxy, createProxy } from './mutableMapping';
import { Store } from './storage/types';
import { parseMetadata } from './metadata';
import { ZarrMetadataType } from './types';
import { PermissionError } from './errors';

/**
 * Class providing access to user attributes on an array or group. Should not be
 * instantiated directly, will be available via the `.attrs` property of an array or
 * group.
 */
class Attributes<T, M extends ZarrMetadataType> implements MutableMapping<T> {
    store: Store<T>;
    key: string;
    readOnly: boolean;
    cache: boolean;
    private cachedValue: M | null;

    constructor(store: Store<T>, key: string, readOnly = false, cache = true) {
        this.store = store;
        this.key = key;
        this.readOnly = readOnly;
        this.cache = cache;
        this.cachedValue = null;
    }

    private getNoSync(): M {
        try {
            const data = this.store.getItem(this.key);
            // TODO fix typing
            return parseMetadata<M>(data as unknown as string);
        } catch {
            console.warn("Couldn't get attributes");
            return {} as M;
        }
    }
    /**
     * Retrieve all attributes as a JSON object.
     */
    public asObject() {
        if (this.cache && this.cachedValue !== null) {
            return this.cachedValue;
        }
        const o = this.getNoSync();
        if (this.cache) {
            this.cachedValue = o;
        }
        return o;
    }

    public setItem(item: string, value: any): boolean {
        if (this.readOnly) {
            throw new PermissionError("attributes are read-only");
        }
        throw new Error("Method not implemented.");
    }

    getItem(item: string): T {
        return this.asObject()[item];
    }
    deleteItem(item: string): boolean {
        if (this.readOnly) {
            throw new PermissionError("attributes are read-only");
        }
        throw new Error("Method not implemented.");
    }
    containsItem(item: string): boolean {
        return this.asObject()[item] !== undefined;
    }

    getProxy(): this & MutableMappingProxy<T> {
        return createProxy(this);
    }
}