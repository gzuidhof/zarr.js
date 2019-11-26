import { MutableMapping, MutableMappingProxy, createProxy } from './mutableMapping';
import { Store, ValidStoreType, } from './storage/types';
import { normalizeStoragePath } from './util';
import { containsArray, pathToPrefix, containsGroup, initGroup } from './storage/index';
import { ContainsArrayError, GroupNotFoundError, PermissionError, KeyError } from './errors';
import { ZarrGroupMetadata, UserAttributes } from './types';
import { GROUP_META_KEY, ATTRS_META_KEY } from './names';
import { parseMetadata } from './metadata';
import { Attributes } from './attributes';


export class Group implements MutableMapping<Group> {
    /**
     * A `Store` providing the underlying storage for the group.
     */
    public store: Store<ValidStoreType>;

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


    private _chunkStore: Store<ValidStoreType> | null;
    /**
     * A `Store` providing the underlying storage for array chunks.
     */
    public get chunkStore(): Store<ValidStoreType> {
        if (this._chunkStore) {
            return this._chunkStore;
        }
        return this.store;
    }

    private keyPrefix: string;
    public readOnly: boolean;
    private meta: ZarrGroupMetadata;

    constructor(store: Store<ValidStoreType>, path: string | null = null, readOnly = false, chunkStore: Store<ValidStoreType> | null = null, cacheAttrs = true) {
        this.store = store;
        this._chunkStore = chunkStore;
        this.path = normalizeStoragePath(path);
        this.keyPrefix = pathToPrefix(this.path);
        this.readOnly = readOnly;

        if (containsArray(store, this.path)) {
            throw new ContainsArrayError(this.path);
        }

        // Initialize group metadata
        try {
            const metaKey = this.keyPrefix + GROUP_META_KEY;
            const metaStoreValue = this.store.getItem(metaKey);
            this.meta = parseMetadata(metaStoreValue);
        } catch {
            throw new GroupNotFoundError(this.path);
        }

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
    public createGroup(name: string, overwrite = false): Group {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const path = this.itemPath(name);
        initGroup(this.store, path, this._chunkStore, overwrite);
        return new Group(this.store, path, this.readOnly, this._chunkStore, this.attrs.cache);
    }

    /**
     * Obtain a sub-group, creating one if it doesn't exist.
     */
    public requireGroup(name: string, overwrite = false): Group {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const path = this.itemPath(name);
        if (!containsGroup(this.store, path)) {
            initGroup(this.store, path, this._chunkStore, overwrite);
        }
        return new Group(this.store, path, this.readOnly, this._chunkStore, this.attrs.cache);
    }

    /**
     * Creates an array
     */
    array(name: string, data: ValidStoreType, args?: [any]) {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        const path = this.itemPath(name);
        // TODO create and return array
    }

    getItem(item: string): Group {
        const path = this.itemPath(item);
        if (containsArray(this.store, path)) {
            // TODO: CREATE AND RETURN ARRAY
            throw new Error("Method not implemented.");
        } else if (containsGroup(this.store, path)) {
            return new Group(this.store, path, this.readOnly, this._chunkStore, this.attrs.cache);
        }
        throw new KeyError(item);
    }

    setItem(item: string, value: any): boolean {
        this.array(item, value);
        return true;
    }

    deleteItem(item: string): boolean {
        if (this.readOnly) {
            throw new PermissionError("group is read only");
        }
        throw new Error("Method not implemented.");
    }

    containsItem(item: string): boolean {
        const path = this.itemPath(item);
        return containsArray(this.store, path) || containsGroup(this.store, path);
    }

    proxy(): MutableMappingProxy<any> {
        return createProxy(this);
    }
}