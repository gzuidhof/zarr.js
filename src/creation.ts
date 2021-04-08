import { ChunksArgument, DtypeString, CompressorConfig, Order, Filter, FillType, PersistenceMode } from './types';
import { Store } from './storage/types';
import { ZarrArray } from './core/index';
import { MemoryStore } from './storage/memoryStore';
import { initArray, containsArray, containsGroup } from './storage/index';
import { TypedArray } from './nestedArray/types';
import { NestedArray } from './nestedArray/index';
import { normalizeStoragePath } from './util';
import { ContainsArrayError, ValueError, ArrayNotFoundError, ContainsGroupError } from './errors';
import { HTTPStore } from './storage/httpStore';

export type CreateArrayOptions = {
    shape: number | number[];
    chunks?: ChunksArgument;
    dtype?: DtypeString;
    compressor?: CompressorConfig | null;
    fillValue?: FillType;
    order?: Order;
    store?: Store;
    overwrite?: boolean;
    path?: string | null;
    chunkStore?: Store;
    filters?: Filter[];
    cacheMetadata?: boolean;
    cacheAttrs?: boolean;
    readOnly?: boolean;
    dimensionSeparator?: string;
};

/**
 * 
 * @param shape Array shape.
 * @param chunks  Chunk shape. If `true`, will be guessed from `shape` and `dtype`. If
 *      `false`, will be set to `shape`, i.e., single chunk for the whole array.
 *      If an int, the chunk size in each dimension will be given by the value
 *      of `chunks`. Default is `true`.
 * @param dtype NumPy dtype.
 * @param compressor Primary compressor.
 * @param fillValue Default value to use for uninitialized portions of the array.
 * @param order Memory layout to be used within each chunk.
 * @param store Store or path to directory in file system or name of zip file.
 * @param overwrite  If True, delete all pre-existing data in `store` at `path` before creating the array.
 * @param path Path under which array is stored.
 * @param chunkStore Separate storage for chunks. If not provided, `store` will be used for storage of both chunks and metadata.
 * @param filters Sequence of filters to use to encode chunk data prior to compression.
 * @param cacheMetadata If `true` (default), array configuration metadata will be cached for the
 *      lifetime of the object. If `false`, array metadata will be reloaded
 *      prior to all data access and modification operations (may incur
 *      overhead depending on storage and data access pattern).
 * @param cacheAttrs If `true` (default), user attributes will be cached for attribute read
 *      operations. If `false`, user attributes are reloaded from the store prior
 *      to all attribute read operations.
 * @param readOnly `true` if array should be protected against modification, defaults to `false`.
 * @param dimensionSeparator if specified, defines an alternate string separator placed between the dimension chunks.
 */
export async function create(
    { shape, chunks = true, dtype = "<i4", compressor = null, fillValue = null, order = "C", store, overwrite = false, path, chunkStore, filters, cacheMetadata = true, cacheAttrs = true, readOnly = false, dimensionSeparator }: CreateArrayOptions,
): Promise<ZarrArray> {

    store = normalizeStoreArgument(store);

    await initArray(store, shape, chunks, dtype, path, compressor, fillValue, order, overwrite, chunkStore, filters, dimensionSeparator);
    const z = await ZarrArray.create(store, path, readOnly, chunkStore, cacheMetadata, cacheAttrs);

    return z;
}


/**
 * Create an empty array.
 */
export async function empty(shape: number | number[], opts: Omit<CreateArrayOptions, 'shape'> = {}) {
    opts.fillValue = null;
    return create({ shape, ...opts });
}

/**
 * Create an array, with zero being used as the default value for
 * uninitialized portions of the array.
 */
export async function zeros(shape: number | number[], opts: Omit<CreateArrayOptions, 'shape'> = {}) {
    opts.fillValue = 0;
    return create({ shape, ...opts });
}

/**
 * Create an array, with one being used as the default value for
 * uninitialized portions of the array.
 */
export async function ones(shape: number | number[], opts: Omit<CreateArrayOptions, 'shape'> = {}) {
    opts.fillValue = 1;
    return create({ shape, ...opts });
}

/**
 * Create an array, with `fill_value` being used as the default value for
 * uninitialized portions of the array
 */
export async function full(shape: number | number[], fillValue: FillType, opts: Omit<CreateArrayOptions, 'shape'> = {}) {
    opts.fillValue = fillValue;
    return create({ shape, ...opts });
}

export async function array(data: Buffer | ArrayBuffer | NestedArray<TypedArray>, opts: Omit<CreateArrayOptions, 'shape'> = {}) {
    // TODO: infer chunks?

    let shape = null;
    if (data instanceof NestedArray) {
        shape = data.shape;
        opts.dtype = opts.dtype === undefined ? data.dtype : opts.dtype;
    } else {
        shape = data.byteLength;
        // TODO: infer datatype
    }
    // TODO: support TypedArray

    const wasReadOnly = opts.readOnly === undefined ? false : opts.readOnly;
    opts.readOnly = false;

    const z = await create({ shape, ...opts });
    await z.set(null, data);
    z.readOnly = wasReadOnly;

    return z;
}

type OpenArrayOptions = Partial<CreateArrayOptions & { mode: PersistenceMode }>;

export async function openArray(
    { shape, mode = "a", chunks = true, dtype = "<i4", compressor = null, fillValue = null, order = "C", store, overwrite = false, path = null, chunkStore, filters, cacheMetadata = true, cacheAttrs = true, dimensionSeparator }: OpenArrayOptions = {},
) {
    store = normalizeStoreArgument(store);
    if (chunkStore === undefined) {
        chunkStore = normalizeStoreArgument(store);
    }
    path = normalizeStoragePath(path);

    if (mode === "r" || mode === "r+") {
        if (!await containsArray(store, path)) {
            if (await containsGroup(store, path)) {
                throw new ContainsGroupError(path);
            }
            throw new ArrayNotFoundError(path);
        }
    } else if (mode === "w") {

        if (shape === undefined) {
            throw new ValueError("Shape can not be undefined when creating a new array");
        }
        await initArray(store, shape, chunks, dtype, path, compressor, fillValue, order, overwrite, chunkStore, filters, dimensionSeparator);

    } else if (mode === "a") {
        if (!await containsArray(store, path)) {
            if (await containsGroup(store, path)) {
                throw new ContainsGroupError(path);
            }
            if (shape === undefined) {
                throw new ValueError("Shape can not be undefined when creating a new array");
            }
            await initArray(store, shape, chunks, dtype, path, compressor, fillValue, order, overwrite, chunkStore, filters, dimensionSeparator);
        }
    } else if (mode === "w-" || (mode as any) === "x") {
        if (await containsArray(store, path)) {
            throw new ContainsArrayError(path);
        } else if (await containsGroup(store, path)) {
            throw new ContainsGroupError(path);
        } else {
            if (shape === undefined) {
                throw new ValueError("Shape can not be undefined when creating a new array");
            }
            await initArray(store, shape, chunks, dtype, path, compressor, fillValue, order, overwrite, chunkStore, filters, dimensionSeparator);
        }
    } else {
        throw new ValueError(`Invalid mode argument: ${mode}`);
    }

    const readOnly = mode === "r";
    return ZarrArray.create(store, path, readOnly, chunkStore, cacheMetadata, cacheAttrs);
}


export function normalizeStoreArgument(store?: Store | string): Store {
    if (store === undefined) {
        return new MemoryStore();
    } else if (typeof store === "string") {
        return new HTTPStore(store);
    }
    return store;
}