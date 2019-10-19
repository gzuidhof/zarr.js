import { Store, ValidStoreType } from "./storage/types";

import { pathToPrefix } from './storage/index';
import { normalizeStoragePath } from "./util";
import { ZarrMetadata, UserAttributes } from './types';
import { ARRAY_META_KEY, ATTRS_META_KEY } from './names';
import { Attributes } from "./attributes";
import { parseMetadata } from "./metadata";
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
  public meta: ZarrMetadata;
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
