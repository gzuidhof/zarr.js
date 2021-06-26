import { createProxy, AsyncMutableMapping, AsyncMutableMappingProxy } from './mutableMapping';
import { Store as ZarrStore, ValidStoreType } from './storage/types';
import { normalizeStoragePath } from './util';
import { containsArray, pathToPrefix, containsGroup, initGroup } from './storage/index';
import { ContainsArrayError, GroupNotFoundError, PermissionError, KeyError, ValueError, ContainsGroupError } from './errors';
import { ZarrGroupMetadata, UserAttributes, PersistenceMode } from './types';
import { GROUP_META_KEY, ATTRS_META_KEY } from './names';
import { parseMetadata } from './metadata';
import { Attributes } from './attributes';
import { array, empty, zeros, ones, full, create, normalizeStoreArgument, CreateArrayOptions, Normalize } from './creation';
import { NestedArray } from './nestedArray';
import { TypedArray } from './nestedArray/types';
import { ZarrArray } from './core';
import { MemoryStore } from './storage/memoryStore';


type Options = Omit<CreateArrayOptions, 'store' | 'chunkStore' | 'shape'>;


export class Group<
    Store extends ZarrStore,
    ChunkStore extends ZarrStore=Store
> implements AsyncMutableMapping<Group<Store, ChunkStore> | ZarrArray<Store, ChunkStore>> {
    /**
     * A `Store` providing the underlying storage for the group.
     */
    public store: Store;

    /**
     * A `Store` providing the underlying storage for array chunks.
     */
    public chunkStore: ChunkStore;

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

    private keyPrefix: string;
    public readOnly: boolean;
    private meta: ZarrGroupMetadata;

    public static async create<Store extends ZarrStore, ChunkStore extends ZarrStore=Store>(store: Store, path: string | null = null, readOnly = false, chunkStore: ChunkStore | null = null, cacheAttrs = true) {
        const metadata = await this.loadMetadataForConstructor(store, path);
        return new Group(store, path, metadata as ZarrGroupMetadata, readOnly, chunkStore, cacheAttrs);
    }

    private static async loadMetadataForConstructor(store: ZarrStore, path: null | string) {
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

    private constructor(store: Store, path: string | null = null, metadata: ZarrGroupMetadata, readOnly = false, chunkStore: ChunkStore | null = null, cacheAttrs = true) {
        this.store = store;
        this.chunkStore = (chunkStore ?? store) as ChunkStore;
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
        await initGroup(this.store, path, this.chunkStore, overwrite);
        return Group.create(this.store, path, this.readOnly, this.chunkStore, this.attrs.cache);
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
            await initGroup(this.store, path, this.chunkStore, overwrite);
        }
        return Group.create(this.store, path, this.readOnly, this.chunkStore, this.attrs.cache);
    }

    private getOptsForArrayCreation(name: string, opts: Options = {}) {
        const path = this.itemPath(name);
        opts.path = path;

        if (opts.cacheAttrs === undefined) {
            opts.cacheAttrs = this.attrs.cache;
        }
        return { ...opts, store: this.store, chunkStore: this.chunkStore };
    }

    /**
     * Creates an array
     */
    public array(name: string, data: Buffer | ArrayBuffer | NestedArray<TypedArray>, opts?: Options, overwrite?: boolean) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const options = this.getOptsForArrayCreation(name, opts);
        options.overwrite = overwrite === undefined ? options.overwrite : overwrite;
        return array(data, options);
    }

    public empty(name: string, shape: number | number[], opts: Options = {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const options = this.getOptsForArrayCreation(name, opts);
        return empty(shape, options);
    }

    public zeros(name: string, shape: number | number[], opts: Options = {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const options = this.getOptsForArrayCreation(name, opts);
        return zeros(shape, options);
    }

    public ones(name: string, shape: number | number[], opts: Omit<CreateArrayOptions, 'shape'>= {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const options = this.getOptsForArrayCreation(name, opts);
        return ones(shape, options);
    }

    public full(name: string, shape: number | number[], fillValue: number | null, opts: Omit<CreateArrayOptions, 'shape'> = {}) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const options = this.getOptsForArrayCreation(name, opts);
        return full(shape, fillValue, options);
    }

    public createDataset(name: string, shape?: number | number[], data?: Buffer | ArrayBuffer | NestedArray<TypedArray>, opts?: Omit<CreateArrayOptions, 'shape'>) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const options = this.getOptsForArrayCreation(name, opts);
        let z: Promise<ZarrArray<Store, ChunkStore>>;
        if (data === undefined) {
            if (shape === undefined) {
                throw new ValueError("Shape must be set if no data is passed to CreateDataset");
            }
            return create({ shape, ...options });
        } 
        return array(data, options);
    }

    async getItem(item: string) {
        const path = this.itemPath(item);
        if (await containsArray(this.store, path)) {
            return ZarrArray.create(this.store, path, this.readOnly, this.chunkStore, undefined, this.attrs.cache);
        } else if (await containsGroup(this.store, path)) {
            return Group.create(this.store, path, this.readOnly, this.chunkStore, this.attrs.cache);
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

    proxy(): AsyncMutableMappingProxy<Group<Store, ChunkStore>> {
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
export async function group<
    StoreOption extends ZarrStore | string=MemoryStore,
    ChunkStore extends ZarrStore=Normalize<StoreOption>,
>(storeOption?: StoreOption, path: string | null = null, chunkStore?: ChunkStore, overwrite = false, cacheAttrs = true) {
    const store = normalizeStoreArgument(storeOption);
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
export async function openGroup<
    StoreOption extends ZarrStore | string=MemoryStore,
    ChunkStore extends ZarrStore=Normalize<StoreOption>,
>(storeOption?: StoreOption, path: string | null = null, mode: PersistenceMode = "a", chunkStore?: ChunkStore, cacheAttrs = true) {
    const store = normalizeStoreArgument(storeOption);
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
