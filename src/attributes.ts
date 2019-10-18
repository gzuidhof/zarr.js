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
export class Attributes<M extends ZarrMetadataType> implements MutableMapping<any> {
    store: Store<string>;
    key: string;
    readOnly: boolean;
    cache: boolean;
    private cachedValue: M | null;

    constructor(store: Store<string>, key: string, readOnly = false, cache = true) {
        this.store = store;
        this.key = key;
        this.readOnly = readOnly;
        this.cache = cache;
        this.cachedValue = null;
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

    private getNoSync(): M {
        try {
            const data = this.store.getItem(this.key);
            // TODO fix typing?
            return parseMetadata<M>(data);
        } catch {
            return {} as M;
        }
    }

    private setNoSync(key: string, value: any) {
        const d = this.getNoSync();
        (d as any)[key] = value;
        this.putNoSync(d);
        return true;
    }

    private putNoSync(m: M) {
        this.store.setItem(this.key, JSON.stringify(m));
        if (this.cache) {
            this.cachedValue = m;
        }
    }

    private delNoSync(key: string): boolean {
        const d = this.getNoSync();
        delete (d as any)[key];
        this.putNoSync(d);
        return true;
    }

    /**
     * Overwrite all attributes with the provided object in a single operation
     */
    put(d: M) {
        if (this.readOnly) {
            throw new PermissionError("attributes are read-only");
        }
        this.putNoSync(d);
    }

    setItem(key: string, value: any): boolean {
        if (this.readOnly) {
            throw new PermissionError("attributes are read-only");
        }
        return this.setNoSync(key, value);
    }

    getItem(key: string): any {
        return (this.asObject() as any)[key];
    }

    deleteItem(key: string): boolean {
        if (this.readOnly) {
            throw new PermissionError("attributes are read-only");
        }
        return this.delNoSync(key);
    }

    containsItem(key: string): boolean {
        return (this.asObject() as any)[key] !== undefined;
    }

    proxy(): MutableMappingProxy<any> {
        return createProxy(this);
    }
}