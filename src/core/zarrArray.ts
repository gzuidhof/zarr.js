import { Store, ValidStoreType } from "../storage/types";

import { pathToPrefix } from '../storage/index';
import { normalizeStoragePath } from "../util";
import { ZarrArrayMetadata, UserAttributes } from '../types';
import { ARRAY_META_KEY, ATTRS_META_KEY } from '../names';
import { Attributes } from "../attributes";
import { parseMetadata } from "../metadata";
export default class ZarrArray {

  public store: Store<ValidStoreType>;

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
  public path: string;
  public keyPrefix: string;
  public readOnly: boolean;
  public cacheMetadata: boolean;
  public cacheAttrs: boolean;
  public meta: ZarrArrayMetadata;
  public attrs: Attributes<UserAttributes>;

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

  /**
   * Final component of name.
   */
  public get basename(): string {
    const parts = this.name.split("/");
    return parts[parts.length - 1];
  }

  /**
   * "A list of integers describing the length of each dimension of the array.
   */
  public get shape(): number[] {
    this.refreshMetadata();
    return this.meta.shape;
  }

  /**
   * A list of integers describing the length of each dimension of a chunk of the array.
   */
  public get chunks(): number[] {
    return this.meta.chunks;
  }

  /**
   *  The NumPy data type.
   */
  public get dtype() {
    return this.meta.dtype;
  }

  /**
   *  A value used for uninitialized portions of the array.
   */
  public get fillValue() {
    return this.meta.fill_value;
  }

  /**
   *  Number of dimensions.
   */
  public get nDims() {
    return this.meta.shape.length;
  }

  /**
   *  The total number of elements in the array.
   */
  public get size() {
    this.refreshMetadata();
    return this.meta.shape.reduce((x, y) => x * y, 1);
  }

  public get length() {
    return this.shape[0];
  }



  /**
   * Instantiate an array from an initialized store.
   * @param store Array store, already initialized.
   * @param path Storage path.
   * @param readOnly True if array should be protected against modification.
   * @param chunkStore Separate storage for chunks. If not provided, `store` will be used for storage of both chunks and metadata.
   * @param cacheMetadata If true (default), array configuration metadata will be cached for the lifetime of the object.
   * If false, array metadata will be reloaded prior to all data access and modification operations (may incur overhead depending on storage and data access pattern).
   * @param cacheAttrs If true (default), user attributes will be cached for attribute read operations.
   * If false, user attributes are reloaded from the store prior to all attribute read operations.
   */
  constructor(store: Store<ValidStoreType>, path: string | null = null, readOnly = false, chunkStore: Store<ValidStoreType> | null, cacheMetadata = true, cacheAttrs = true) {
    // N.B., expect at this point store is fully initialized with all
    // configuration metadata fully specified and normalized

    this.store = store;
    this._chunkStore = chunkStore;
    this.path = normalizeStoragePath(path);
    this.keyPrefix = pathToPrefix(this.path);
    this.readOnly = readOnly;
    this.cacheMetadata = cacheMetadata;
    this.cacheAttrs = cacheAttrs;
    this.meta = this.loadMetadata();

    const attrKey = this.keyPrefix + ATTRS_META_KEY;
    this.attrs = new Attributes<UserAttributes>(this.store, attrKey, this.readOnly, cacheAttrs);
  }

  /**
   * (Re)load metadata from store
   */
  private loadMetadata() {
    const metaKey = this.keyPrefix + ARRAY_META_KEY;
    const metaStoreValue = this.store.getItem(metaKey);
    this.meta = parseMetadata(metaStoreValue);
    return this.meta;
  }

  private refreshMetadata() {
    if (!this.cacheMetadata) {
      this.loadMetadata();
    }
  }
}
