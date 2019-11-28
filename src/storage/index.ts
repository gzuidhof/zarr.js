import { normalizeStoragePath, normalizeChunks, normalizeDtype, normalizeShape, normalizeOrder, normalizeFillValue } from '../util';
import { SyncStore, ValidStoreType, AsyncStore, Store } from './types';
import { ARRAY_META_KEY, GROUP_META_KEY } from '../names';
import { FillType, Order, Filter, Compressor, ZarrGroupMetadata, ChunksArgument, DtypeString, ZarrArrayMetadata } from '../types';
import { ContainsArrayError, ContainsGroupError } from '../errors';


/**
 * Return true if the store contains an array at the given logical path.
 */
export function containsArray(store: Store, path: string | null = null) {
    path = normalizeStoragePath(path);
    const prefix = pathToPrefix(path);
    const key = prefix + ARRAY_META_KEY;
    return store.containsItem(key);
}

/**
 * Return true if the store contains a group at the given logical path.
 */
export function containsGroup<T>(store: Store, path: string | null = null) {
    path = normalizeStoragePath(path);
    const prefix = pathToPrefix(path);
    const key = prefix + GROUP_META_KEY;
    return store.containsItem(key);
}


export function pathToPrefix(path: string): string {
    // assume path already normalized
    if (path.length > 0) {
        return path + '/';
    }
    return '';
}

function listDirFromKeys(store: Store, path: string): string[] {
    // assume path already normalized
    const prefix = pathToPrefix(path);
    const children = new Set<string>();

    for (const key in store.keys()) {
        if (key.startsWith(prefix) && key.length > prefix.length) {
            const suffix = key.slice(prefix.length);
            const child = suffix.split('/')[0];
            children.add(child);
        }
    }
    return Array.from(children).sort();
}

function requireParentGroup(store: Store, path: string, chunkStore: Store | null, overwrite: boolean) {
    // Assume path is normalized
    if (path.length === 0) {
        return;
    }

    const segments = path.split("/");
    let p = "";
    for (const s of segments.slice(0, segments.length - 1)) {
        p += s;
        if (containsArray(store, p)) {
            initGroupMetadata(store, p, chunkStore,
                overwrite);
        } else if (!containsGroup(store, p)) {
            initGroupMetadata(store, p, chunkStore);
        }
        p += "/";
    }
}

/**
 * Obtain a directory listing for the given path. If `store` provides a `listDir`
 *  method, this will be called, otherwise will fall back to implementation via the
 *  `MutableMapping` interface.
 * @param store 
 */
export async function listDir(store: Store, path: string | null = null) {
    path = normalizeStoragePath(path);
    if (store.listDir) {
        return store.listDir(path);
    } else {
        return listDirFromKeys(store, path);
    }
}

function initGroupMetadata(store: Store, path: string | null = null, chunkStore: null | Store = null, overwrite = false) {
    path = normalizeStoragePath(path);

    // Guard conditions
    if (overwrite) {
        throw Error("Group overwriting not implemented yet :(");
    } else if (containsArray(store, path)) {
        throw new ContainsArrayError(path);
    } else if (containsGroup(store, path)) {
        throw new ContainsGroupError(path);
    }

    const metadata: ZarrGroupMetadata = { zarr_format: 2 };
    const key = pathToPrefix(path) + GROUP_META_KEY;
    store.setItem(key, JSON.stringify(metadata));
}
/**
 *  Initialize a group store. Note that this is a low-level function and there should be no
 *  need to call this directly from user code.
 */
export function initGroup(store: Store, path: string | null = null, chunkStore: null | Store = null, overwrite = false) {
    path = normalizeStoragePath(path);
    requireParentGroup(store, path, chunkStore, overwrite);
    initGroupMetadata(store, path, chunkStore, overwrite);
}

function initArrayMetadata(
    store: Store,
    shape: number | number[],
    chunks: ChunksArgument,
    dtype: DtypeString,
    path: string,
    compressor: null | Compressor,
    fillValue: FillType,
    order: Order,
    overwrite: boolean,
    chunkStore: null | Store,
    filters: null | Filter[]
) {
    // Guard conditions
    if (overwrite) {
        throw Error("Array overwriting not implemented yet :(");
    } else if (containsArray(store, path)) {
        throw new ContainsArrayError(path);
    } else if (containsGroup(store, path)) {
        throw new ContainsGroupError(path);
    }

    // Normalize metadata,  does type checking too.
    dtype = normalizeDtype(dtype);
    shape = normalizeShape(shape);
    chunks = normalizeChunks(chunks, shape);
    order = normalizeOrder(order);
    fillValue = normalizeFillValue(fillValue);

    if (compressor !== null) {
        throw Error("Compressors are not supported yet");
    }

    if (filters !== null && filters.length > 0) {
        throw Error("Filters are not supported yet");
    }
    filters = null;

    const metadata: ZarrArrayMetadata = {
        zarr_format: 2,

        shape: shape,
        chunks: chunks as number[],

        dtype: dtype,
        fill_value: fillValue,
        order: order,
        compressor: compressor,
        filters: filters,
    };
    const metaKey = pathToPrefix(path) + ARRAY_META_KEY;
    store.setItem(metaKey, JSON.stringify(metadata));

}

/**
 * 
 * Initialize an array store with the given configuration. Note that this is a low-level
 * function and there should be no need to call this directly from user code
 */
export function initArray(
    store: Store,
    shape: number | number[],
    chunks: ChunksArgument,
    dtype: DtypeString,
    path: string | null = null,
    compressor: null | Compressor = null,
    fillValue: FillType = null,
    order: Order = "C",
    overwrite: boolean = false,
    chunkStore: null | Store = null,
    filters: null | Filter[] = null
) {

    path = normalizeStoragePath(path);
    requireParentGroup(store, path, chunkStore, overwrite);
    initArrayMetadata(store, shape, chunks, dtype, path, compressor, fillValue, order, overwrite, chunkStore, filters);
}

