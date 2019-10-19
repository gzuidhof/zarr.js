export type ZarrMetadataType = ZarrMetadata | ZarrGroupMetadata;
export type UserAttributes = object;

/**
 * A scalar value providing the default value to use for uninitialized portions of the array, or `null` if no fill_value is to be used.
 */
export type FillType = number | "NaN" | "Infinity" | "-Infinity" | null;
export type Order = "C" | "F";

export type ChunksArgument = number | (number | null)[] | boolean | null;

export interface Compressor {
    id: string;
}
export interface Filter {
    id: string;
}

export interface ZarrMetadata {

    /**
     * An integer defining the version of the storage specification to which the array store adheres.
     */
    zarr_format: 1 | 2;

    /**
     * A list of integers defining the length of each dimension of the array.
     */
    shape: number[];

    /**
     * A list of integers defining the length of each dimension of a chunk of the array. Note that all chunks within a Zarr array have the same shape.
     */
    chunks: number[];

    /**
     * A string or list defining a valid data type for the array. See https://zarr.readthedocs.io/en/stable/spec/v2.html#data-type-encoding
     */
    dtype: string | string[];

    /**
     * A JSON object identifying the primary compression codec and providing configuration parameters, or null if no compressor is to be used. The object MUST contain an "id" key identifying the codec to be used.
     */
    compressor: null | {
        id: string;
    };

    /**
     * A scalar value providing the default value to use for uninitialized portions of the array, or `null` if no fill_value is to be used.
     */
    fill_value: FillType;

    /**
     * Either `"C"` or `"F"`, defining the layout of bytes within each chunk of the array. `“C”` means row-major order, i.e., the last dimension varies fastest; `“F”` means column-major order, i.e., the first dimension varies fastest.
     */
    order: Order;

    /**
     * A list of JSON objects providing codec configurations, or `null` if no filters are to be applied. Each codec configuration object MUST contain a `"id"` key identifying the codec to be used.
     */
    filters: null | Filter[];
}

export interface ZarrGroupMetadata {
    zarr_format: 1 | 2;
}