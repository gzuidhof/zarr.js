import { createProxy, AsyncMutableMapping, AsyncMutableMappingProxy } from './mutableMapping';
import { Store, } from './storage/types';
import { normalizeStoragePath } from './util';
import { containsArray, pathToPrefix, containsGroup, initGroup } from './storage/index';
import { ContainsArrayError, GroupNotFoundError, PermissionError, KeyError, ValueError, ContainsGroupError } from './errors';
import { ZarrGroupMetadata, UserAttributes, PersistenceMode } from './types';
import { GROUP_META_KEY, ATTRS_META_KEY } from './names';
import { parseMetadata } from './metadata';
import { Attributes } from './attributes';
import { array, empty, zeros, ones, full, create, normalizeStoreArgument, CreateArrayOptions } from './creation';
import { NestedArray } from './nestedArray';
import { TypedArray } from './nestedArray/types';
import { ZarrArray } from './core';


export class Group<StoreGetOptions = any> implements AsyncMutableMapping<Group<StoreGetOptions> | ZarrArray<StoreGetOptions>> {
    /**
     * A `Store` providing the underlying storage for the group.
     */
    public store: Store<StoreGetOptions>;

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


    private _chunkStore: Store<StoreGetOptions> | null;
    /**
     * A `Store` providing the underlying storage for array chunks.
     */
    public get chunkStore(): Store<StoreGetOptions> {
        if (this._chunkStore) {
            return this._chunkStore;
        }
        return this.store;
    }

    private keyPrefix: string;
    public readOnly: boolean;
    private meta: ZarrGroupMetadata;

    public static async create<StoreGetOptions>(store: Store<StoreGetOptions>, path: string | null = null, readOnly = false, chunkStore: Store<StoreGetOptions> | null = null, cacheAttrs = true) {
        const metadata = await this.loadMetadataForConstructor(store, path);
        return new Group(store, path, metadata as ZarrGroupMetadata, readOnly, chunkStore, cacheAttrs);
    }

    private static async loadMetadataForConstructor<StoreGetOptions>(store: Store<StoreGetOptions>, path: null | string) {
        path = normalizeStoragePath(path);
        const keyPrefix = pathToPrefix(path);
        try {
            const metaStoreValue = await store.getItem(keyPrefix + GROUP_META_KEY);
            return parseMetadata(metaStoreValue);
        } catch (error) {
            if (await containsArray(store, path)) {
                throw new ContainsArrayError(path);
            }
            throw new GroupNotFoundError(path);
        }
    }

    private constructor(store: Store<StoreGetOptions>, path: string | null = null, metadata: ZarrGroupMetadata, readOnly = false, chunkStore: Store<StoreGetOptions> | null = null, cacheAttrs = true) {
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

    private getOptsForArrayCreation(name: string, opts: Omit<CreateArrayOptions, 'shape'> = {}) {
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
    public array(name: string, data: Buffer | ArrayBuffer | NestedArray<TypedArray>, opts?: Omit<CreateArrayOptions, 'shape'>, overwrite?: boolean) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);
        opts.overwrite = overwrite === undefined ? opts.overwrite : overwrite;

        return array(data, opts);
    }

    public empty(name: string, shape: number | number[], opts: Omit<CreateArrayOptions, 'shape'>= {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);

        return empty(shape, opts);
    }

    public zeros(name: string, shape: number | number[], opts: Omit<CreateArrayOptions, 'shape'>= {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);

        return zeros(shape, opts);
    }

    public ones(name: string, shape: number | number[], opts: Omit<CreateArrayOptions, 'shape'>= {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);

        return ones(shape, opts);
    }

    public full(name: string, shape: number | number[], fillValue: number | null, opts: Omit<CreateArrayOptions, 'shape'> = {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);

        return full(shape, fillValue, opts);
    }

    public createDataset(name: string, shape?: number | number[], data?: Buffer | ArrayBuffer | NestedArray<TypedArray>, opts?: Omit<CreateArrayOptions, 'shape'>) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        opts = this.getOptsForArrayCreation(name, opts);

