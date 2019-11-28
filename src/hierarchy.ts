import { MutableMappingProxy, createProxy, AsyncMutableMapping, AsyncMutableMappingProxy } from './mutableMapping';
import { ValidStoreType, Store, } from './storage/types';
import { normalizeStoragePath } from './util';
import { containsArray, pathToPrefix, containsGroup, initGroup } from './storage/index';
import { ContainsArrayError, GroupNotFoundError, PermissionError, KeyError, ValueError } from './errors';
import { ZarrGroupMetadata, UserAttributes } from './types';
import { GROUP_META_KEY, ATTRS_META_KEY } from './names';
import { parseMetadata } from './metadata';
import { Attributes } from './attributes';
import { CreateArrayOptions, array, empty, zeros, ones, full, create } from './creation';
import { NestedArray } from './nestedArray';
import { TypedArray } from './nestedArray/types';
import { ZarrArray } from './core';


export class Group implements AsyncMutableMapping<Group | ZarrArray> {
    /**
     * A `Store` providing the underlying storage for the group.
     */
    public store: Store;

    /**
     * Storage path.
     */
    public path: string;

    /**
     * Group name following h5py convention.
     */
    public get name(): string {
        if (this.path.length > 0) {
            if (this.path[0] !== "/") {
                return "/" + this.path;
            }
            return this.path;
        }
        return "/";
    }

    /**
     * Final component of name.
     */
    public get basename(): string {
        const parts = this.name.split("/");
        return parts[parts.length - 1];
    }

    /**
     * An object containing user-defined attributes. Note that
     * attribute values are stored as a JSON string in a store.
     */
    public attrs: Attributes<UserAttributes>;


    private _chunkStore: Store | null;
    /**
     * A `Store` providing the underlying storage for array chunks.
     */
    public get chunkStore(): Store {
        if (this._chunkStore) {
            return this._chunkStore;
        }
        return this.store;
    }

    private keyPrefix: string;
    public readOnly: boolean;
    private meta: ZarrGroupMetadata;

    public static async create(store: Store, path: string | null = null, readOnly = false, chunkStore: Store | null = null, cacheAttrs = true) {
        const metadata = await this.loadMetadataForConstructor(store, path);
        return new Group(store, path, metadata as ZarrGroupMetadata, readOnly, chunkStore, cacheAttrs);
    }

    private static async loadMetadataForConstructor(store: Store, path: null | string) {
        path = normalizeStoragePath(path);

        if (await containsArray(store, path)) {
            throw new ContainsArrayError(path);
        }

        const keyPrefix = pathToPrefix(path);
        try {
            const metaStoreValue = await store.getItem(keyPrefix + GROUP_META_KEY);
            return parseMetadata(metaStoreValue);
        }
        catch (error) {
            throw new GroupNotFoundError(path);
        }
    }

    private constructor(store: Store, path: string | null = null, metadata: ZarrGroupMetadata, readOnly = false, chunkStore: Store | null = null, cacheAttrs = true) {
        this.store = store;
        this._chunkStore = chunkStore;
        this.path = normalizeStoragePath(path);
        this.keyPrefix = pathToPrefix(this.path);
        this.readOnly = readOnly;
        this.meta = metadata;

        // Initialize attributes
        const attrKey = this.keyPrefix + ATTRS_META_KEY;
        this.attrs = new Attributes<UserAttributes>(this.store, attrKey, this.readOnly, cacheAttrs);
    }

    private itemPath(item: string | null) {
        const absolute = typeof item === "string" && item.length > 0 && item[0] === '/';
        const path = normalizeStoragePath(item);
        // Absolute path
        if (!absolute && this.path.length > 0) {
            return this.keyPrefix + path;
        }
        return path;
    }

    /**
     * Create a sub-group.
     */
    public async createGroup(name: string, overwrite = false) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const path = this.itemPath(name);
        await initGroup(this.store, path, this._chunkStore, overwrite);
        return Group.create(this.store, path, this.readOnly, this._chunkStore, this.attrs.cache);
    }

    /**
     * Obtain a sub-group, creating one if it doesn't exist.
     */
    public async requireGroup(name: string, overwrite = false) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const path = this.itemPath(name);
        if (!await containsGroup(this.store, path)) {
            await initGroup(this.store, path, this._chunkStore, overwrite);
        }
        return Group.create(this.store, path, this.readOnly, this._chunkStore, this.attrs.cache);
    }

    private getOptsForArrayCreation(name: string, opts: CreateArrayOptions = {}) {
        const path = this.itemPath(name);
        opts.path = path;

        if (opts.cacheAttrs === undefined) {
            opts.cacheAttrs = this.attrs.cache;
        }
        opts.store = this.store;
        opts.chunkStore = this.chunkStore;
        return opts;
    }

    /**
     * Creates an array
     */
    public array(name: string, data: Buffer | ArrayBuffer | NestedArray<TypedArray>, opts?: CreateArrayOptions, overwrite?: boolean) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);
        opts.overwrite = overwrite === undefined ? opts.overwrite : overwrite;

        return array(data, opts);
    }

    public empty(name: string, shape: number[], opts: CreateArrayOptions = {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);

        return empty(shape, opts);
    }

    public zeros(name: string, shape: number[], opts: CreateArrayOptions = {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);

        return zeros(shape, opts);
    }

    public ones(name: string, shape: number[], opts: CreateArrayOptions = {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);

        return ones(shape, opts);
    }

    public full(name: string, shape: number[], fillValue: number | null, opts: CreateArrayOptions = {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);

        return full(shape, fillValue, opts);
    }

    public createDataset(name: string, shape?: number[], data?: Buffer | ArrayBuffer | NestedArray<TypedArray>, opts?: CreateArrayOptions) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);

        let z: Promise<ZarrArray>;
        if (data === undefined) {
            if (shape === undefined) {
                throw new ValueError("Shape must be set if no data is passed to CreateDataset");
            }
            z = create(shape, opts);
        } else {
            z = array(data, opts);
        }

        return z;
    }

    async getItem(item: string) {
        const path = this.itemPath(item);
        if (await containsArray(this.store, path)) {
            return ZarrArray.create(this.store, this.path, this.readOnly, this.chunkStore, undefined, this.attrs.cache);
        } else if (await containsGroup(this.store, path)) {
            return Group.create(this.store, path, this.readOnly, this._chunkStore, this.attrs.cache);
        }
        throw new KeyError(item);
    }

    async setItem(item: string, value: any) {
        await this.array(item, value, {}, true);
        return true;
    }

    async deleteItem(item: string): Promise<boolean> {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        throw new Error("Method not implemented.");
    }

    async containsItem(item: string) {
        const path = this.itemPath(item);
        return await containsArray(this.store, path) || containsGroup(this.store, path);
    }

    proxy(): AsyncMutableMappingProxy<Group> {
        return createProxy(this);
    }
}