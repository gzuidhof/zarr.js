import { MutableMapping } from './mutableMapping';
import { Store } from './storage/types';
import { normalizeStoragePath } from './util';
import { containsArray, pathToPrefix } from './storage/index';
import { ContainsArrayError } from './errors';


class Group<T> implements MutableMapping<T> {
    /**
     * A Store providing the underlying storage for the group.
     */
    public store: Store<T>;


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
        return "";
    }

    private chunkStore: Store<T> | null;
    private keyPrefix: string;
    private readOnly: boolean;

    constructor(store: Store<T>, path: string | null, readOnly = false, chunkStore: Store<T> | null, cacheAttrs = true) {
        this.store = store;
        this.chunkStore = chunkStore;
        this.path = normalizeStoragePath(path);
        this.keyPrefix = pathToPrefix(this.path);
        this.readOnly = readOnly;

        if (containsArray(store, this.path)) {
            throw new ContainsArrayError(this.path);
        }
    }

    getItem(item: string): T {
        throw new Error("Method not implemented.");
    }
    setItem(item: string, value: T): boolean {
        throw new Error("Method not implemented.");
    }
    deleteItem(item: string): boolean {
        throw new Error("Method not implemented.");
    }
    containsItem(item: string): boolean {
        throw new Error("Method not implemented.");
    }
    proxy(): import("./mutableMapping").MutableMappingProxy<T> {
        throw new Error("Method not implemented.");
    }
}