        let z: Promise<ZarrArray<StoreGetOptions>>;
        if (data === undefined) {
            if (shape === undefined) {
                throw new ValueError("Shape must be set if no data is passed to CreateDataset");
            }
            z = create({ shape, ...opts });
        } else {
            z = array(data, opts);
        }
        return z;
    }

    async getItem(item: string) {
        const path = this.itemPath(item);
        if (await containsArray(this.store, path)) {
            return ZarrArray.create(this.store, path, this.readOnly, this.chunkStore, undefined, this.attrs.cache);
        } else if (await containsGroup(this.store, path)) {
            return Group.create(this.store, path, this.readOnly, this._chunkStore, this.attrs.cache);
        }
        throw new KeyError(item);
    }

    async setItem(item: string, value: any) {
        await this.array(item, value, {}, true);
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async deleteItem(_item: string): Promise<boolean> {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        throw new Error("Method not implemented.");
    }

    async containsItem(item: string) {
        const path = this.itemPath(item);
        return await containsArray(this.store, path) || containsGroup(this.store, path);
    }

    proxy(): AsyncMutableMappingProxy<Group<StoreGetOptions>> {
        return createProxy(this);
    }
}

/**
 * Create a group.
 * @param store Store or path to directory in file system.
 * @param path Group path within store.
 * @param chunkStore Separate storage for chunks. If not provided, `store` will be used for storage of both chunks and metadata.
 * @param overwrite If `true`, delete any pre-existing data in `store` at `path` before creating the group.
 * @param cacheAttrs If `true` (default), user attributes will be cached for attribute read operations.
 *   If `false`, user attributes are reloaded from the store prior to all attribute read operations.
 */
export async function group<StoreGetOptions>(store?: Store<StoreGetOptions> | string, path: string | null = null, chunkStore?: Store<StoreGetOptions>, overwrite = false, cacheAttrs = true) {
    store = normalizeStoreArgument(store);
    path = normalizeStoragePath(path);

    if (overwrite || await containsGroup(store)) {
        await initGroup(store, path, chunkStore, overwrite);
    }

    return Group.create(store, path, false, chunkStore, cacheAttrs);
}

/**
 * Open a group using file-mode-like semantics.
 * @param store Store or path to directory in file system or name of zip file.
 * @param path Group path within store.
 * @param mode Persistence mode, see `PersistenceMode` type.
 * @param chunkStore Store or path to directory in file system or name of zip file.
 * @param cacheAttrs If `true` (default), user attributes will be cached for attribute read operations
 *   If False, user attributes are reloaded from the store prior to all attribute read operations.
 *
 */
export async function openGroup<StoreGetOptions>(store?: Store<StoreGetOptions> | string, path: string | null = null, mode: PersistenceMode = "a", chunkStore?: Store<StoreGetOptions>, cacheAttrs = true) {
    store = normalizeStoreArgument(store);
    if (chunkStore !== undefined) {
        chunkStore = normalizeStoreArgument(store);
    }
    path = normalizeStoragePath(path);

    if (mode === "r" || mode === "r+") {
        if (!await containsGroup(store, path)) {
            if (await containsArray(store, path)) {
                throw new ContainsArrayError(path);
            }
            throw new GroupNotFoundError(path);
        }
    } else if (mode === "w") {
        await initGroup(store, path, chunkStore, true);
    } else if (mode === "a") {
        if (!await containsGroup(store, path)) {
            if (await containsArray(store, path)) {
                throw new ContainsArrayError(path);
            }
            await initGroup(store, path, chunkStore);
        }
    } else if (mode === "w-" || (mode as any) === "x") {
        if (await containsArray(store, path)) {
            throw new ContainsArrayError(path);
        } else if (await containsGroup(store, path)) {
            throw new ContainsGroupError(path);
        } else {
            await initGroup(store, path, chunkStore);
        }
    } else {
        throw new ValueError(`Invalid mode argument: ${mode}`);
    }

    const readOnly = mode === "r";
    return Group.create(store, path, readOnly, chunkStore, cacheAttrs);
}
