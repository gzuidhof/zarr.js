import { MutableMapping } from "../mutableMapping";

export type ValidStoreType = Buffer | string | ArrayBuffer;

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

export interface Store<T extends ValidStoreType> extends MutableMapping<T> {
    listDir?: (path?: string) => string[];
    rmDir?: (path?: string) => boolean;
    getSize?: (path?: string) => number;
    rename?: (path?: string) => void;
    keys(): string[];
}