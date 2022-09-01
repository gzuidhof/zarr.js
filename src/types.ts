export type ZarrMetadataType = ZarrArrayMetadata | ZarrGroupMetadata;
export type UserAttributes = Record<string, any>;

/**
 * A scalar value providing the default value to use for uninitialized portions of the array, or `null` if no fill_value is to be used.
 */
export type FillType = number | null;

export type FillTypeSerialized = number | 'NaN' | 'Infinity' | '-Infinity' | null;

/**
 * Either `"C"` or `"F"`, defining the layout of bytes within each chunk of the array. `“C”` means row-major order, i.e., the last dimension varies fastest; `“F”` means column-major order, i.e., the first dimension varies fastest.
 */
export type Order = 'C' | 'F';
/**
 * Currently supported dtypes are listed here only.
 */
export type DtypeString =
  | '|u1'
  | '|i1'
  | '|b'
  | '|B'
  | '<u1'
  | '<i1'
  | '<b'
  | '<B'
  | '<u2'
  | '<i2'
  | '<u4'
  | '<i4'
  | '<f2'
  | '<f4'
  | '<f8'
  | '>u1'
  | '>i1'
  | '>b'
  | '>B'
  | '>u2'
  | '>i2'
  | '>u4'
  | '>i4'
  | '>f4'
  | '>f2'
  | '>f8';

/**
 * User interface for chunking.
 * - `null` or `true`: Automatic chunking (zarr will try to guess an appropriate) - not supported yet.
 * - `false`: No chunking
 * - `(number | null)[]`: One entry per dimension, the list gets padded with `null` for missing dimensions.
 *   - `number > 0`: Chunks of given size along dimension.
 *   - `null` or `-1`: No chunking along this dimension.
 */
export type ChunksArgument = number | (number | null)[] | boolean | null;

export interface CompressorConfig {
  id: string;
}
export interface Filter {
  id: string;
}

export interface ZarrArrayMetadata {
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
   * A string or list defining a valid data type for the array. See https://zarr.readthedocs.io/en/stable/spec/v2.html#data-type-encoding.
   * Lists are not supported yet
   * Only a subset of types are supported in this library (for now), see the docs.
   */
  dtype: DtypeString; // | DtypeString[];

  /**
   * A JSON object identifying the primary compression codec and providing configuration parameters, or null if no compressor is to be used. The object MUST contain an "id" key identifying the codec to be used.
   */
  compressor: null | CompressorConfig & Record<string, any>;

  /**
   * A scalar value providing the default value to use for uninitialized portions of the array, or `null` if no fill_value is to be used.
   */
  fill_value: FillTypeSerialized;

  /**
   * Either `"C"` or `"F"`, defining the layout of bytes within each chunk of the array. `“C”` means row-major order, i.e., the last dimension varies fastest; `“F”` means column-major order, i.e., the first dimension varies fastest.
   */
  order: Order;

  /**
   * A list of JSON objects providing codec configurations, or `null` if no filters are to be applied. Each codec configuration object MUST contain a `"id"` key identifying the codec to be used.
   */
  filters: null | Filter[];


  /**
   * Separator placed between the dimensions of a chunk.
   */
  dimension_separator?: '.' | '/';
}

export interface ZarrGroupMetadata {
  /**
   * An integer defining the version of the storage specification to which the array store adheres.
   */
  zarr_format: 1 | 2;
}

/**
 * Persistence mode:
 * * 'r' means read only (must exist);
 * * 'r+' meansread/write (must exist);
 * * 'a' means read/write (create if doesn't exist);
 * * 'w' means create (overwrite if exists);
 * * 'w-' means create (fail if exists).
 */
export type PersistenceMode = 'r' | 'r+' | 'a' | 'w' | 'w-';
