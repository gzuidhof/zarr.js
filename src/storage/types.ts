import { MutableMapping, AsyncMutableMapping } from "../mutableMapping";

export type ValidStoreType = Buffer | string | ArrayBuffer;


export type Store<StoreGetOptions = any> = SyncStore<ValidStoreType, StoreGetOptions> | AsyncStore<ValidStoreType, StoreGetOptions>;

/**
 * This module contains storage classes for use with Zarr arrays and groups.
 * Note that any object implementing the `Store` interface found in types.ts can be used as a Zarr
 * array store, as long as it accepts `string` keys and `string` or `Buffer` values.
 * 
 * In addition to the `Store` interface, store classes may also implement
 * optional methods `listDir` (list members of a "directory") and `rmDir` (remove all
 * members of a "directory"). These methods should be implemented if the store class is
 * aware of the hierarchical organisation of resources within the store and can provide
 * efficient implementations. If these methods are not available, Zarr will fall back to
 * slower implementations that work via the `Store` interface.
 * 
 * Store classes may also optionally implement a `rename` method (rename all members under a given
 * path) and a `getSize` method (return the size in bytes of a given value).
 */
export interface SyncStore<T extends ValidStoreType, O=any> extends MutableMapping<T, O> {
    listDir?: (path?: string) => string[];
    rmDir?: (path?: string) => boolean;
    getSize?: (path?: string) => number;
    rename?: (path?: string) => void;
    keys(): string[];
}

/**
 * Async version of Store
 */
export interface AsyncStore<T extends ValidStoreType, O=any> extends AsyncMutableMapping<T, O> {
    listDir?: (path?: string) => Promise<string[]>;
    rmDir?: (path?: string) => Promise<boolean>;
    getSize?: (path?: string) => Promise<number>;
    rename?: (path?: string) => Promise<void>;
    keys(): Promise<string[]>;
}