import { ChunksArgument, DtypeString, Compressor, Order, Filter, FillType } from './types';
import { Store, ValidStoreType } from './storage/types';
import { ZarrArray } from './core/index';
import { MemoryStore } from './storage/memoryStore';
import { initArray } from './storage/index';
import { TypedArray } from './nestedArray/types';
import { NestedArray } from './nestedArray/index';

/**
 * See `create` function for type signature of these values
 */
export interface CreateArrayOptions {
    chunks?: ChunksArgument;
    dtype?: DtypeString;
    compressor?: Compressor | null;
    fillValue?: FillType;
    order?: Order;
    store?: Store<ValidStoreType>;
    overwrite?: boolean;
    path?: string;
    chunkStore?: Store<Buffer>;
    filters?: Filter[];
    cacheMetadata?: boolean;
    cacheAttrs?: boolean;
    readOnly?: boolean;
}


export function create(shape: number | number[], opts: CreateArrayOptions = {}) {
    return createWithArguments(
        shape,
        opts.chunks,
        opts.dtype,
        opts.compressor,
        opts.fillValue,
        opts.order,
        opts.store,
        opts.overwrite,
        opts.path,
        opts.chunkStore,
        opts.filters,
        opts.cacheMetadata,
        opts.cacheAttrs,
        opts.readOnly,
    );
}

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
 */
export function createWithArguments(
    shape: number | number[],
    chunks: ChunksArgument = true,
    dtype: DtypeString = "<u1",
    compressor: Compressor | null = null,
    fillValue: FillType = 0,
    order: Order = "C",
    store?: Store<ValidStoreType>,
    overwrite: boolean = false,
    path?: string,
    chunkStore?: Store<Buffer>,
    filters?: Filter[],
    cacheMetadata: boolean = true,
    cacheAttrs: boolean = true,
    readOnly: boolean = false,
): ZarrArray {

    store = normalizeStoreArgument(store);

    initArray(store, shape, chunks, dtype, path, compressor, fillValue, order, overwrite, chunkStore, filters);
    const z = new ZarrArray(store, path, readOnly, chunkStore, cacheMetadata, cacheAttrs);

    return z;
}


/**
 * Create an empty array.
 */
export function empty(shape: number | number[], opts: CreateArrayOptions = {}) {
    opts.fillValue = null;
    return create(shape, opts);
}

/**
 * Create an array, with zero being used as the default value for
 * uninitialized portions of the array.
 */
export function zeros(shape: number | number[], opts: CreateArrayOptions = {}) {
    opts.fillValue = 0;
    return create(shape, opts);
}

/**
 * Create an array, with one being used as the default value for
 * uninitialized portions of the array.
 */
export function ones(shape: number | number[], opts: CreateArrayOptions = {}) {
    opts.fillValue = 1;
    return create(shape, opts);
}

/**
 * Create an array, with `fill_value` being used as the default value for
 * uninitialized portions of the array
 */
export function full(shape: number | number[], fillValue: FillType, opts: CreateArrayOptions = {}) {
    opts.fillValue = fillValue;
    return create(shape, opts);
}

export function array(data: Buffer | ArrayBuffer | NestedArray<TypedArray>, opts: CreateArrayOptions = {}) {
    // TODO: infer chunks?


    let shape = null;
    if (data instanceof NestedArray) {
        shape = data.shape;
        opts.dtype = data.dtype;
    } else {
        shape = data.byteLength;
        // TODO: infer datatype
    }

    const wasReadOnly = opts.readOnly;
    opts.readOnly = false;

    const z = create(shape, opts);
    z.set(null, data);

    opts.readOnly = wasReadOnly;
    z.readOnly = false;

    return z;

}


export function normalizeStoreArgument<T extends ValidStoreType>(store?: Store<T>): Store<T> {
    if (store === undefined) {
        return new MemoryStore();
    }
    return store;
}